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

const systemRoutes = new Hono()

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

export default systemRoutes
