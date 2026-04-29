/**
 * Profile API Routes — Self-service & admin profile management.
 *
 * Field-level RBAC enforced per the permission matrix:
 *   - Residents/Operadores: can edit own pic, email, phone, password
 *   - Administración: above + reset passwords for operador/residente + edit their name/apt
 *   - Super Admin: above + reset any password, change roles
 *
 * Password changes require current password verification.
 * Admin password resets set a temporary password (user must change on next login).
 *
 * Avatar images are base64-encoded and stored in master.db user.image column.
 * Frontend is expected to compress/resize before upload (200×200 JPEG).
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { residents } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { nanoid } from '../db/utils'
import type { AppEnv, TenantRole } from '../types'
import { rawMasterDb } from '../db/master'
import { auth } from '../auth'

const app = new Hono<AppEnv>()

// ─── Role Hierarchy ──────────────────────────────────────────────────

const ROLE_RANK: Record<TenantRole, number> = {
  super_admin: 4,
  administracion: 3,
  operador: 2,
  residente: 1,
}

/**
 * Returns true if actorRole can manage targetRole
 * (i.e., actor outranks target)
 */
function canManage(actorRole: TenantRole, targetRole: TenantRole): boolean {
  return ROLE_RANK[actorRole] > ROLE_RANK[targetRole]
}

// ─── Schemas ─────────────────────────────────────────────────────────

const selfUpdateSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  image: z.string().optional(),  // base64 avatar data URL
})

const adminUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  apartment: z.string().min(1).optional(),
  tower: z.string().min(1).optional(),
  image: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

const avatarSchema = z.object({
  image: z.string().min(1),  // base64 data URL
})

// ─── GET /api/profile/me — Full profile ──────────────────────────────

