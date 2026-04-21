/**
 * Master Database Schema — Drizzle ORM
 *
 * This schema defines the master.db tables:
 *   - tenants: property registry
 *   - userTenants: user-to-tenant role mappings
 *
 * Better Auth automatically manages:
 *   - user, session, account, verification tables
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// ─── Tenants ─────────────────────────────────────────────────────────

export const tenants = sqliteTable('tenants', {
  id:           text('id').primaryKey(),                  // nanoid
  name:         text('name').notNull(),                   // "Lote Alemania"
  slug:         text('slug').notNull().unique(),           // "lote-alemania"
  category:     text('category').notNull(),                // "residencial" | "industrial" | "comercial" | "hotel"
  address:      text('address'),
  city:         text('city'),
  state:        text('state'),
  country:      text('country').default('México'),
  status:       text('status').notNull().default('active'), // "active" | "suspended" | "archived"
  createdAt:    text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:    text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── User ↔ Tenant Mapping ──────────────────────────────────────────

export const userTenants = sqliteTable('user_tenants', {
  id:        text('id').primaryKey(),                     // nanoid
  userId:    text('user_id').notNull(),                   // Better Auth user id
  tenantId:  text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  role:      text('role').notNull(),                      // "super_admin" | "administracion" | "operador" | "residente"
  apartment: text('apartment'),                           // for residents — apartment link
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
