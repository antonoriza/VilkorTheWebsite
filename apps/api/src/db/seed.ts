/**
 * Database Seeder — Creates a demo tenant with sample data
 *
 * Usage: bun run src/db/seed.ts
 *
 * Creates:
 *   1. A demo tenant in master.db ("Lote Alemania")
 *   2. A tenant_demo.db with the full schema
 *   3. Sample residents, pagos, tickets, etc.
 */
import { nanoid } from './utils'
import { rawMasterDb } from './master'
import { tenantDB } from './tenant'
import { migrateMaster, migrateTenant } from './migrate'

const TENANT_ID = 'demo'
const NOW = new Date().toISOString()

// ─── Seed Master DB ──────────────────────────────────────────────────

function seedMaster() {
  console.log('[seed] Seeding master.db...')
  migrateMaster()

  // Check if demo tenant already exists
  const existing = rawMasterDb.query('SELECT id FROM tenants WHERE id = ?').get(TENANT_ID) as any
  if (existing) {
    console.log('[seed] Demo tenant already exists, skipping master seed')
    return
  }

  rawMasterDb.exec(`
    INSERT INTO tenants (id, name, slug, category, address, city, state, country, status, created_at, updated_at)
    VALUES ('demo', 'Lote Alemania', 'lote-alemania', 'residencial', 
            'Cosmopol HU Lifestyle, Coacalco', 'Coacalco', 'Estado de México', 'México',
            'active', '${NOW}', '${NOW}');
  `)

  console.log('[seed] ✓ Demo tenant registered')
}

// ─── Seed Tenant DB ──────────────────────────────────────────────────

