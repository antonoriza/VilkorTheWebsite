/**
 * Master Database Schema — Drizzle ORM
 *
 * This schema defines the master.db tables:
 *   - Better Auth tables: user, session, account, verification
 *   - tenants: property registry
 *   - userTenants: user-to-tenant role mappings
 */
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'

// ─── Better Auth Required Tables ─────────────────────────────────────
// These table names and columns are required by Better Auth's Drizzle adapter.

export const user = sqliteTable('user', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  email:         text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
  image:         text('image'),
  createdAt:     integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt:     integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const session = sqliteTable('session', {
  id:        text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  token:     text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId:    text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('account', {
  id:                 text('id').primaryKey(),
  accountId:          text('accountId').notNull(),
  providerId:         text('providerId').notNull(),
  userId:             text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken:        text('accessToken'),
  refreshToken:       text('refreshToken'),
  idToken:            text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope:              text('scope'),
  password:           text('password'),
  createdAt:          integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt:          integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt:  integer('createdAt', { mode: 'timestamp' }),
  updatedAt:  integer('updatedAt', { mode: 'timestamp' }),
})

// ─── Tenants ─────────────────────────────────────────────────────────

export const tenants = sqliteTable('tenants', {
  id:           text('id').primaryKey(),
  name:         text('name').notNull(),
  slug:         text('slug').notNull().unique(),
  category:     text('category').notNull(),
  address:      text('address'),
  city:         text('city'),
  state:        text('state'),
  country:      text('country').default('México'),
  status:       text('status').notNull().default('active'),
  createdAt:    text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:    text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── User ↔ Tenant Mapping ──────────────────────────────────────────

export const userTenants = sqliteTable('user_tenants', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  tenantId:  text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  role:      text('role').notNull(),
  apartment: text('apartment'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  uniqueUserTenant: uniqueIndex('idx_user_tenants_unique').on(table.userId, table.tenantId),
}))

