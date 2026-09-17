import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseScheduleRequest } from './src/lib/parse.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '1mb' }))

app.post('/api/parse', async (req, res) => {
  try {
    const response = await parseScheduleRequest(req.body || {})
    const payload = await response.json()
    res.status(response.status).json(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : '解析请求失败'
    res.status(500).json({ message: `解析失败：${message}` })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

const distDir = path.join(__dirname, 'dist')
app.use(express.static(distDir))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next()
  }
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next()
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`schedule-timeline api listening on ${PORT}`)
})