function seedTenant() {
  console.log('[seed] Seeding tenant_demo.db...')
  migrateTenant(TENANT_ID)

  const raw = tenantDB.getRaw(TENANT_ID)

  // Check if already seeded
  const count = raw.query('SELECT COUNT(*) as c FROM residents').get() as any
  if (count?.c > 0) {
    console.log('[seed] Demo tenant already has data, skipping')
    return
  }

  // ── Residents ──
  const residents = [
    { id: nanoid(), name: 'Zsolt Bereszkai', apartment: 'B101', tower: 'B', email: 'b0101@gmail.com' },
    { id: nanoid(), name: 'Michal Orinstein', apartment: 'A201', tower: 'A', email: 'a0201.1@gmail.com' },
    { id: nanoid(), name: 'Carlos Mendoza', apartment: 'A101', tower: 'A', email: 'carlos.mendoza@gmail.com' },
    { id: nanoid(), name: 'Ana García', apartment: 'A102', tower: 'A', email: 'ana.garcia@gmail.com' },
    { id: nanoid(), name: 'Roberto Fernández', apartment: 'B201', tower: 'B', email: 'roberto.f@gmail.com' },
    { id: nanoid(), name: 'María López', apartment: 'A301', tower: 'A', email: 'maria.lopez@gmail.com' },
    { id: nanoid(), name: 'Juan Pérez', apartment: 'B301', tower: 'B', email: 'juan.perez@gmail.com' },
    { id: nanoid(), name: 'Laura Sánchez', apartment: 'A401', tower: 'A', email: 'laura.s@gmail.com' },
  ]

  const insertResident = raw.prepare('INSERT INTO residents (id, name, apartment, tower, email) VALUES (?, ?, ?, ?, ?)')
  for (const r of residents) {
    insertResident.run(r.id, r.name, r.apartment, r.tower, r.email)
  }
  console.log(`[seed]   ✓ ${residents.length} residents`)

  // ── Staff ──
  const staffMembers = [
    { id: nanoid(), name: 'Samantha Guzman', role: 'Limpieza', shiftStart: '08:00', shiftEnd: '17:00', workDays: ['L','M','Mi','J','V','S'] },
    { id: nanoid(), name: 'Pedro Martínez', role: 'Guardia', shiftStart: '07:00', shiftEnd: '19:00', workDays: ['L','M','Mi','J','V','S','D'] },
    { id: nanoid(), name: 'Rosa Hernández', role: 'Jardinero', shiftStart: '06:00', shiftEnd: '14:00', workDays: ['L','Mi','V'] },
    { id: nanoid(), name: 'Antonio Ruiz', role: 'Administradora General', shiftStart: '09:00', shiftEnd: '18:00', workDays: ['L','M','Mi','J','V'] },
  ]

  const insertStaff = raw.prepare('INSERT INTO staff (id, name, role, shift_start, shift_end, work_days) VALUES (?, ?, ?, ?, ?, ?)')
  for (const s of staffMembers) {
    insertStaff.run(s.id, s.name, s.role, s.shiftStart, s.shiftEnd, JSON.stringify(s.workDays))
  }
  console.log(`[seed]   ✓ ${staffMembers.length} staff members`)

  // ── Amenities ──
  const amenitiesList = [
    { id: nanoid(), name: 'Asador 1', icon: 'outdoor_grill' },
    { id: nanoid(), name: 'Asador 2', icon: 'outdoor_grill' },
    { id: nanoid(), name: 'Salón de Eventos', icon: 'celebration' },
    { id: nanoid(), name: 'Alberca', icon: 'pool' },
  ]

  const insertAmenity = raw.prepare('INSERT INTO amenities (id, name, icon) VALUES (?, ?, ?)')
  for (const a of amenitiesList) {
    insertAmenity.run(a.id, a.name, a.icon)
  }
  console.log(`[seed]   ✓ ${amenitiesList.length} amenities`)

  // ── Pagos (sample payments) ──
  const pagoStatuses = ['Pagado', 'Pagado', 'Pagado', 'Pendiente', 'Por validar']
  const insertPago = raw.prepare(`INSERT INTO pagos 
    (id, apartment, resident, month, month_key, concepto, amount, status, payment_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)

  let pagoCount = 0
  for (const r of residents) {
    const status = pagoStatuses[pagoCount % pagoStatuses.length]
    insertPago.run(
      nanoid(), r.apartment, r.name, 'abril de 2026', '2026-04',
      'Mantenimiento', 2500, status,
      status === 'Pagado' ? '2026-04-05' : null
    )
    pagoCount++
  }
  console.log(`[seed]   ✓ ${pagoCount} pagos`)

  // ── Tickets ──
  const ticketData = [
    { subject: 'Fuga de agua en baño', desc: 'Se detectó una fuga en el baño principal', category: 'Plomería', priority: 'Alta', status: 'Nuevo', by: 'Carlos Mendoza', apt: 'A101' },
    { subject: 'Foco fundido en pasillo', desc: 'El foco del pasillo del 3er piso no enciende', category: 'Electricidad', priority: 'Baja', status: 'Resuelto', by: 'Ana García', apt: 'A102' },
  ]

  const insertTicket = raw.prepare(`INSERT INTO tickets 
    (id, number, subject, description, category, priority, status, created_by, apartment, created_at, updated_at, resolved_at, activities) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)

  for (let i = 0; i < ticketData.length; i++) {
    const t = ticketData[i]
    insertTicket.run(
      nanoid(), i + 1, t.subject, t.desc, t.category, t.priority, t.status,
      t.by, t.apt, NOW, NOW,
      t.status === 'Resuelto' ? NOW : null,
      JSON.stringify([])
    )
  }
  console.log(`[seed]   ✓ ${ticketData.length} tickets`)

  // ── Ticket Counter ──
  raw.exec(`INSERT INTO counters (key, value) VALUES ('ticket_number', ${ticketData.length})`)

  // ── Avisos ──
  const insertAviso = raw.prepare(`INSERT INTO avisos
    (id, title, category, description, attachment, date, pinned, tracking)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)

  insertAviso.run(nanoid(), 'Mantenimiento de elevadores', 'general',
    'Se realizará mantenimiento preventivo a los elevadores los días 25 y 26 de abril.',
    '', '2026-04-20', 1, '[]')
  insertAviso.run(nanoid(), 'Asamblea Ordinaria Abril 2026', 'asamblea',
    'Se convoca a todos los condóminos a la asamblea ordinaria.',
    '', '2026-04-15', 0, '[]')
  console.log('[seed]   ✓ 2 avisos')

  // ── Building Config (stored as JSON document) ──
  const buildingConfig = {
    propertyCategory: 'residencial',
    type: 'towers',
    groupingMode: 'vertical',
    towers: ['A', 'B'],
    buildingName: 'Lote Alemania',
    buildingAddress: 'Cosmopol HU Lifestyle, Coacalco',
    zipCode: '55714',
    city: 'Coacalco',
    state: 'Estado de México',
    country: 'México',
    managementCompany: 'Cosmopol HU Lifestyle',
    totalUnits: 116,
    adminName: 'Administrador',
    adminEmail: 'admin@property.com',
    adminPhone: '+52 55 1234 5678',
    conceptosPago: ['Mantenimiento', 'Multa', 'Otros', 'Reserva Amenidad'],
    subConceptos: {},
    categoriasEgreso: ['nomina', 'mantenimiento', 'servicios', 'equipo', 'seguros', 'administracion', 'otros'],
    monthlyFee: 2500,
    recurringEgresos: [],
    maturityRules: { mantenimiento: 'next_month_01', amenidad: 'day_of_event', multaOtros: 'immediate' },
    surcharge: { enabled: false, type: 'percent', amount: 5, graceDays: 15, frequency: 'monthly' },
    banking: { clabe: '', bankName: '', accountHolder: '', acceptsTransfer: true, acceptsCash: true, acceptsOxxo: false, referenceFormat: 'apartment' },
    zoning: [],
    topology: { containers: [{ id: 'a', name: 'Torre A', unitsCount: 58, parkingCount: 58, storageCount: 0 }, { id: 'b', name: 'Torre B', unitsCount: 58, parkingCount: 58, storageCount: 0 }], unitNomenclature: '{tower}{floor}{unit}' },
    defaultUnitDna: { privateArea: 65, totalArea: 75, ownershipCoefficient: 0.862, usageType: 'propietario' },
    equipment: [],
    vendors: [],
    permissionsMatrix: {},
  }

  raw.exec(`INSERT INTO building_config (id, data) VALUES (1, '${JSON.stringify(buildingConfig).replace(/'/g, "''")}')`)
  console.log('[seed]   ✓ building config')

  console.log('[seed] ✓ Demo tenant seeded')
}

// ─── Main ────────────────────────────────────────────────────────────

if (import.meta.main) {
  seedMaster()
  seedTenant()
  console.log('\n[seed] Complete ✓')

  // Verify
  const raw = tenantDB.getRaw(TENANT_ID)
  const stats = {
    residents: (raw.query('SELECT COUNT(*) as c FROM residents').get() as any).c,
    staff: (raw.query('SELECT COUNT(*) as c FROM staff').get() as any).c,
    pagos: (raw.query('SELECT COUNT(*) as c FROM pagos').get() as any).c,
    tickets: (raw.query('SELECT COUNT(*) as c FROM tickets').get() as any).c,
    avisos: (raw.query('SELECT COUNT(*) as c FROM avisos').get() as any).c,
    amenities: (raw.query('SELECT COUNT(*) as c FROM amenities').get() as any).c,
  }
  console.log('[seed] Stats:', stats)

  tenantDB.closeAll()
  process.exit(0)
}

export { seedMaster, seedTenant }
