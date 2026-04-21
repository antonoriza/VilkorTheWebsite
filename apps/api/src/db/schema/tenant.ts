/**
 * Tenant Database Schema — Drizzle ORM
 *
 * One copy of this schema exists per tenant .db file.
 * Every table is derived from the canonical types in @propertypulse/shared.
 *
 * Conventions:
 *   - Column names use snake_case (SQL standard)
 *   - JSON columns store arrays/objects that don't justify their own table
 *   - All dates are ISO 8601 strings (SQLite has no native date type)
 *   - IDs are text (nanoid) — not auto-increment integers
 */
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ─── Residents ───────────────────────────────────────────────────────

export const residents = sqliteTable('residents', {
  id:        text('id').primaryKey(),
  name:      text('name').notNull(),
  apartment: text('apartment').notNull(),
  tower:     text('tower').notNull(),
  email:     text('email').notNull(),
})

// ─── Staff ───────────────────────────────────────────────────────────

export const staff = sqliteTable('staff', {
  id:         text('id').primaryKey(),
  name:       text('name').notNull(),
  role:       text('role').notNull(),                      // StaffRole
  shiftStart: text('shift_start').notNull(),
  shiftEnd:   text('shift_end').notNull(),
  photo:      text('photo'),                               // base64 or file path
  workDays:   text('work_days', { mode: 'json' }).$type<string[]>(),
})

// ─── Pagos (Payments) ────────────────────────────────────────────────

export const pagos = sqliteTable('pagos', {
  id:            text('id').primaryKey(),
  apartment:     text('apartment').notNull(),
  resident:      text('resident').notNull(),
  month:         text('month').notNull(),                   // "abril de 2026"
  monthKey:      text('month_key').notNull(),               // "2026-04"
  concepto:      text('concepto').notNull(),
  amount:        real('amount').notNull(),
  status:        text('status').notNull(),                  // Pagado | Pendiente | Por validar | Vencido
  paymentDate:   text('payment_date'),                      // ISO date or null
  adeudoId:      text('adeudo_id'),
  receiptData:   text('receipt_data'),                      // base64
  receiptType:   text('receipt_type'),                      // "image" | "pdf"
  receiptName:   text('receipt_name'),
  notes:         text('notes'),
})

// ─── Adeudos (Debts / Fines) ─────────────────────────────────────────

export const adeudos = sqliteTable('adeudos', {
  id:          text('id').primaryKey(),
  apartment:   text('apartment').notNull(),
  type:        text('type').notNull(),                     // "multa" | "llamado_atencion" | "adeudo"
  concepto:    text('concepto').notNull(),
  description: text('description').notNull(),
  amount:      real('amount').notNull(),
  status:      text('status').notNull(),                   // "Activo" | "Pagado" | "Anulado"
  createdAt:   text('created_at').notNull(),
  resolvedAt:  text('resolved_at'),
  resolvedBy:  text('resolved_by'),
  pagoId:      text('pago_id'),
})

// ─── Egresos (Expenses) ──────────────────────────────────────────────

export const egresos = sqliteTable('egresos', {
  id:            text('id').primaryKey(),
  categoria:     text('categoria').notNull(),               // EgresoCategoria
  concepto:      text('concepto').notNull(),
  description:   text('description'),
  amount:        real('amount').notNull(),
  monthKey:      text('month_key').notNull(),
  date:          text('date').notNull(),
  registeredBy:  text('registered_by').notNull(),
  status:        text('status').notNull(),                  // "Pendiente" | "Pagado"
  receiptData:   text('receipt_data'),
  receiptType:   text('receipt_type'),
  receiptName:   text('receipt_name'),
})

// ─── Avisos (Announcements) ──────────────────────────────────────────

export const avisos = sqliteTable('avisos', {
  id:             text('id').primaryKey(),
  title:          text('title').notNull(),
  category:       text('category').notNull(),               // "general" | "asamblea"
  description:    text('description'),
  attachment:     text('attachment').notNull(),
  startDate:      text('start_date'),
  endDate:        text('end_date'),
  date:           text('date').notNull(),
  startTime:      text('start_time'),
  endTime:        text('end_time'),
  attachmentData: text('attachment_data'),                   // base64
  attachmentType: text('attachment_type'),                   // "image" | "pdf"
  pinned:         integer('pinned', { mode: 'boolean' }).default(false),
  tracking:       text('tracking', { mode: 'json' }).$type<Array<{
    type: 'view' | 'confirm'
    apartment: string
    resident: string
    timestamp: string
  }>>().default([]),
})

