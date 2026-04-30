/**
 * Audit Trail Middleware
 *
 * Logs every mutating operation (POST, PATCH, DELETE) performed by
 * admin-level roles (super_admin, administracion) to the tenant's
 * audit_log table.
 *
 * Design decisions:
 *   - Runs AFTER the route handler (post-processing) so it can capture
 *     the response status code.
 *   - Non-blocking: audit write failures log to stderr but never crash
 *     the request or return an error to the client.
 *   - Only fires for mutating methods — GET/HEAD/OPTIONS are ignored.
 *   - Captures the request path, method, actor, role, and IP address.
 *   - Does NOT capture request/response bodies to avoid storing PII
 *     or large payloads (e.g. base64 receipts) in the audit table.
 *
 * The audit_log table lives in each tenant's database, scoped to that
 * tenant's operations. Cross-tenant admin access is logged separately
 * in the master DB (future enhancement if super_admin scope expands).
 */
import { createMiddleware } from 'hono/factory'
import { auditLog as dbAuditLog } from '../db/schema/tenant'
import { nanoid } from '../db/utils'
import { auditLog as winstonAuditLog, LogCategory, LogSourceType } from '../lib/logger'

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])
const AUDITABLE_ROLES = new Set(['super_admin', 'administracion'])

// Mapeo de rutas a categorías de ThingWorx
const getCategoryFromPath = (path: string): LogCategory => {
  if (path.includes('/auth') || path.includes('/permisos')) return 'Security Log'
  if (path.includes('/config') || path.includes('/system')) return 'Config Log'
  if (path.includes('/avisos') || path.includes('/comunicacion')) return 'Communication Log'
  return 'Application Log'
}

export const auditMiddleware = createMiddleware(async (c, next) => {
  // Run the actual route handler first
  await next()

  // Only audit mutating operations by admin roles
  const method = c.req.method
  if (!MUTATING_METHODS.has(method)) return

  const role = c.get('tenantRole') as string | undefined
  if (!role || !AUDITABLE_ROLES.has(role)) return

  // Non-blocking audit write
  try {
    const db = c.get('db') as any
    const session = c.get('session') as any
    const path = c.req.path
    const userName = session?.user?.name ?? 'Unknown User'

    // 1. Persistencia en Base de Datos (Relacional/Búsqueda rápida)
    await db.insert(dbAuditLog).values({
      id: nanoid(),
      actorId: session?.user?.id ?? 'unknown',
      actorRole: role,
      action: method,
      resource: path,
      statusCode: c.res.status,
      ipAddress: c.req.header('x-forwarded-for')
        ?? c.req.header('x-real-ip')
        ?? null,
      userAgent: c.req.header('user-agent') ?? null,
      createdAt: new Date().toISOString(),
    })

    // 2. Persistencia Física en Disco (Winston - Rotación/Auditoría Dura)
    winstonAuditLog(
      getCategoryFromPath(path),
      `${method}_OPERATION`,
      (role === 'super_admin' ? 'Super Admin' : 'Operador') as LogSourceType,
      userName,
      `Operación ${method} en ${path} (Status: ${c.res.status})`,
      {
        resource: path,
        status: c.res.status,
        ip: c.req.header('x-real-ip') || 'local'
      }
    )
    
  } catch (err) {
    console.error('[audit] Failed to write audit log:', err)
  }
})
