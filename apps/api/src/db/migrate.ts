/**
 * Database Migration Runner
 *
 * Applies schema to master.db and all tenant databases.
 * For tenant DBs, we use raw SQL DDL since each tenant file
 * needs the same schema applied independently.
 *
 * Usage: bun run src/db/migrate.ts
 */
import { rawMasterDb } from './master'
import { tenantDB } from './tenant'
import { readdirSync } from 'node:fs'

// ─── Master Schema DDL ──────────────────────────────────────────────

const MASTER_DDL = `
  -- Better Auth tables
  CREATE TABLE IF NOT EXISTS user (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    emailVerified   INTEGER NOT NULL DEFAULT 0,
    image           TEXT,
    createdAt       INTEGER NOT NULL,
    updatedAt       INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS session (
    id        TEXT PRIMARY KEY,
    expiresAt INTEGER NOT NULL,
    token     TEXT NOT NULL UNIQUE,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId    TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS account (
    id                    TEXT PRIMARY KEY,
    accountId             TEXT NOT NULL,
    providerId            TEXT NOT NULL,
    userId                TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    accessToken           TEXT,
    refreshToken          TEXT,
    idToken               TEXT,
    accessTokenExpiresAt  INTEGER,
    refreshTokenExpiresAt INTEGER,
    scope                 TEXT,
    password              TEXT,
    createdAt             INTEGER NOT NULL,
    updatedAt             INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verification (
    id         TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value      TEXT NOT NULL,
    expiresAt  INTEGER NOT NULL,
    createdAt  INTEGER,
    updatedAt  INTEGER
  );

  -- Tenant registry
  CREATE TABLE IF NOT EXISTS tenants (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    category    TEXT NOT NULL,
    address     TEXT,
    city        TEXT,
    state       TEXT,
    country     TEXT DEFAULT 'México',
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_tenants (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role        TEXT NOT NULL,
    apartment   TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_id);
`

// ─── Tenant Schema DDL ──────────────────────────────────────────────

