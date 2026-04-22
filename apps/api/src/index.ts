/**
 * PropertyPulse API — Entry Point
 *
 * Bun + Hono server with multi-tenant SQLite, Better Auth,
 * and role-based access control.
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { auth } from './auth'
import { tenantMiddleware } from './middleware/tenant'
import { auditMiddleware } from './middleware/audit'

// Route modules
import residentsRoutes from './routes/residents'
import pagosRoutes from './routes/pagos'
import egresosRoutes from './routes/egresos'
import ticketsRoutes from './routes/tickets'
import avisosRoutes from './routes/avisos'
import paquetesRoutes from './routes/paquetes'
import amenidadesRoutes from './routes/amenidades'
import votacionesRoutes from './routes/votaciones'
import inventoryRoutes from './routes/inventory'
import configRoutes from './routes/config'
import dashboardRoutes from './routes/dashboard'
import auditRoutes from './routes/audit'
import systemRoutes from './routes/system'

const app = new Hono()

// ─── Global Middleware ───────────────────────────────────────────────

app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  exposeHeaders: ['Set-Cookie'],
}))

// ─── Health Check (no auth) ──────────────────────────────────────────

app.get('/health', (c) => c.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '0.1.0',
}))

// ─── Better Auth Routes (no tenant middleware) ───────────────────────

app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw)
})

// ─── Public Endpoint: App Mode (no auth required) ───────────────────

app.get('/api/app-mode', (c) => c.json({
  mode: process.env.APP_MODE || 'production',
}))

// ─── Public Endpoint: Demo Accounts (no auth required) ───────────────
//
// Returns all login accounts available for the demo tenant.
// In production returns an empty array — this endpoint is safe to expose
// because demo passwords are intentionally public (printed in seed logs,
// README, etc). Never returns real user data in production.

app.get('/api/demo/accounts', async (c) => {
  const isDemo = (process.env.APP_MODE || 'production') === 'demo'
  if (!isDemo) return c.json({ accounts: [] })

  try {
    const { rawMasterDb } = await import('./db/master')

    // Fetch all users associated with the demo tenant
    const rows = rawMasterDb.query(`
      SELECT u.email, ut.role, ut.apartment
      FROM user_tenants ut
      JOIN user u ON u.id = ut.user_id
      WHERE ut.tenant_id = 'demo'
      ORDER BY
        CASE ut.role
          WHEN 'super_admin'    THEN 1
          WHEN 'administracion' THEN 2
          WHEN 'operador'       THEN 3
          WHEN 'residente'      THEN 4
          ELSE 5
        END,
        ut.apartment ASC
    `).all() as { email: string; role: string; apartment: string | null }[]

    const accounts = rows.map(row => ({
      email:    row.email,
      role:     row.role,
      label:    row.role === 'super_admin'
                  ? 'Super Admin'
                  : row.role === 'administracion'
                    ? 'Administración'
                    : row.role === 'operador'
                      ? 'Operador'
                      : `Residente ${row.apartment ?? ''}`.trim(),
      // Password is role-derived — Better Auth hashes prevent reading from DB
      password: row.role === 'super_admin' ? 'admin123' : 'demo123',
    }))

    return c.json({ accounts })
  } catch (e: any) {
    return c.json({ accounts: [], error: e.message }, 500)
  }
})

// ─── Authenticated (no tenant): User Info ────────────────────────────

app.get('/api/me', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Look up user's tenant + role from master.db
  const { rawMasterDb } = await import('./db/master')
  const tenantRow = rawMasterDb
    .query('SELECT tenant_id, role, apartment FROM user_tenants WHERE user_id = ? LIMIT 1')
    .get(session.user.id) as { tenant_id: string; role: string; apartment: string | null } | null

  return c.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
    tenant: tenantRow ? {
      id: tenantRow.tenant_id,
      role: tenantRow.role,
      apartment: tenantRow.apartment,
    } : null,
  })
})

// ─── Tenant-Scoped API Routes ───────────────────────────────────────

const api = new Hono()
api.use('*', tenantMiddleware)
api.use('*', auditMiddleware)

api.route('/residents', residentsRoutes)
api.route('/pagos', pagosRoutes)
api.route('/egresos', egresosRoutes)
api.route('/tickets', ticketsRoutes)
api.route('/avisos', avisosRoutes)
api.route('/paquetes', paquetesRoutes)
api.route('/amenidades', amenidadesRoutes)
api.route('/votaciones', votacionesRoutes)
api.route('/inventory', inventoryRoutes)
api.route('/config', configRoutes)
api.route('/dashboard', dashboardRoutes)
api.route('/audit', auditRoutes)
api.route('/system', systemRoutes)

app.route('/api', api)

// ─── Error Handler ───────────────────────────────────────────────────

app.onError((err, c) => {
  console.error('[ERROR]', err.message, err.stack)
  return c.json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  }, 500)
})

app.notFound((c) => c.json({ error: 'Not Found', path: c.req.path }, 404))

// ─── Start Server ────────────────────────────────────────────────────

const port = Number(process.env.PORT) || 3000

console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   PropertyPulse API v0.1.0                       ║
  ║   http://localhost:${port}                          ║
  ║                                                  ║
  ║   Auth:   /api/auth/**                           ║
  ║   API:    /api/{resource}  (X-Tenant-ID header)  ║
  ║   Health: /health                                ║
  ╚══════════════════════════════════════════════════╝
`)

export default {
  port,
  fetch: app.fetch,
}
