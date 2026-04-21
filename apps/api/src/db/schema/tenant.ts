/**
 * Tenant Database Schema — Drizzle ORM
 *
 * One copy of this schema exists per tenant .db file.
 * Every table is derived from the canonical types in @propertypulse/shared.
 *
 * Conventions:
 *   - Column names use snake_case (SQL standard)
 *   - JSON columns are reserved for true document data (building_config, work_days)
 *   - All dates are ISO 8601 strings (SQLite has no native date type)
 *   - IDs are text (nanoid) — not auto-increment integers
 *   - Every table has created_at and updated_at audit timestamps
 *
 * Phase A+B refactor:
 *   - Added created_at / updated_at to all tables
 *   - Extracted tickets.activities → ticket_activities table
 *   - Extracted votaciones.options/voters → poll_options + poll_votes tables
 *   - Extracted avisos.tracking → aviso_tracking table
 *   - Added resident_id FK references (nullable for backward compat)
 */
import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core'

// ─── Residents ───────────────────────────────────────────────────────

export const residents = sqliteTable('residents', {
  id:        text('id').primaryKey(),
  name:      text('name').notNull(),
  apartment: text('apartment').notNull().unique(),
  tower:     text('tower').notNull(),
  email:     text('email').notNull(),
  phone:     text('phone'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
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
  createdAt:  text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:  text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Pagos (Payments) ────────────────────────────────────────────────

export const pagos = sqliteTable('pagos', {
  id:            text('id').primaryKey(),
  residentId:    text('resident_id').references(() => residents.id),
  apartment:     text('apartment').notNull(),
  resident:      text('resident').notNull(),               // display name snapshot
  month:         text('month').notNull(),                   // "abril de 2026"
  monthKey:      text('month_key').notNull(),               // "2026-04"
  concepto:      text('concepto').notNull(),
  amount:        real('amount').notNull(),
  status:        text('status').notNull(),                  // Pagado | Pendiente | Por validar | Vencido
  paymentDate:   text('payment_date'),                      // ISO date or null
  adeudoId:      text('adeudo_id'),
  receiptData:   text('receipt_data'),                      // base64 (Phase C: move to filesystem)
  receiptType:   text('receipt_type'),                      // "image" | "pdf"
  receiptName:   text('receipt_name'),
  notes:         text('notes'),
  createdAt:     text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:     text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Adeudos (Debts / Fines) ─────────────────────────────────────────

export const adeudos = sqliteTable('adeudos', {
  id:          text('id').primaryKey(),
  residentId:  text('resident_id').references(() => residents.id),
  apartment:   text('apartment').notNull(),
  type:        text('type').notNull(),                     // "multa" | "llamado_atencion" | "adeudo"
  concepto:    text('concepto').notNull(),
  description: text('description').notNull(),
  amount:      real('amount').notNull(),
  status:      text('status').notNull(),                   // "Activo" | "Pagado" | "Anulado"
  createdAt:   text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:   text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
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
  createdAt:     text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:     text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
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
  attachmentData: text('attachment_data'),                   // base64 (Phase C: move to filesystem)
  attachmentType: text('attachment_type'),                   // "image" | "pdf"
  pinned:         integer('pinned', { mode: 'boolean' }).default(false),
  createdAt:      text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:      text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Aviso Tracking (normalized from avisos.tracking JSON) ───────────

export const avisoTracking = sqliteTable('aviso_tracking', {
  id:         text('id').primaryKey(),
  avisoId:    text('aviso_id').notNull().references(() => avisos.id, { onDelete: 'cascade' }),
  type:       text('type').notNull(),                      // 'view' | 'confirm'
  apartment:  text('apartment').notNull(),
  resident:   text('resident').notNull(),
  createdAt:  text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Paquetes (Packages) ─────────────────────────────────────────────

export const paquetes = sqliteTable('paquetes', {
  id:             text('id').primaryKey(),
  residentId:     text('resident_id').references(() => residents.id),
  recipient:      text('recipient').notNull(),
  apartment:      text('apartment').notNull(),
  receivedDate:   text('received_date').notNull(),
  expirationDays: integer('expiration_days'),
  deliveredDate:  text('delivered_date'),
  status:         text('status').notNull(),                 // "Entregado" | "Pendiente"
  location:       text('location').notNull(),
  createdAt:      text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:      text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Reservaciones (Amenity Reservations) ────────────────────────────

export const reservaciones = sqliteTable('reservaciones', {
  id:         text('id').primaryKey(),
  residentId: text('resident_id').references(() => residents.id),
  date:       text('date').notNull(),
  grill:      text('grill').notNull(),                      // amenity + time slot
  resident:   text('resident').notNull(),
  apartment:  text('apartment').notNull(),
  status:     text('status').notNull(),                     // "Reservado" | "Por confirmar" | "Cancelado"
  createdAt:  text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:  text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Amenities ───────────────────────────────────────────────────────

export const amenities = sqliteTable('amenities', {
  id:        text('id').primaryKey(),
  name:      text('name').notNull(),
  icon:      text('icon').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Votaciones (Governance Polls) ───────────────────────────────────

export const votaciones = sqliteTable('votaciones', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd:   text('period_end').notNull(),
  status:      text('status').notNull(),                   // "Activa" | "Cerrada"
  createdAt:   text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:   text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Poll Options (normalized from votaciones.options JSON) ──────────

export const pollOptions = sqliteTable('poll_options', {
  id:        text('id').primaryKey(),
  pollId:    text('poll_id').notNull().references(() => votaciones.id, { onDelete: 'cascade' }),
  label:     text('label').notNull(),
  color:     text('color'),
  emoji:     text('emoji'),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ─── Poll Votes (normalized from votaciones.voters JSON) ─────────────

export const pollVotes = sqliteTable('poll_votes', {
  id:         text('id').primaryKey(),
  pollId:     text('poll_id').notNull().references(() => votaciones.id, { onDelete: 'cascade' }),
  optionId:   text('option_id').notNull().references(() => pollOptions.id),
  name:       text('name').notNull(),
  apartment:  text('apartment').notNull(),
  votedAt:    text('voted_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  uniqueVote: uniqueIndex('idx_poll_votes_unique').on(table.pollId, table.apartment),
}))

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
  residentId:  text('resident_id').references(() => residents.id),
  apartment:   text('apartment').notNull(),
  location:    text('location'),
  createdAt:   text('created_at').notNull(),
  updatedAt:   text('updated_at').notNull(),
  resolvedAt:  text('resolved_at'),
})

// ─── Ticket Activities (normalized from tickets.activities JSON) ─────

export const ticketActivities = sqliteTable('ticket_activities', {
  id:         text('id').primaryKey(),
  ticketId:   text('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  author:     text('author').notNull(),
  visibility: text('visibility').notNull(),                // 'internal' | 'public'
  message:    text('message').notNull(),
  createdAt:  text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
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
  createdAt:     text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:     text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Notificaciones ──────────────────────────────────────────────────

export const notificaciones = sqliteTable('notificaciones', {
  id:         text('id').primaryKey(),
  userId:     text('user_id').notNull(),
  title:      text('title').notNull(),
  message:    text('message').notNull(),
  read:       integer('read', { mode: 'boolean' }).notNull().default(false),
  actionLink: text('action_link'),
  createdAt:  text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:  text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
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

// ─── Audit Log ───────────────────────────────────────────────────────
// Immutable record of every mutating admin operation.
// Written by auditMiddleware — never updated or deleted by the application.

export const auditLog = sqliteTable('audit_log', {
  id:         text('id').primaryKey(),
  actorId:    text('actor_id').notNull(),                    // user ID from Better Auth session
  actorRole:  text('actor_role').notNull(),                  // role at time of action
  action:     text('action').notNull(),                      // HTTP method: POST, PATCH, DELETE
  resource:   text('resource').notNull(),                    // request path: /api/pagos/abc123
  statusCode: integer('status_code'),                        // response status: 200, 201, 404, etc.
  ipAddress:  text('ip_address'),
  userAgent:  text('user_agent'),
  createdAt:  text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
