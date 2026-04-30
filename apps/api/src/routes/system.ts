/**
 * System Routes — Administrative system operations.
 *
 * POST /factory-reset
 *   Wipes all operational data from the tenant database while
 *   preserving the schema. Removes demo resident accounts from
 *   the master auth database. Only super_admin can execute.
 *
 *   After this call, the system is in a "Phase 1" state:
 *     - Tenant registration exists
 *     - Super admin account exists
 *     - All data tables are empty
 */
import { Hono } from 'hono'
import { requireRole } from '../middleware/rbac'
import { tenantDB } from '../db/tenant'
import { rawMasterDb } from '../db/master'
import type { AppEnv } from '../types'

const systemRoutes = new Hono<AppEnv>()

/**
 * Tables to truncate during factory reset.
 * Order matters: child tables (with FK references) first to avoid constraint errors.
 */
const TENANT_TABLES_TO_TRUNCATE = [
  'aviso_tracking',
  'ticket_activities',
  'poll_votes',
  'poll_options',
  'pagos',
  'adeudos',
  'egresos',
  'paquetes',
  'reservaciones',
  'votaciones',
  'tickets',
  'avisos',
  'amenities',
  'inventory',
  'notificaciones',
  'staff',
  'residents',
  'audit_log',
  'building_config',
  'counters',
]

systemRoutes.post('/factory-reset', requireRole('super_admin'), async (c) => {
  const tenantId = c.get('tenantId') as string
  const session = c.get('session') as any
  const currentUserId = session.user.id

  try {
    const raw = tenantDB.getRaw(tenantId)

    // ── 1. Truncate all tenant data tables ──────────────────────────
    raw.exec('PRAGMA foreign_keys = OFF')
    for (const table of TENANT_TABLES_TO_TRUNCATE) {
      raw.exec(`DELETE FROM ${table}`)
    }
    raw.exec('PRAGMA foreign_keys = ON')

    // ── 2. Remove demo resident accounts from master DB ─────────────
    // Find all non-super_admin users for this tenant
    const demoUsers = rawMasterDb
      .query('SELECT user_id FROM user_tenants WHERE tenant_id = ? AND role != ?')
      .all(tenantId, 'super_admin') as { user_id: string }[]

    for (const { user_id } of demoUsers) {
      // Skip the current user (the super_admin executing the reset)
      if (user_id === currentUserId) continue

      // Remove their tenant association
      rawMasterDb.exec(
        `DELETE FROM user_tenants WHERE user_id = '${user_id}' AND tenant_id = '${tenantId}'`
      )

      // Check if this user has any other tenant associations
      const otherTenants = rawMasterDb
        .query('SELECT COUNT(*) as c FROM user_tenants WHERE user_id = ?')
        .get(user_id) as { c: number }

      // If no other associations, remove the auth account entirely
      if (otherTenants.c === 0) {
        rawMasterDb.exec(`DELETE FROM session WHERE userId = '${user_id}'`)
        rawMasterDb.exec(`DELETE FROM account WHERE userId = '${user_id}'`)
        rawMasterDb.exec(`DELETE FROM user WHERE id = '${user_id}'`)
      }
    }

    console.log(`[system] ✓ Factory reset complete for tenant "${tenantId}"`)
    console.log(`[system]   Truncated ${TENANT_TABLES_TO_TRUNCATE.length} tables`)
    console.log(`[system]   Removed ${demoUsers.length} non-admin user(s)`)

    return c.json({
      ok: true,
      message: 'Factory reset complete',
      tablesCleared: TENANT_TABLES_TO_TRUNCATE.length,
      usersRemoved: demoUsers.length,
    })
  } catch (err: any) {
    console.error('[system] Factory reset failed:', err.message)
    return c.json({ error: 'Factory reset failed', message: err.message }, 500)
  }
})

/**
 * POST /demo-restore — Only available in APP_MODE=demo.
 *
 * Runs a full factory-reset, then immediately re-seeds all demo
 * fixture data. Restores the system to a "fresh demo" state.
 *
 * Returns 403 in production to prevent accidental misuse.
 */
systemRoutes.post('/demo-restore', requireRole('super_admin'), async (c) => {
  const isDemo = (process.env.APP_MODE || 'production') === 'demo'
  if (!isDemo) {
    return c.json({ error: 'demo-restore is only available in demo mode' }, 403)
  }

  const tenantId = c.get('tenantId') as string
  const session = c.get('session') as any
  const currentUserId = session.user.id

  try {
    // ── Step 1: Wipe all tenant data (same as factory-reset) ──────────
    const raw = tenantDB.getRaw(tenantId)
    raw.exec('PRAGMA foreign_keys = OFF')
    for (const table of TENANT_TABLES_TO_TRUNCATE) {
      raw.exec(`DELETE FROM ${table}`)
    }
    raw.exec('PRAGMA foreign_keys = ON')

    // Remove demo resident accounts from master DB (keep super_admin)
    const demoUsers = rawMasterDb
      .query('SELECT user_id FROM user_tenants WHERE tenant_id = ? AND role != ?')
      .all(tenantId, 'super_admin') as { user_id: string }[]

    for (const { user_id } of demoUsers) {
      if (user_id === currentUserId) continue
      rawMasterDb.exec(`DELETE FROM user_tenants WHERE user_id = '${user_id}' AND tenant_id = '${tenantId}'`)
      const otherTenants = rawMasterDb
        .query('SELECT COUNT(*) as c FROM user_tenants WHERE user_id = ?')
        .get(user_id) as { c: number }
      if (otherTenants.c === 0) {
        rawMasterDb.exec(`DELETE FROM session WHERE userId = '${user_id}'`)
        rawMasterDb.exec(`DELETE FROM account WHERE userId = '${user_id}'`)
        rawMasterDb.exec(`DELETE FROM user WHERE id = '${user_id}'`)
      }
    }

    // ── Step 2: Re-seed all demo fixture data ─────────────────────────
    const { seedDemo } = await import('../demo/seed')
    await seedDemo(tenantId)

    console.log(`[system] ✓ Demo restore complete for tenant "${tenantId}"`)

    return c.json({
      ok: true,
      message: 'Demo restore complete — system is back to fresh demo state',
    })
  } catch (err: any) {
    console.error('[system] Demo restore failed:', err.message)
    return c.json({ error: 'Demo restore failed', message: err.message }, 500)
  }
})

export default systemRoutes
