/**
 * PropertyPulse API — Entry Point
 * 
 * Bun + Hono server with WebSocket support, multi-tenant SQLite,
 * and Better Auth authentication.
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'

const app = new Hono()

// ─── Global Middleware ───────────────────────────────────────────────

app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

// ─── Health Check ────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString(),
  version: '0.1.0',
}))

// ─── API Routes (wired in Phase E) ──────────────────────────────────

app.get('/api', (c) => c.json({ 
  message: 'PropertyPulse API',
  docs: '/api/docs',
}))

// ─── Start Server ────────────────────────────────────────────────────

const port = Number(process.env.PORT) || 3000

console.log(`
  ╔══════════════════════════════════════╗
  ║   PropertyPulse API                  ║
  ║   http://localhost:${port}              ║
  ╚══════════════════════════════════════╝
`)

export default {
  port,
  fetch: app.fetch,
}