// ─── Paquetes (Packages) ─────────────────────────────────────────────

export const paquetes = sqliteTable('paquetes', {
  id:             text('id').primaryKey(),
  recipient:      text('recipient').notNull(),
  apartment:      text('apartment').notNull(),
  receivedDate:   text('received_date').notNull(),
  expirationDays: integer('expiration_days'),
  deliveredDate:  text('delivered_date'),
  status:         text('status').notNull(),                 // "Entregado" | "Pendiente"
  location:       text('location').notNull(),
})

// ─── Reservaciones (Amenity Reservations) ────────────────────────────

export const reservaciones = sqliteTable('reservaciones', {
  id:        text('id').primaryKey(),
  date:      text('date').notNull(),
  grill:     text('grill').notNull(),                      // amenity + time slot
  resident:  text('resident').notNull(),
  apartment: text('apartment').notNull(),
  status:    text('status').notNull(),                     // "Reservado" | "Por confirmar" | "Cancelado"
})

// ─── Amenities ───────────────────────────────────────────────────────

export const amenities = sqliteTable('amenities', {
  id:   text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
})

// ─── Votaciones (Governance Polls) ───────────────────────────────────

export const votaciones = sqliteTable('votaciones', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd:   text('period_end').notNull(),
  status:      text('status').notNull(),                   // "Activa" | "Cerrada"
  options:     text('options', { mode: 'json' }).$type<Array<{
    label: string
    votes: number
    color?: string
    emoji?: string
  }>>().notNull(),
  voters:      text('voters', { mode: 'json' }).$type<Array<{
    name: string
    apartment: string
    optionLabel: string
    votedAt: string
  }>>().default([]),
})

// ─── Tickets ─────────────────────────────────────────────────────────

export const tickets = sqliteTable('tickets', {
  id:          text('id').primaryKey(),
  number:      integer('number').notNull(),
  subject:     text('subject').notNull(),
  description: text('description').notNull(),
  category:    text('category').notNull(),                  // TicketCategory
  priority:    text('priority').notNull(),                  // TicketPriority
  status:      text('status').notNull(),                    // TicketStatus
  createdBy:   text('created_by').notNull(),
  apartment:   text('apartment').notNull(),
  location:    text('location'),
  createdAt:   text('created_at').notNull(),
  updatedAt:   text('updated_at').notNull(),
  resolvedAt:  text('resolved_at'),
  activities:  text('activities', { mode: 'json' }).$type<Array<{
    id: string
    author: string
    visibility: 'internal' | 'public'
    message: string
    createdAt: string
  }>>().default([]),
})

// ─── Inventory ───────────────────────────────────────────────────────

export const inventory = sqliteTable('inventory', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  category:      text('category').notNull(),               // InventoryCategory
  ownerId:       text('owner_id').notNull(),
  owner:         text('owner').notNull(),
  currentUserId: text('current_user_id'),
  currentUser:   text('current_user').notNull(),
  notes:         text('notes'),
  lastUpdated:   text('last_updated').notNull(),
})

// ─── Notificaciones ──────────────────────────────────────────────────

export const notificaciones = sqliteTable('notificaciones', {
  id:         text('id').primaryKey(),
  userId:     text('user_id').notNull(),
  title:      text('title').notNull(),
  message:    text('message').notNull(),
  date:       text('date').notNull(),
  read:       integer('read', { mode: 'boolean' }).notNull().default(false),
  actionLink: text('action_link'),
})

// ─── Building Configuration ──────────────────────────────────────────
// Stored as a single JSON row — this is a document, not relational data.

export const buildingConfig = sqliteTable('building_config', {
  id:   integer('id').primaryKey().default(1),
  data: text('data', { mode: 'json' }).notNull(),          // Full BuildingConfig object
})

// ─── Counters ────────────────────────────────────────────────────────

export const counters = sqliteTable('counters', {
  key:   text('key').primaryKey(),                          // e.g. "ticket_number"
  value: integer('value').notNull().default(0),
})
