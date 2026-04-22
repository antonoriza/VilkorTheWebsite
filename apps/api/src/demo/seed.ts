/**
 * Demo Seed Orchestrator
 *
 * Populates the tenant database with demo data (Phase 2).
 * Called from db/seed.ts only when APP_MODE=demo.
 *
 * Idempotent: skips all inserts if the residents table already has data.
 */
import { tenantDB } from '../db/tenant'
import { rawMasterDb } from '../db/master'
import { nanoid } from '../db/utils'
import { auth } from '../auth'

import { generateResidents } from './fixtures/residents'
import { staffMembers } from './fixtures/staff'
import { amenitiesList } from './fixtures/amenities'
import { PAGO_STATUSES, PAGO_CONCEPTO, PAGO_AMOUNT, PAGO_MONTH, PAGO_MONTH_KEY, PAGO_PAYMENT_DATE } from './fixtures/pagos'
import { ticketData } from './fixtures/tickets'
import { avisoData } from './fixtures/avisos'
import { buildingConfig } from './fixtures/building-config'
import { DEMO_ACCOUNT_INDICES, DEMO_ACCOUNT_PASSWORD, DEMO_ACCOUNT_ROLE } from './fixtures/accounts'

export async function seedDemo(tenantId: string): Promise<void> {
  console.log('[demo] Phase 2: Demo data...')

  const raw = tenantDB.getRaw(tenantId)
  const NOW = new Date().toISOString()

  // Idempotency guard — skip if already seeded
  const count = raw.query('SELECT COUNT(*) as c FROM residents').get() as any
  if (count?.c > 0) {
    console.log('[demo]   Already has data, skipping demo seed')
    return
  }

  // ── Residents (116) ──────────────────────────────────────────────────
  const residents = generateResidents()
  const insertResident = raw.prepare(
    'INSERT INTO residents (id, name, apartment, tower, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  for (const r of residents) {
    insertResident.run(`res-${r.apartment}`, r.name, r.apartment, r.tower, r.email, NOW, NOW)
  }
  console.log(`[demo]   ✓ ${residents.length} residents`)

  // ── Staff (4) ────────────────────────────────────────────────────────
  const insertStaff = raw.prepare(
    'INSERT INTO staff (id, name, role, shift_start, shift_end, work_days, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  for (const s of staffMembers) {
    insertStaff.run(nanoid(), s.name, s.role, s.shiftStart, s.shiftEnd, JSON.stringify(s.workDays), NOW, NOW)
  }
  console.log(`[demo]   ✓ ${staffMembers.length} staff members`)

  // ── Amenities (3) ────────────────────────────────────────────────────
  const insertAmenity = raw.prepare(
    'INSERT INTO amenities (id, name, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  )
  for (const a of amenitiesList) {
    insertAmenity.run(nanoid(), a.name, a.icon, NOW, NOW)
  }
  console.log(`[demo]   ✓ ${amenitiesList.length} amenities`)

  // ── Pagos (one per resident, current month) ───────────────────────────
  const insertPago = raw.prepare(`
    INSERT INTO pagos
      (id, resident_id, apartment, resident, month, month_key, concepto, amount, status, payment_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  let pagoCount = 0
  for (const r of residents) {
    const status = PAGO_STATUSES[pagoCount % PAGO_STATUSES.length]
    insertPago.run(
      nanoid(), `res-${r.apartment}`, r.apartment, r.name,
      PAGO_MONTH, PAGO_MONTH_KEY, PAGO_CONCEPTO, PAGO_AMOUNT,
      status,
      status === 'Pagado' ? PAGO_PAYMENT_DATE : null,
      NOW, NOW,
    )
    pagoCount++
  }
  console.log(`[demo]   ✓ ${pagoCount} pagos`)

  // ── Tickets (4) ──────────────────────────────────────────────────────
  const insertTicket = raw.prepare(`
    INSERT INTO tickets
      (id, number, subject, description, category, priority, status, created_by, resident_id, apartment, created_at, updated_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (let i = 0; i < ticketData.length; i++) {
    const t = ticketData[i]
    const r = residents[t.residentIndex]
    insertTicket.run(
      nanoid(), i + 1, t.subject, t.description, t.category, t.priority, t.status,
      r.name, `res-${r.apartment}`, r.apartment,
      NOW, NOW,
      t.status === 'Resuelto' ? NOW : null,
    )
  }
  raw.exec(`INSERT OR REPLACE INTO counters (key, value) VALUES ('ticket_number', ${ticketData.length})`)
  console.log(`[demo]   ✓ ${ticketData.length} tickets`)

  // ── Avisos (2) ───────────────────────────────────────────────────────
  const insertAviso = raw.prepare(`
    INSERT INTO avisos
      (id, title, category, description, attachment, date, pinned, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const a of avisoData) {
    insertAviso.run(nanoid(), a.title, a.category, a.description, '', a.date, a.pinned, NOW, NOW)
  }
  console.log(`[demo]   ✓ ${avisoData.length} avisos`)

  // ── Building Config ───────────────────────────────────────────────────
  raw.exec(`INSERT OR REPLACE INTO building_config (id, data) VALUES (1, '${JSON.stringify(buildingConfig).replace(/'/g, "''")}')`)
  console.log('[demo]   ✓ Building config')

  // ── Demo resident auth accounts ───────────────────────────────────────
  const demoAccounts = DEMO_ACCOUNT_INDICES.map(i => ({
    name: residents[i].name,
    email: residents[i].email,
    apartment: residents[i].apartment,
  }))

  for (const acct of demoAccounts) {
    try {
      const existing = rawMasterDb.query('SELECT id FROM user WHERE email = ?').get(acct.email) as any
      if (existing) continue

      const result = await auth.api.signUpEmail({
        body: { name: acct.name, email: acct.email, password: DEMO_ACCOUNT_PASSWORD },
      })
      const userId = (result as any).user?.id
      if (userId) {
        rawMasterDb.exec(`
          INSERT OR IGNORE INTO user_tenants (id, user_id, tenant_id, role, apartment, created_at)
          VALUES ('${nanoid()}', '${userId}', '${tenantId}', '${DEMO_ACCOUNT_ROLE}', '${acct.apartment}', '${NOW}');
        `)
      }
    } catch (e: any) {
      console.log(`[demo]   ⚠ Demo user ${acct.email} skipped:`, e.message || 'exists')
    }
  }
  console.log(`[demo]   ✓ ${demoAccounts.length} demo resident accounts (password: ${DEMO_ACCOUNT_PASSWORD})`)

  console.log('[demo] ✓ Demo seeding complete')
}
