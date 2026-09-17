export function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').trim().replace(/\/+$/, '')
}

export function extractJsonArray(text) {
  const raw = String(text || '').trim()
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced ? fenced[1] : raw).trim()
  const start = candidate.indexOf('[')
  const end = candidate.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('模型未返回 JSON 数组')
  }
  return JSON.parse(candidate.slice(start, end + 1))
}

export function normalizeItems(items) {
  if (!Array.isArray(items)) {
    throw new Error('解析结果不是数组')
  }
  const dateRe = /^\d{4}-\d{2}-\d{2}$/
  const timeRe = /^\d{2}:\d{2}$/
  return items
    .map((item, index) => {
      const title = String(item?.title || '').trim()
      const date = String(item?.date || '').trim()
      let time = String(item?.time || '').trim()
      if (/^\d{1}:\d{2}$/.test(time)) {
        time = `0${time}`
      }
      if (!title || !dateRe.test(date) || !timeRe.test(time)) {
        return null
      }
      return {
        id: `${date}-${time}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        date,
        time
      }
    })
    .filter(Boolean)
}

export function buildSystemPrompt(todayStr) {
  return [
    '你是日程解析器。从用户文本中提取独立事件。',
    '只输出 JSON 数组，不要 Markdown，不要解释。',
    '每项必须是对象，字段严格为 title、date、time。',
    'title 为简短中文事件名。',
    'date 为 YYYY-MM-DD。',
    'time 为 24 小时制 HH:mm。',
    `今天是 ${todayStr || '未知日期'}，相对日期按今天推算。`,
    '若只有时间没有日期，date 使用今天。',
    '若只有日期没有具体时刻，time 使用 09:00。',
    '忽略无法理解的句子。'
  ].join('')
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}

export async function parseScheduleRequest(input) {
  const scheduleText = String(input?.text || '').trim()
  const resolvedBase = normalizeBaseUrl(input?.baseUrl)
  const resolvedKey = String(input?.apiKey || '').trim()
  const resolvedModel = String(input?.model || '').trim()
  const todayStr = String(input?.today || '').trim()

  if (!scheduleText) {
    return jsonResponse({ message: '请先粘贴日程文本' }, 400)
  }
  if (!resolvedBase || !resolvedKey || !resolvedModel) {
    return jsonResponse({ message: '请先补全 API 设置：Base URL、API Key 和模型名' }, 400)
  }

  const upstream = await fetch(`${resolvedBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resolvedKey}`
    },
    body: JSON.stringify({
      model: resolvedModel,
      temperature: 0,
      messages: [
        { role: 'system', content: buildSystemPrompt(todayStr) },
        { role: 'user', content: scheduleText }
      ]
    })
  })

  const payload = await upstream.json().catch(() => null)
  if (!upstream.ok) {
    const detail =
      payload?.error?.message ||
      payload?.message ||
      `上游接口返回 ${upstream.status}`
    return jsonResponse({ message: `解析失败：${detail}` }, 502)
  }

  const content = payload?.choices?.[0]?.message?.content
  const parsed = normalizeItems(extractJsonArray(content))
  if (parsed.length === 0) {
    return jsonResponse({ message: '没有识别到有效的日程条目' }, 422)
  }
  return jsonResponse({ items: parsed })
}
