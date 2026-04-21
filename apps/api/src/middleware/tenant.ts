/**
 * Tenant Resolver Middleware
 *
 * Extracts the authenticated user's session via Better Auth,
 * resolves their tenant from the X-Tenant-ID header,
 * verifies access, checks tenant lifecycle status, and injects
 * the tenant database into context.
 *
 * Context variables set:
 *   - session: Better Auth session + user
 *   - tenantId: string
 *   - tenantRole: 'super_admin' | 'administracion' | 'operador' | 'residente'
 *   - db: Drizzle-wrapped tenant database
 */
import { createMiddleware } from 'hono/factory'
import { auth } from '../auth'
import { tenantDB } from '../db/tenant'
import { rawMasterDb } from '../db/master'

interface UserTenantRow {
  tenant_id: string
  role: string
  apartment: string | null
}

interface TenantRow {
  status: string
}

/**
 * Middleware: authenticate + resolve tenant + check lifecycle + inject DB
 */
export const tenantMiddleware = createMiddleware(async (c, next) => {
  // 1. Authenticate — get session from Better Auth
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: 'Unauthorized', message: 'No valid session' }, 401)
  }

  // 2. Extract tenant ID from header
  const tenantId = c.req.header('X-Tenant-ID')
  if (!tenantId) {
    return c.json({ error: 'Bad Request', message: 'Missing X-Tenant-ID header' }, 400)
  }

  // 3. Verify user has access to this tenant
  const userTenant = rawMasterDb
    .query('SELECT tenant_id, role, apartment FROM user_tenants WHERE user_id = ? AND tenant_id = ?')
    .get(session.user.id, tenantId) as UserTenantRow | null

  if (!userTenant) {
    return c.json({ error: 'Forbidden', message: 'No access to this tenant' }, 403)
  }

  // 4. Check tenant lifecycle status — reject if not active
  const tenant = rawMasterDb
    .query('SELECT status FROM tenants WHERE id = ?')
    .get(tenantId) as TenantRow | null

  if (!tenant || tenant.status !== 'active') {
    const statusMsg = !tenant
      ? 'Tenant not found'
      : `Tenant is ${tenant.status}`
    return c.json({
      error: 'Forbidden',
      message: statusMsg,
      code: 'TENANT_NOT_ACTIVE',
    }, 403)
  }

  // 5. Inject into context
  c.set('session', session)
  c.set('tenantId', tenantId)
  c.set('tenantRole', userTenant.role)
  c.set('tenantApartment', userTenant.apartment)
  c.set('db', tenantDB.get(tenantId))

  await next()
})

/**
 * Lightweight auth-only middleware (no tenant resolution).
 * Used for routes that operate on the master DB (e.g. listing tenants).
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: 'Unauthorized', message: 'No valid session' }, 401)
  }
  c.set('session', session)
  await next()
})
