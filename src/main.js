import './style.css'

const TODO_KEY = 'schedule-timeline.todos'
const SETTINGS_KEY = 'schedule-timeline.settings'

const state = {
  items: [],
  settings: {
    baseUrl: '',
    apiKey: '',
    model: ''
  },
  selectedDate: formatDate(new Date()),
  text: '',
  loading: false,
  notice: null,
  settingsOpen: false
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDate(value) {
  const [y, m, d] = String(value).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function shiftDate(value, days) {
  const date = parseDate(value)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

function weekdayLabel(value) {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return names[parseDate(value).getDay()]
}

function loadStore() {
  try {
    const todos = JSON.parse(localStorage.getItem(TODO_KEY) || '[]')
    if (Array.isArray(todos)) state.items = todos
  } catch {
    state.items = []
  }
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    state.settings = {
      baseUrl: String(settings.baseUrl || ''),
      apiKey: String(settings.apiKey || ''),
      model: String(settings.model || '')
    }
  } catch {
    state.settings = { baseUrl: '', apiKey: '', model: '' }
  }
}

function saveTodos() {
  try {
    localStorage.setItem(TODO_KEY, JSON.stringify(state.items))
  } catch {
    showNotice('当前结果已展示，但未能写入浏览器本地存储', 'warn')
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings))
    showNotice('API 设置已保存', 'ok')
  } catch {
    showNotice('设置未能写入浏览器本地存储', 'warn')
  }
}

function showNotice(message, type = 'error') {
  state.notice = { message, type }
  render()
}

function clearNotice() {
  state.notice = null
}

function itemsForDate(date) {
  return state.items
    .filter((item) => item.date === date)
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title))
}

function mergeItems(newItems) {
  const dates = new Set(newItems.map((item) => item.date))
  const kept = state.items.filter((item) => !dates.has(item.date))
  state.items = [...kept, ...newItems]
  saveTodos()
}

async function parseSchedule() {
  const text = state.text.trim()
  if (!text) {
    showNotice('请先粘贴日程文本', 'error')
    return
  }
  const { baseUrl, apiKey, model } = state.settings
  if (!baseUrl.trim() || !apiKey.trim() || !model.trim()) {
    state.settingsOpen = true
    showNotice('请先补全 API 设置：Base URL、API Key 和模型名', 'error')
    return
  }

  state.loading = true
  clearNotice()
  render()

  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        model: model.trim(),
        text,
        today: formatDate(new Date())
      })
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload.message || '解析失败')
    }
    const items = Array.isArray(payload.items) ? payload.items : []
    if (items.length === 0) {
      throw new Error('没有识别到有效的日程条目')
    }
    mergeItems(items)
    const firstDate = items
      .map((item) => item.date)
      .sort()
      .includes(state.selectedDate)
      ? state.selectedDate
      : items[0].date
    state.selectedDate = firstDate
    state.text = ''
    showNotice(`已解析 ${items.length} 条日程`, 'ok')
  } catch (error) {
    showNotice(error instanceof Error ? error.message : '解析失败', 'error')
  } finally {
    state.loading = false
    render()
  }
}

function bindEvents() {
  const textArea = document.querySelector('#schedule-text')
  if (textArea) {
    textArea.addEventListener('input', (event) => {
      state.text = event.target.value
    })
  }

  document.querySelector('#parse-btn')?.addEventListener('click', () => {
    parseSchedule()
  })

  document.querySelector('#prev-day')?.addEventListener('click', () => {
    state.selectedDate = shiftDate(state.selectedDate, -1)
    clearNotice()
    render()
  })

  document.querySelector('#next-day')?.addEventListener('click', () => {
    state.selectedDate = shiftDate(state.selectedDate, 1)
    clearNotice()
    render()
  })

  document.querySelector('#today-btn')?.addEventListener('click', () => {
    state.selectedDate = formatDate(new Date())
    clearNotice()
    render()
  })

  document.querySelector('#date-input')?.addEventListener('change', (event) => {
    const value = event.target.value
    if (value) {
      state.selectedDate = value
      clearNotice()
      render()
    }
  })

  document.querySelector('#toggle-settings')?.addEventListener('click', () => {
    state.settingsOpen = !state.settingsOpen
    render()
  })

  document.querySelector('#save-settings')?.addEventListener('click', () => {
    const baseUrl = document.querySelector('#base-url')?.value || ''
    const apiKey = document.querySelector('#api-key')?.value || ''
    const model = document.querySelector('#model-name')?.value || ''
    state.settings = {
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim()
    }
    saveSettings()
    render()
  })
}

