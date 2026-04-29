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
    role        TEXT NOT NULL CHECK (role IN ('super_admin', 'administracion', 'operador', 'residente')),
    apartment   TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tenants_unique ON user_tenants(user_id, tenant_id);
`

// ─── Tenant Schema DDL ──────────────────────────────────────────────

export const TENANT_DDL = `
  CREATE TABLE IF NOT EXISTS residents (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    apartment   TEXT NOT NULL UNIQUE,
    tower       TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS staff (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL,
    shift_start TEXT NOT NULL,
    shift_end   TEXT NOT NULL,
    photo       TEXT,
    work_days   TEXT DEFAULT '[]',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pagos (
    id            TEXT PRIMARY KEY,
    resident_id   TEXT REFERENCES residents(id),
    apartment     TEXT NOT NULL,
    resident      TEXT NOT NULL,
    month         TEXT NOT NULL,
    month_key     TEXT NOT NULL,
    concepto      TEXT NOT NULL,
    amount        REAL NOT NULL,
    status        TEXT NOT NULL CHECK (status IN ('Pagado', 'Pendiente', 'Por validar', 'Vencido')),
    payment_date  TEXT,
    adeudo_id     TEXT,
    receipt_data  TEXT,
    receipt_type  TEXT CHECK (receipt_type IN ('image', 'pdf')),
    receipt_name  TEXT,
    notes         TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS adeudos (
    id          TEXT PRIMARY KEY,
    resident_id TEXT REFERENCES residents(id),
    apartment   TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('multa', 'llamado_atencion', 'adeudo')),
    concepto    TEXT NOT NULL,
    description TEXT NOT NULL,
    amount      REAL NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('Activo', 'Pagado', 'Anulado')),
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    resolved_at TEXT,
    resolved_by TEXT,
    pago_id     TEXT
  );

  CREATE TABLE IF NOT EXISTS egresos (
    id            TEXT PRIMARY KEY,
    categoria     TEXT NOT NULL CHECK (categoria IN ('nomina', 'mantenimiento', 'servicios', 'equipo', 'seguros', 'administracion', 'otros')),
    concepto      TEXT NOT NULL,
    description   TEXT,
    amount        REAL NOT NULL,
    month_key     TEXT NOT NULL,
    date          TEXT NOT NULL,
    registered_by TEXT NOT NULL,
    status        TEXT NOT NULL CHECK (status IN ('Pendiente', 'Pagado')),
    receipt_data  TEXT,
    receipt_type  TEXT CHECK (receipt_type IN ('image', 'pdf')),
    receipt_name  TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS avisos (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN ('general', 'asamblea')),
    description     TEXT,
    attachment      TEXT NOT NULL,
    start_date      TEXT,
    end_date        TEXT,
    date            TEXT NOT NULL,
    start_time      TEXT,
    end_time        TEXT,
    attachment_data TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('image', 'pdf')),
    pinned          INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS aviso_tracking (
    id          TEXT PRIMARY KEY,
    aviso_id    TEXT NOT NULL REFERENCES avisos(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('view', 'confirm')),
    apartment   TEXT NOT NULL,
    resident    TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS paquetes (
    id              TEXT PRIMARY KEY,
    resident_id     TEXT REFERENCES residents(id),
    recipient       TEXT NOT NULL,
    apartment       TEXT NOT NULL,
    received_date   TEXT NOT NULL,
    expiration_days INTEGER,
    delivered_date  TEXT,
    status          TEXT NOT NULL CHECK (status IN ('Entregado', 'Pendiente')),
    location        TEXT NOT NULL,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reservaciones (
    id          TEXT PRIMARY KEY,
    resident_id TEXT REFERENCES residents(id),
    date        TEXT NOT NULL,
    grill       TEXT NOT NULL,
    resident    TEXT NOT NULL,
    apartment   TEXT NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('Reservado', 'Por confirmar', 'Cancelado')),
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS amenities (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    icon                    TEXT NOT NULL,
    open_time               TEXT NOT NULL DEFAULT '10:00',
    close_time              TEXT NOT NULL DEFAULT '22:00',
    slot_duration_minutes   INTEGER NOT NULL DEFAULT 240,
    cleaning_buffer_minutes INTEGER NOT NULL DEFAULT 0,
    max_advance_days        INTEGER NOT NULL DEFAULT 30,
    deposit_amount          REAL NOT NULL DEFAULT 500,
    reglamento_type         TEXT NOT NULL DEFAULT 'none' CHECK (reglamento_type IN ('none', 'text', 'pdf')),
    reglamento_text         TEXT NOT NULL DEFAULT '',
    reglamento_pdf_url      TEXT NOT NULL DEFAULT '',
    created_at              TEXT NOT NULL,
    updated_at              TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS votaciones (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    description  TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end   TEXT NOT NULL,
    status       TEXT NOT NULL CHECK (status IN ('Activa', 'Cerrada')),
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS poll_options (
    id         TEXT PRIMARY KEY,
    poll_id    TEXT NOT NULL REFERENCES votaciones(id) ON DELETE CASCADE,
    label      TEXT NOT NULL,
    color      TEXT,
    emoji      TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS poll_votes (
    id         TEXT PRIMARY KEY,
    poll_id    TEXT NOT NULL REFERENCES votaciones(id) ON DELETE CASCADE,
    option_id  TEXT NOT NULL REFERENCES poll_options(id),
    name       TEXT NOT NULL,
    apartment  TEXT NOT NULL,
    voted_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id          TEXT PRIMARY KEY,
    number      INTEGER NOT NULL,
    subject     TEXT NOT NULL,
    description TEXT NOT NULL,
    category    TEXT NOT NULL CHECK (category IN ('Plomería', 'Electricidad', 'Áreas Comunes', 'Seguridad', 'Limpieza', 'Otro')),
    priority    TEXT NOT NULL CHECK (priority IN ('Alta', 'Media', 'Baja')),
    status      TEXT NOT NULL CHECK (status IN ('Nuevo', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado')),
    created_by  TEXT NOT NULL,
    resident_id TEXT REFERENCES residents(id),
    apartment   TEXT NOT NULL,
    location    TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    resolved_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ticket_activities (
    id         TEXT PRIMARY KEY,
    ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author     TEXT NOT NULL,
    visibility TEXT NOT NULL CHECK (visibility IN ('internal', 'public')),
    message    TEXT NOT NULL,
    created_at TEXT NOT NULL
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
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notificaciones (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    read        INTEGER NOT NULL DEFAULT 0,
    action_link TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS building_config (
    id   INTEGER PRIMARY KEY DEFAULT 1,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS counters (
    key   TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id          TEXT PRIMARY KEY,
    actor_id    TEXT NOT NULL,
    actor_role  TEXT NOT NULL,
    action      TEXT NOT NULL,
    resource    TEXT NOT NULL,
    status_code INTEGER,
    ip_address  TEXT,
    user_agent  TEXT,
    created_at  TEXT NOT NULL
  );

  -- ─── Performance Indexes ──────────────────────────────────────────
  CREATE INDEX IF NOT EXISTS idx_pagos_apartment ON pagos(apartment);
  CREATE INDEX IF NOT EXISTS idx_pagos_month_key ON pagos(month_key);
  CREATE INDEX IF NOT EXISTS idx_pagos_status ON pagos(status);
  CREATE INDEX IF NOT EXISTS idx_pagos_apt_month ON pagos(apartment, month_key);
  CREATE INDEX IF NOT EXISTS idx_adeudos_apartment ON adeudos(apartment);
  CREATE INDEX IF NOT EXISTS idx_adeudos_status ON adeudos(status);
  CREATE INDEX IF NOT EXISTS idx_adeudos_apt_status ON adeudos(apartment, status);
  CREATE INDEX IF NOT EXISTS idx_egresos_month_key ON egresos(month_key);
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_tickets_apartment ON tickets(apartment);
  CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON tickets(status, priority);
  CREATE INDEX IF NOT EXISTS idx_paquetes_status ON paquetes(status);
  CREATE INDEX IF NOT EXISTS idx_notificaciones_user ON notificaciones(user_id);
  CREATE INDEX IF NOT EXISTS idx_notificaciones_user_read ON notificaciones(user_id, read);
  CREATE INDEX IF NOT EXISTS idx_ticket_activities_ticket ON ticket_activities(ticket_id);
  CREATE INDEX IF NOT EXISTS idx_aviso_tracking_aviso ON aviso_tracking(aviso_id);
  CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);
  CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_votes_unique ON poll_votes(poll_id, apartment);
  CREATE INDEX IF NOT EXISTS idx_pagos_resident ON pagos(resident_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_resident ON tickets(resident_id);
  CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
  CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
  CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource);
`

// ─── Incremental Migrations ──────────────────────────────────────────
// Safely add columns that may be missing in pre-existing databases.
// Each entry is a raw SQL statement; failures (column already exists) are silently ignored.

const TENANT_MIGRATIONS: string[] = [
  // Amenity scheduling & policy columns (added 2026-04-29)
  `ALTER TABLE amenities ADD COLUMN open_time TEXT NOT NULL DEFAULT '10:00'`,
  `ALTER TABLE amenities ADD COLUMN close_time TEXT NOT NULL DEFAULT '22:00'`,
  `ALTER TABLE amenities ADD COLUMN slot_duration_minutes INTEGER NOT NULL DEFAULT 240`,
  `ALTER TABLE amenities ADD COLUMN cleaning_buffer_minutes INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE amenities ADD COLUMN max_advance_days INTEGER NOT NULL DEFAULT 30`,
  `ALTER TABLE amenities ADD COLUMN deposit_amount REAL NOT NULL DEFAULT 500`,
  `ALTER TABLE amenities ADD COLUMN reglamento_type TEXT NOT NULL DEFAULT 'none'`,
  `ALTER TABLE amenities ADD COLUMN reglamento_text TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE amenities ADD COLUMN reglamento_pdf_url TEXT NOT NULL DEFAULT ''`,
]

function applyMigrations(raw: ReturnType<typeof tenantDB.getRaw>) {
  for (const sql of TENANT_MIGRATIONS) {
    try { raw.exec(sql) } catch { /* column already exists — safe to ignore */ }
  }
}

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
  applyMigrations(raw)
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
