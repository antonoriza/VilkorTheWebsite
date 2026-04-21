/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Restricts route access to specific roles.
 * Must be used AFTER tenantMiddleware (which sets tenantRole).
 *
 * Role hierarchy (highest to lowest):
 *   super_admin > administracion > operador > residente
 *
 * Usage:
 *   app.post('/pagos', requireRole('super_admin', 'administracion'), handler)
 */
import { createMiddleware } from 'hono/factory'

type TenantRole = 'super_admin' | 'administracion' | 'operador' | 'residente'

/**
 * Factory: creates middleware that allows only the specified roles.
 */
export const requireRole = (...allowedRoles: TenantRole[]) =>
  createMiddleware(async (c, next) => {
    const role = c.get('tenantRole') as TenantRole | undefined

    if (!role) {
      return c.json({ error: 'Forbidden', message: 'No role resolved — is tenant middleware applied?' }, 403)
    }

    if (!allowedRoles.includes(role)) {
      return c.json({
        error: 'Forbidden',
        message: `Role '${role}' cannot access this resource. Required: ${allowedRoles.join(' | ')}`,
      }, 403)
    }

    await next()
  })

/**
 * Shorthand: admin-only routes (super_admin + administracion)
 */
export const adminOnly = requireRole('super_admin', 'administracion')

/**
 * Shorthand: staff-level routes (admin + operador)
 */
export const staffOrAbove = requireRole('super_admin', 'administracion', 'operador')