export const TENANT_DDL = `
  CREATE TABLE IF NOT EXISTS residents (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    apartment TEXT NOT NULL,
    tower     TEXT NOT NULL,
    email     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS staff (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL,
    shift_start TEXT NOT NULL,
    shift_end   TEXT NOT NULL,
    photo       TEXT,
    work_days   TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS pagos (
    id           TEXT PRIMARY KEY,
    apartment    TEXT NOT NULL,
    resident     TEXT NOT NULL,
    month        TEXT NOT NULL,
    month_key    TEXT NOT NULL,
    concepto     TEXT NOT NULL,
    amount       REAL NOT NULL,
    status       TEXT NOT NULL,
    payment_date TEXT,
    adeudo_id    TEXT,
    receipt_data TEXT,
    receipt_type TEXT,
    receipt_name TEXT,
    notes        TEXT
  );

  CREATE TABLE IF NOT EXISTS adeudos (
    id          TEXT PRIMARY KEY,
    apartment   TEXT NOT NULL,
    type        TEXT NOT NULL,
    concepto    TEXT NOT NULL,
    description TEXT NOT NULL,
    amount      REAL NOT NULL,
    status      TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    resolved_at TEXT,
    resolved_by TEXT,
    pago_id     TEXT
  );

  CREATE TABLE IF NOT EXISTS egresos (
    id            TEXT PRIMARY KEY,
    categoria     TEXT NOT NULL,
    concepto      TEXT NOT NULL,
    description   TEXT,
    amount        REAL NOT NULL,
    month_key     TEXT NOT NULL,
    date          TEXT NOT NULL,
    registered_by TEXT NOT NULL,
    status        TEXT NOT NULL,
    receipt_data  TEXT,
    receipt_type  TEXT,
    receipt_name  TEXT
  );

  CREATE TABLE IF NOT EXISTS avisos (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    category        TEXT NOT NULL,
    description     TEXT,
    attachment      TEXT NOT NULL,
    start_date      TEXT,
    end_date        TEXT,
    date            TEXT NOT NULL,
    start_time      TEXT,
    end_time        TEXT,
    attachment_data TEXT,
    attachment_type TEXT,
    pinned          INTEGER DEFAULT 0,
    tracking        TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS paquetes (
    id              TEXT PRIMARY KEY,
    recipient       TEXT NOT NULL,
    apartment       TEXT NOT NULL,
    received_date   TEXT NOT NULL,
    expiration_days INTEGER,
    delivered_date  TEXT,
    status          TEXT NOT NULL,
    location        TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reservaciones (
    id        TEXT PRIMARY KEY,
    date      TEXT NOT NULL,
    grill     TEXT NOT NULL,
    resident  TEXT NOT NULL,
    apartment TEXT NOT NULL,
    status    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS amenities (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS votaciones (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    description  TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end   TEXT NOT NULL,
    status       TEXT NOT NULL,
    options      TEXT NOT NULL,
    voters       TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id          TEXT PRIMARY KEY,
    number      INTEGER NOT NULL,
    subject     TEXT NOT NULL,
    description TEXT NOT NULL,
    category    TEXT NOT NULL,
    priority    TEXT NOT NULL,
    status      TEXT NOT NULL,
    created_by  TEXT NOT NULL,
    apartment   TEXT NOT NULL,
    location    TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    resolved_at TEXT,
    activities  TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    category        TEXT NOT NULL,
    owner_id        TEXT NOT NULL,
    owner           TEXT NOT NULL,
    current_user_id TEXT,
    current_user    TEXT NOT NULL,
    notes           TEXT,
    last_updated    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notificaciones (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    date        TEXT NOT NULL,
    read        INTEGER NOT NULL DEFAULT 0,
    action_link TEXT
  );

  CREATE TABLE IF NOT EXISTS building_config (
    id   INTEGER PRIMARY KEY DEFAULT 1,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS counters (
    key   TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
  );

  -- Performance indexes
  CREATE INDEX IF NOT EXISTS idx_pagos_apartment ON pagos(apartment);
  CREATE INDEX IF NOT EXISTS idx_pagos_month_key ON pagos(month_key);
  CREATE INDEX IF NOT EXISTS idx_pagos_status ON pagos(status);
  CREATE INDEX IF NOT EXISTS idx_adeudos_apartment ON adeudos(apartment);
  CREATE INDEX IF NOT EXISTS idx_adeudos_status ON adeudos(status);
  CREATE INDEX IF NOT EXISTS idx_egresos_month_key ON egresos(month_key);
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_tickets_apartment ON tickets(apartment);
  CREATE INDEX IF NOT EXISTS idx_paquetes_status ON paquetes(status);
  CREATE INDEX IF NOT EXISTS idx_notificaciones_user ON notificaciones(user_id);
`

// ─── Runner ──────────────────────────────────────────────────────────

function migrateMaster() {
  console.log('[migrate] Applying master schema...')
  rawMasterDb.exec(MASTER_DDL)
  console.log('[migrate] ✓ master.db ready')
}

function migrateTenant(tenantId: string) {
  console.log(`[migrate] Applying tenant schema: ${tenantId}...`)
  const raw = tenantDB.getRaw(tenantId)
  raw.exec(TENANT_DDL)
  console.log(`[migrate] ✓ tenant_${tenantId}.db ready`)
}

function migrateAllTenants() {
  try {
    const files = readdirSync('./data/tenants')
    const tenantIds = files
      .filter(f => f.startsWith('tenant_') && f.endsWith('.db'))
      .map(f => f.replace('tenant_', '').replace('.db', ''))

    for (const id of tenantIds) {
      migrateTenant(id)
    }

    if (tenantIds.length === 0) {
      console.log('[migrate] No existing tenant databases found')
    }
  } catch {
    console.log('[migrate] No tenants directory yet — will be created on first tenant')
  }
}

// ─── Main ────────────────────────────────────────────────────────────

if (import.meta.main) {
  migrateMaster()
  migrateAllTenants()
  console.log('\n[migrate] All migrations complete ✓')
  process.exit(0)
}

export { migrateMaster, migrateTenant, migrateAllTenants }
