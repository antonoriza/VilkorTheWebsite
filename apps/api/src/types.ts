/**
 * Shared Hono Environment Types
 *
 * Defines the typed context variables injected by tenantMiddleware.
 * Import this in every route file and middleware to get full type safety on c.get().
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type * as tenantSchema from './db/schema/tenant'

export type TenantDb = BunSQLiteDatabase<typeof tenantSchema>

export type TenantRole = 'super_admin' | 'administracion' | 'operador' | 'residente'

/** Hono environment with all context variables set by tenantMiddleware */
export type AppEnv = {
  Variables: {
    session: any
    tenantId: string
    tenantRole: TenantRole
    tenantApartment: string | null
    db: TenantDb
  }
}