function renderTimeline(items) {
  if (items.length === 0) {
    return `
      <div class="empty">
        <p>这一天还没有日程</p>
        <span>粘贴一段含时间和事件的文字，点解析即可生成时间轴</span>
      </div>
    `
  }

  return `
    <ol class="timeline">
      ${items
        .map(
          (item) => `
        <li class="timeline-item">
          <div class="time">${item.time}</div>
          <div class="dot"></div>
          <div class="card">
            <p class="title">${escapeHtml(item.title)}</p>
          </div>
        </li>
      `
        )
        .join('')}
    </ol>
  `
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function render() {
  const app = document.querySelector('#app')
  const dayItems = itemsForDate(state.selectedDate)
  const today = formatDate(new Date())
  const isToday = state.selectedDate === today
  const notice = state.notice
    ? `<div class="notice ${state.notice.type}">${escapeHtml(state.notice.message)}</div>`
    : ''

  app.innerHTML = `
    <div class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">个人效率工具</p>
          <h1>日程轴</h1>
          <p class="lead">把含时间和事件的文字贴进去，生成当天可切换的时间轴。</p>
        </div>
        <button id="toggle-settings" class="ghost" type="button">
          ${state.settingsOpen ? '收起 API 设置' : 'API 设置'}
        </button>
      </header>

      <section class="settings ${state.settingsOpen ? 'open' : ''}">
        <div class="field-grid">
          <label>
            Base URL
            <input id="base-url" type="url" placeholder="https://api.openai.com/v1" value="${escapeHtml(state.settings.baseUrl)}" />
          </label>
          <label>
            API Key
            <input id="api-key" type="password" placeholder="sk-..." value="${escapeHtml(state.settings.apiKey)}" />
          </label>
          <label>
            模型名
            <input id="model-name" type="text" placeholder="gpt-4o-mini" value="${escapeHtml(state.settings.model)}" />
          </label>
        </div>
        <button id="save-settings" class="secondary" type="button">保存设置</button>
      </section>

      <section class="composer">
        <label class="block-label" for="schedule-text">日程原文</label>
        <textarea
          id="schedule-text"
          rows="7"
          placeholder="例如：明天下午 3 点开会，周五 09:30 去医院，今晚 20:00 跑步。"
          ${state.loading ? 'disabled' : ''}
        >${escapeHtml(state.text)}</textarea>
        <div class="composer-actions">
          <button id="parse-btn" class="primary" type="button" ${state.loading ? 'disabled' : ''}>
            ${state.loading ? '正在解析...' : '解析为时间轴'}
          </button>
          <p class="hint">同一天的新结果会覆盖该日旧条目，其他日期会保留。</p>
        </div>
      </section>

      ${notice}

      <section class="board">
        <div class="date-bar">
          <button id="prev-day" class="icon-btn" type="button" aria-label="前一天">‹</button>
          <div class="date-meta">
            <input id="date-input" type="date" value="${state.selectedDate}" />
            <p>${weekdayLabel(state.selectedDate)}${isToday ? ' · 今天' : ''}</p>
          </div>
          <button id="next-day" class="icon-btn" type="button" aria-label="后一天">›</button>
          <button id="today-btn" class="chip" type="button">回到今天</button>
        </div>
        ${renderTimeline(dayItems)}
      </section>
    </div>
  `

  bindEvents()
}

loadStore()
render()
