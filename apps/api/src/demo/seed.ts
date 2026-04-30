/**
 * Demo Seed Orchestrator
 *
 * Populates the tenant database with demo data (Phase 2).
 * Called from db/seed.ts only when APP_MODE=demo.
 *
 * Design principles:
 *   1. Building config is seeded FIRST — it's the source of truth
 *      for financial rules and amounts.
 *   2. The seed NEVER assigns "Vencido" status — all unpaid records
 *      are seeded as "Pendiente". The frontend's PROCESS_MATURITY
 *      engine handles the Pendiente → Vencido transition at runtime
 *      using the Catálogo de Conceptos rules.
 *   3. Amounts are read from buildingConfig, never hardcoded.
 *   4. Timestamps are offset to create a realistic timeline.
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
import { PAYMENT_PROFILES, getMonthsUpToNow, getPaymentDate } from './fixtures/pagos'
import { ticketData } from './fixtures/tickets'
import { avisoData } from './fixtures/avisos'
import { buildingConfig } from './fixtures/building-config'
import { DEMO_ACCOUNT_APARTMENTS, DEMO_ACCOUNT_PASSWORD, DEMO_ACCOUNT_ROLE, DEMO_ADMIN_ACCOUNTS, DEMO_STAFF_ACCOUNTS } from './fixtures/accounts'
import { paqueteData } from './fixtures/paquetes'
import { votacionData } from './fixtures/votaciones'
import { reservacionData } from './fixtures/reservaciones'
import { inventoryData } from './fixtures/inventory'

// ── Helpers ──────────────────────────────────────────────────────────

/** ISO string for N days ago */
function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

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

  // ── 1. Building Config (FIRST — source of truth for financial rules) ─
  raw.exec(`INSERT OR REPLACE INTO building_config (id, data) VALUES (1, '${JSON.stringify(buildingConfig).replace(/'/g, "''")}')`  )
  console.log('[demo]   ✓ Building config')

  // ── 2. Residents (116) ────────────────────────────────────────────────
  const residents = generateResidents()
  const insertResident = raw.prepare(
    'INSERT INTO residents (id, name, apartment, tower, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  for (const r of residents) {
    insertResident.run(`res-${r.apartment}`, r.name, r.apartment, r.tower, r.email, NOW, NOW)
  }
  console.log(`[demo]   ✓ ${residents.length} residents`)

  // ── 3. Staff (4) ─────────────────────────────────────────────────────
  const insertStaff = raw.prepare(
    'INSERT INTO staff (id, name, role, shift_start, shift_end, work_days, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  for (const s of staffMembers) {
    insertStaff.run(nanoid(), s.name, s.role, s.shiftStart, s.shiftEnd, JSON.stringify(s.workDays), NOW, NOW)
  }
  console.log(`[demo]   ✓ ${staffMembers.length} staff members`)

  // ── 4. Amenities (6) ─────────────────────────────────────────────────
  const insertAmenity = raw.prepare(
    'INSERT INTO amenities (id, name, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  )
  for (const a of amenitiesList) {
    insertAmenity.run(nanoid(), a.name, a.icon, NOW, NOW)
  }
  console.log(`[demo]   ✓ ${amenitiesList.length} amenities`)

  // ── 5. Pagos — profile-based, no Vencido assignment ──────────────────
  //    Amount read from buildingConfig (single source of truth)
  const monthlyFee = buildingConfig.monthlyFee
  const insertPago = raw.prepare(`
    INSERT INTO pagos
      (id, resident_id, apartment, resident, month, month_key, concepto, amount, status, payment_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const months = getMonthsUpToNow()
  let pagoCount = 0
  
  for (let i = 0; i < residents.length; i++) {
    const r = residents[i]
    const profile = PAYMENT_PROFILES[i % PAYMENT_PROFILES.length]

    for (const month of months) {
      if (month.isCurrent) {
        // Current month follows profile
        switch (profile) {
          case 'paid':
            insertPago.run(nanoid(), `res-${r.apartment}`, r.apartment, r.name, month.name, month.key, 'Mantenimiento', monthlyFee, 'Pagado', getPaymentDate(month.key), NOW, NOW)
            break
          case 'pending':
            insertPago.run(nanoid(), `res-${r.apartment}`, r.apartment, r.name, month.name, month.key, 'Mantenimiento', monthlyFee, 'Pendiente', null, NOW, NOW)
            break
          case 'validating':
            insertPago.run(nanoid(), `res-${r.apartment}`, r.apartment, r.name, month.name, month.key, 'Mantenimiento', monthlyFee, 'Por validar', null, NOW, NOW)
            break
          case 'debtor':
            insertPago.run(nanoid(), `res-${r.apartment}`, r.apartment, r.name, month.name, month.key, 'Mantenimiento', monthlyFee, 'Pendiente', null, NOW, NOW)
            break
        }
      } else {
        // Previous months are all paid unless they are a debtor
        const status = (profile === 'debtor' && months.indexOf(month) === months.length - 2) ? 'Pendiente' : 'Pagado'
        const payDate = status === 'Pagado' ? getPaymentDate(month.key) : null
        insertPago.run(nanoid(), `res-${r.apartment}`, r.apartment, r.name, month.name, month.key, 'Mantenimiento', monthlyFee, status, payDate, NOW, NOW)
      }
      pagoCount++
    }
  }

  // ── 5b. Sprinkle non-Mantenimiento charges for variety ───────────────
  //    A multa (immediate maturity) and a reservation charge
  const currentMonth = months[months.length - 1]
  const multaResident = residents[3]   // 4th resident
  insertPago.run(
    nanoid(), `res-${multaResident.apartment}`, multaResident.apartment, multaResident.name,
    currentMonth.name, currentMonth.key, 'Multa', 500,
    'Pendiente', null, NOW, NOW,
  )

  const amenidadResident = residents[8] // 9th resident
  insertPago.run(
    nanoid(), `res-${amenidadResident.apartment}`, amenidadResident.apartment, amenidadResident.name,
    currentMonth.name, currentMonth.key, 'Reserva Amenidad', 350,
    'Pagado', getPaymentDate(currentMonth.key), NOW, NOW,
  )

  console.log(`[demo]   ✓ ${pagoCount} residents processed + 2 extra charges (Multa, Reserva Amenidad)`)

  // ── 6. Egresos from recurringEgresos ─────────────────────────────────
  //    Generate current-month expense records. Most are already paid
  //    (nómina, servicios); administration fee is still pending.
  const insertEgreso = raw.prepare(`
    INSERT INTO egresos
      (id, categoria, concepto, description, amount, month_key, date, registered_by, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const month of months) {
    for (const re of buildingConfig.recurringEgresos) {
      const status = (re.categoria === 'administracion' && month.isCurrent) ? 'Pendiente' : 'Pagado'
      insertEgreso.run(
        nanoid(), re.categoria, re.concepto, re.description || '',
        re.amount, month.key, `${month.key}-01`,
        buildingConfig.adminName, status, NOW, NOW,
      )
    }
  }
  console.log(`[demo]   ✓ ${buildingConfig.recurringEgresos.length} egresos (current month)`)

  // ── 7. Tickets with realistic timeline ───────────────────────────────
  const insertTicket = raw.prepare(`
    INSERT INTO tickets
      (id, number, subject, description, category, priority, status, created_by, resident_id, apartment, created_at, updated_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (let i = 0; i < ticketData.length; i++) {
    const t = ticketData[i]
    const r = residents[t.residentIndex]
    const createdAt = daysAgoISO(t.daysAgo)
    const resolvedAt = t.resolvedDaysAgo != null ? daysAgoISO(t.resolvedDaysAgo) : null
    insertTicket.run(
      nanoid(), i + 1, t.subject, t.description, t.category, t.priority, t.status,
      r.name, `res-${r.apartment}`, r.apartment,
      createdAt, resolvedAt ?? createdAt,
      resolvedAt,
    )
  }
  raw.exec(`INSERT OR REPLACE INTO counters (key, value) VALUES ('ticket_number', ${ticketData.length})`)
  console.log(`[demo]   ✓ ${ticketData.length} tickets`)

  // ── 8. Avisos ────────────────────────────────────────────────────────
  const insertAviso = raw.prepare(`
    INSERT INTO avisos
      (id, title, category, description, attachment, date, pinned, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const a of avisoData) {
    insertAviso.run(nanoid(), a.title, a.category, a.description, '', a.date, a.pinned, NOW, NOW)
  }
  console.log(`[demo]   ✓ ${avisoData.length} avisos`)

  // ── 10. Paquetes ─────────────────────────────────────────────────────
  const insertPaquete = raw.prepare(`
    INSERT INTO paquetes
      (id, resident_id, recipient, apartment, received_date, status, location, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const p of paqueteData) {
    const r = residents[p.residentIndex]
    const d = new Date()
    d.setDate(d.getDate() - p.daysAgo)
    const receivedDate = d.toISOString().split('T')[0]
    insertPaquete.run(
      nanoid(), `res-${r.apartment}`, r.name, r.apartment,
      receivedDate, p.status, p.location, NOW, NOW
    )
  }
  console.log(`[demo]   ✓ ${paqueteData.length} paquetes`)

  // ── 11. Votaciones ───────────────────────────────────────────────────
  const insertVotacion = raw.prepare(`
    INSERT INTO votaciones (id, title, description, period_start, period_end, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertOption = raw.prepare(`
    INSERT INTO poll_options (id, poll_id, label, sort_order)
    VALUES (?, ?, ?, ?)
  `)
  const insertVote = raw.prepare(`
    INSERT INTO poll_votes (id, poll_id, option_id, name, apartment, voted_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  for (const v of votacionData) {
    const pollId = nanoid()
    const start = new Date()
    start.setDate(start.getDate() - v.periodStartDaysAgo)
    const end = new Date()
    end.setDate(end.getDate() + v.periodEndDaysFromNow)

    insertVotacion.run(
      pollId, v.title, v.description,
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0],
      v.status,
      NOW, NOW
    )

    // Insert options and keep track of IDs for votes
    const optionIds: Record<string, string> = {}
    v.options.forEach((opt, idx) => {
      const optId = nanoid()
      optionIds[opt.label] = optId
      insertOption.run(optId, pollId, opt.label, idx)
    })

    // Insert votes
    v.voterResidents.forEach(vr => {
      const r = residents[vr.residentIndex]
      const optLabel = v.options[vr.optionIndex].label
      const optId = optionIds[optLabel]
      if (optId) {
        insertVote.run(
          nanoid(), pollId, optId, r.name, r.apartment,
          daysAgoISO(v.periodStartDaysAgo - 1)
        )
      }
    })
  }
  console.log(`[demo]   ✓ ${votacionData.length} votaciones (normalized)`)

  // ── 12. Reservaciones ────────────────────────────────────────────────
  const insertReservacion = raw.prepare(`
    INSERT INTO reservaciones
      (id, date, grill, resident, resident_id, apartment, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const res of reservacionData) {
    const r = residents[res.residentIndex]
    const d = new Date()
    d.setDate(d.getDate() + res.daysFromNow)
    const reservDate = d.toISOString().split('T')[0]
    insertReservacion.run(
      nanoid(), reservDate,
      `${res.amenityName} (${res.timeSlot})`,
      r.name, `res-${r.apartment}`, r.apartment,
      res.status, NOW, NOW
    )
  }
  console.log(`[demo]   ✓ ${reservacionData.length} reservaciones`)

  // ── 13. Inventario ───────────────────────────────────────────────────
  const insertInventory = raw.prepare(`
    INSERT INTO inventory
      (id, name, category, owner_id, owner, current_user_id, current_user, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const item of inventoryData) {
    insertInventory.run(
      nanoid(), item.name, item.category, 'admin-1', item.owner,
      null, item.currentUser, item.notes || '', NOW, NOW
    )
  }
  console.log(`[demo]   ✓ ${inventoryData.length} items de inventario`)

  // ── 9. Demo resident auth accounts ───────────────────────────────────
  // Look up by apartment code — stable regardless of generation order
  const demoAccounts = [
    ...DEMO_ACCOUNT_APARTMENTS.map(apt => {
      const r = residents.find(res => res.apartment === apt)
      if (!r) throw new Error(`[demo] Apartment ${apt} not found in generated residents`)
      return { name: r.name, email: r.email, role: DEMO_ACCOUNT_ROLE, apartment: r.apartment }
    }),
    ...DEMO_ADMIN_ACCOUNTS.map(a => ({ ...a, apartment: null })),
    ...DEMO_STAFF_ACCOUNTS.map(s => ({ ...s, apartment: null }))
  ]

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
          VALUES ('${nanoid()}', '${userId}', '${tenantId}', '${acct.role}', ${acct.apartment ? `'${acct.apartment}'` : 'NULL'}, '${NOW}');
        `)
      }
    } catch (e: any) {
      console.log(`[demo]   ⚠ Demo user ${acct.email} skipped:`, e.message || 'exists')
    }
  }
  console.log(`[demo]   ✓ ${demoAccounts.length} demo accounts (password: ${DEMO_ACCOUNT_PASSWORD})`)

  console.log('[demo] ✓ Demo seeding complete')
}