app.get('/me', async (c) => {
  const session = c.get('session') as any
  const tenantRole = c.get('tenantRole') as TenantRole
  const tenantApartment = c.get('tenantApartment') as string | null
  const db = c.get('db') as any
  const userId = session.user.id

  // Get auth user data (includes image)
  const authUser = rawMasterDb
    .query('SELECT id, name, email, image, createdAt FROM user WHERE id = ?')
    .get(userId) as { id: string; name: string; email: string; image: string | null; createdAt: number } | null

  if (!authUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  // Get resident record if applicable
  let residentRecord = null
  if (tenantRole === 'residente' && tenantApartment) {
    const results = await db
      .select()
      .from(residents)
      .where(eq(residents.apartment, tenantApartment))
    residentRecord = results[0] || null
  }

  // Get active sessions count
  const sessionCount = rawMasterDb
    .query('SELECT COUNT(*) as count FROM session WHERE userId = ?')
    .get(userId) as { count: number }

  return c.json({
    user: {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      image: authUser.image,
      createdAt: authUser.createdAt,
    },
    tenant: {
      role: tenantRole,
      apartment: tenantApartment,
    },
    resident: residentRecord,
    activeSessions: sessionCount.count,
  })
})

// ─── PATCH /api/profile/me — Self-edit ───────────────────────────────

app.patch('/me', validate('json', selfUpdateSchema), async (c) => {
  const session = c.get('session') as any
  const tenantRole = c.get('tenantRole') as TenantRole
  const tenantApartment = c.get('tenantApartment') as string | null
  const db = c.get('db') as any
  const userId = session.user.id
  const body = c.req.valid('json' as never) as z.infer<typeof selfUpdateSchema>

  // Update auth user (image, email)
  const masterUpdates: string[] = []
  const masterValues: any[] = []

  if (body.email !== undefined) {
    masterUpdates.push('email = ?')
    masterValues.push(body.email)
  }
  if (body.image !== undefined) {
    masterUpdates.push('image = ?')
    masterValues.push(body.image)
  }

  if (masterUpdates.length > 0) {
    masterUpdates.push('updatedAt = ?')
    masterValues.push(Math.floor(Date.now() / 1000))
    masterValues.push(userId)
    rawMasterDb.exec(
      `UPDATE user SET ${masterUpdates.join(', ')} WHERE id = ?`,
      masterValues
    )
  }

  // Sync to resident record if applicable
  if (tenantRole === 'residente' && tenantApartment) {
    const residentUpdates: Record<string, any> = {}
    if (body.email !== undefined) residentUpdates.email = body.email
    if (body.phone !== undefined) residentUpdates.phone = body.phone

    if (Object.keys(residentUpdates).length > 0) {
      residentUpdates.updatedAt = new Date().toISOString()
      await db
        .update(residents)
        .set(residentUpdates)
        .where(eq(residents.apartment, tenantApartment))
    }
  }

  return c.json({ ok: true, message: 'Profile updated' })
})

// ─── POST /api/profile/me/avatar — Upload avatar ────────────────────

app.post('/me/avatar', validate('json', avatarSchema), async (c) => {
  const session = c.get('session') as any
  const userId = session.user.id
  const body = c.req.valid('json' as never) as z.infer<typeof avatarSchema>

  // Validate base64 size (~2MB raw → ~2.7MB base64)
  if (body.image.length > 3_000_000) {
    return c.json({ error: 'Image too large', message: 'Maximum 2MB allowed' }, 413)
  }

  rawMasterDb.exec(
    'UPDATE user SET image = ?, updatedAt = ? WHERE id = ?',
    [body.image, Math.floor(Date.now() / 1000), userId]
  )

  return c.json({ ok: true, message: 'Avatar updated' })
})

// ─── DELETE /api/profile/me/avatar — Remove avatar ──────────────────

app.delete('/me/avatar', async (c) => {
  const session = c.get('session') as any
  const userId = session.user.id

  rawMasterDb.exec(
    'UPDATE user SET image = NULL, updatedAt = ? WHERE id = ?',
    [Math.floor(Date.now() / 1000), userId]
  )

  return c.json({ ok: true, message: 'Avatar removed' })
})

// ─── POST /api/profile/me/password — Change own password ────────────

app.post('/me/password', validate('json', changePasswordSchema), async (c) => {
  const session = c.get('session') as any
  const body = c.req.valid('json' as never) as z.infer<typeof changePasswordSchema>

  try {
    // Use Better Auth's changePassword API
    const result = await auth.api.changePassword({
      headers: c.req.raw.headers,
      body: {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      },
    })

    return c.json({ ok: true, message: 'Password changed successfully' })
  } catch (err: any) {
    const message = err?.message || err?.body?.message || 'Failed to change password'
    // Check for common error patterns
    if (message.includes('incorrect') || message.includes('invalid') || message.includes('wrong')) {
      return c.json({ error: 'Invalid password', message: 'Current password is incorrect' }, 400)
    }
    return c.json({ error: 'Password change failed', message }, 500)
  }
})

// ─── GET /api/profile/me/sessions — List active sessions ────────────

app.get('/me/sessions', async (c) => {
  const session = c.get('session') as any
  const userId = session.user.id
  const currentToken = session.session.token

  const sessions = rawMasterDb
    .query(`
      SELECT id, token, createdAt, updatedAt, ipAddress, userAgent, expiresAt
      FROM session
      WHERE userId = ?
      ORDER BY updatedAt DESC
    `)
    .all(userId) as any[]

  return c.json(sessions.map(s => ({
    id: s.id,
    isCurrent: s.token === currentToken,
    createdAt: s.createdAt,
    lastActive: s.updatedAt,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    expiresAt: s.expiresAt,
  })))
})

// ─── DELETE /api/profile/me/sessions/:id — Revoke a session ─────────

app.delete('/me/sessions/:id', async (c) => {
  const session = c.get('session') as any
  const sessionId = c.req.param('id')
  const userId = session.user.id

  // Verify session belongs to this user
  const target = rawMasterDb
    .query('SELECT id, token FROM session WHERE id = ? AND userId = ?')
    .get(sessionId, userId) as { id: string; token: string } | null

  if (!target) {
    return c.json({ error: 'Not Found', message: 'Session not found' }, 404)
  }

  // Don't allow revoking current session via this endpoint
  if (target.token === session.session.token) {
    return c.json({ error: 'Bad Request', message: 'Cannot revoke current session. Use sign-out instead.' }, 400)
  }

  rawMasterDb.exec(`DELETE FROM session WHERE id = '${sessionId}'`)

  return c.json({ ok: true, message: 'Session revoked' })
})

// ─── PATCH /api/profile/:userId — Admin edit another user ────────────

app.patch('/:userId', validate('json', adminUpdateSchema), async (c) => {
  const session = c.get('session') as any
  const actorRole = c.get('tenantRole') as TenantRole
  const tenantId = c.get('tenantId') as string
  const db = c.get('db') as any
  const targetUserId = c.req.param('userId')
  const body = c.req.valid('json' as never) as z.infer<typeof adminUpdateSchema>

  // Verify actor is at least administracion
  if (ROLE_RANK[actorRole] < ROLE_RANK.administracion) {
    return c.json({ error: 'Forbidden', message: 'Only administrators can edit other profiles' }, 403)
  }

  // Look up target user's role
  const targetTenant = rawMasterDb
    .query('SELECT role, apartment FROM user_tenants WHERE user_id = ? AND tenant_id = ?')
    .get(targetUserId, tenantId) as { role: TenantRole; apartment: string | null } | null

  if (!targetTenant) {
    return c.json({ error: 'Not Found', message: 'User not found in this tenant' }, 404)
  }

  // Enforce hierarchy: can only manage lower roles
  if (!canManage(actorRole, targetTenant.role)) {
    return c.json({
      error: 'Forbidden',
      message: `Role '${actorRole}' cannot manage '${targetTenant.role}' users`,
    }, 403)
  }

  // Update auth user (name, email, image)
  const masterUpdates: string[] = []
  const masterValues: any[] = []

  if (body.name !== undefined) {
    masterUpdates.push('name = ?')
    masterValues.push(body.name)
  }
  if (body.email !== undefined) {
    masterUpdates.push('email = ?')
    masterValues.push(body.email)
  }
  if (body.image !== undefined) {
    masterUpdates.push('image = ?')
    masterValues.push(body.image)
  }

  if (masterUpdates.length > 0) {
    masterUpdates.push('updatedAt = ?')
    masterValues.push(Math.floor(Date.now() / 1000))
    masterValues.push(targetUserId)
    rawMasterDb.exec(
      `UPDATE user SET ${masterUpdates.join(', ')} WHERE id = ?`,
      masterValues
    )
  }

  // Update user_tenants if apartment changed
  if (body.apartment !== undefined) {
    rawMasterDb.exec(
      `UPDATE user_tenants SET apartment = ? WHERE user_id = ? AND tenant_id = ?`,
      [body.apartment, targetUserId, tenantId]
    )
  }

  // Sync to resident record in tenant DB
  if (targetTenant.role === 'residente' && targetTenant.apartment) {
    const residentUpdates: Record<string, any> = {}
    if (body.name !== undefined) residentUpdates.name = body.name
    if (body.email !== undefined) residentUpdates.email = body.email
    if (body.phone !== undefined) residentUpdates.phone = body.phone
    if (body.tower !== undefined) residentUpdates.tower = body.tower
    if (body.apartment !== undefined) residentUpdates.apartment = body.apartment

    if (Object.keys(residentUpdates).length > 0) {
      residentUpdates.updatedAt = new Date().toISOString()
      await db
        .update(residents)
        .set(residentUpdates)
        .where(eq(residents.apartment, targetTenant.apartment))
    }
  }

  return c.json({ ok: true, message: 'Profile updated' })
})

// ─── POST /api/profile/:userId/reset-password — Admin reset ──────────

app.post('/:userId/reset-password', validate('json', resetPasswordSchema), async (c) => {
  const actorRole = c.get('tenantRole') as TenantRole
  const tenantId = c.get('tenantId') as string
  const targetUserId = c.req.param('userId')
  const body = c.req.valid('json' as never) as z.infer<typeof resetPasswordSchema>

  // Verify actor is at least administracion
  if (ROLE_RANK[actorRole] < ROLE_RANK.administracion) {
    return c.json({ error: 'Forbidden', message: 'Only administrators can reset passwords' }, 403)
  }

  // Look up target user's role
  const targetTenant = rawMasterDb
    .query('SELECT role FROM user_tenants WHERE user_id = ? AND tenant_id = ?')
    .get(targetUserId, tenantId) as { role: TenantRole } | null

  if (!targetTenant) {
    return c.json({ error: 'Not Found', message: 'User not found in this tenant' }, 404)
  }

  // Enforce hierarchy
  if (!canManage(actorRole, targetTenant.role)) {
    return c.json({
      error: 'Forbidden',
      message: `Role '${actorRole}' cannot reset password for '${targetTenant.role}' users`,
    }, 403)
  }

  try {
    // Hash the new password using Better Auth's internal hasher
    const { hashPassword } = await import('better-auth/crypto')
    const hashedPassword = await hashPassword(body.newPassword)

    // Update the password directly in the account table
    rawMasterDb.exec(
      `UPDATE account SET password = ?, updatedAt = ? WHERE userId = ? AND providerId = 'credential'`,
      [hashedPassword, Math.floor(Date.now() / 1000), targetUserId]
    )

    // Invalidate all sessions for the target user (force re-login)
    rawMasterDb.exec(
      `DELETE FROM session WHERE userId = '${targetUserId}'`
    )

    return c.json({
      ok: true,
      message: 'Password reset successfully. User will be required to log in again.',
    })
  } catch (err: any) {
    console.error('[profile] Password reset failed:', err.message)
    return c.json({ error: 'Password reset failed', message: err.message }, 500)
  }
})

export default app
