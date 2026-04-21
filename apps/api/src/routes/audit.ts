/**
 * Audit Log API Routes
 *
 * Read-only access to the tenant's audit trail.
 * Only super_admin and administracion roles can view audit logs.
 *
 * The audit_log table is append-only — no update/delete endpoints exist.
 */
import { Hono } from 'hono'
import { desc, eq, and, gte, lte } from 'drizzle-orm'
import { auditLog } from '../db/schema/tenant'
import { adminOnly } from '../middleware/rbac'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

// GET /api/audit — list audit log entries (admin only)
// Query params:
//   ?actor_id=xxx     — filter by actor
//   ?resource=xxx     — filter by resource path (prefix match)
//   ?from=ISO8601     — entries after this date
//   ?to=ISO8601       — entries before this date
//   ?limit=50         — max entries to return (default 50, max 200)
app.get('/', adminOnly, async (c) => {
  const db = c.get('db') as any
  const limit = Math.min(Number(c.req.query('limit')) || 50, 200)

  // Build query — always ordered by most recent first
  let query = db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit)

  const actorId = c.req.query('actor_id')
  if (actorId) {
    query = query.where(eq(auditLog.actorId, actorId))
  }

  const from = c.req.query('from')
  if (from) {
    query = query.where(gte(auditLog.createdAt, from))
  }

  const to = c.req.query('to')
  if (to) {
    query = query.where(lte(auditLog.createdAt, to))
  }

  const results = await query
  return c.json(results)
})

export default app
