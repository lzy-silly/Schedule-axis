import { jsonResponse, parseScheduleRequest } from '../../src/lib/parse.js'

export async function onRequestPost(context) {
  try {
    const input = await context.request.json()
    return await parseScheduleRequest(input)
  } catch (error) {
    const message = error instanceof Error ? error.message : '解析请求失败'
    return jsonResponse({ message: `解析失败：${message}` }, 500)
  }
}

export async function onRequest() {
  return jsonResponse({ message: '请使用 POST 调用解析接口' }, 405)
}
