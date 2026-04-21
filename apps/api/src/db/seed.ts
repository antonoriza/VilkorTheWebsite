/**
 * Database Seeder — Creates base + optional demo data
 *
 * Usage: bun run src/db/seed.ts
 *
 * Behavior depends on APP_MODE environment variable:
 *   - 'production': Creates super_admin user + empty tenant schema only
 *   - 'demo':       Creates super_admin + demo tenant with 116 residents,
 *                   payments, tickets, staff, amenities, and sample data
 */
import { nanoid } from './utils'
import { rawMasterDb } from './master'
import { tenantDB } from './tenant'
import { migrateMaster, migrateTenant } from './migrate'
import { auth } from '../auth'

const APP_MODE = process.env.APP_MODE || 'production'
const TENANT_ID = 'demo'
const NOW = new Date().toISOString()

// ═══════════════════════════════════════════════════════════════════════
// NAME GENERATION — 116 unique Mexican names
// ═══════════════════════════════════════════════════════════════════════

const FIRST_NAMES_M = [
  'Carlos', 'Juan', 'Miguel', 'José', 'Luis', 'Francisco', 'Antonio',
  'Pedro', 'Manuel', 'Rafael', 'Fernando', 'Roberto', 'Ricardo', 'Alberto',
  'Eduardo', 'Alejandro', 'Sergio', 'Javier', 'Daniel', 'Arturo',
  'Enrique', 'Óscar', 'Raúl', 'Héctor', 'Jorge', 'Guillermo', 'Adrián',
  'Pablo', 'Andrés', 'Diego', 'Iván', 'Gustavo', 'Hugo', 'Ramón',
  'Salvador', 'Gabriel', 'Mauricio', 'Ernesto', 'Víctor', 'Tomás',
  'Emilio', 'Ignacio', 'Rodrigo', 'César', 'Felipe', 'Ángel', 'Rubén',
  'Armando', 'Gerardo', 'Omar', 'David', 'Saúl', 'Ismael', 'Alfredo',
  'Martín', 'Benito', 'Lorenzo', 'Nicolás',
]

const FIRST_NAMES_F = [
  'María', 'Ana', 'Carmen', 'Laura', 'Patricia', 'Guadalupe', 'Rosa',
  'Sofía', 'Andrea', 'Fernanda', 'Claudia', 'Verónica', 'Sandra',
  'Teresa', 'Mónica', 'Elena', 'Lucía', 'Gabriela', 'Cecilia', 'Silvia',
  'Martha', 'Gloria', 'Leticia', 'Alicia', 'Daniela', 'Valeria',
  'Isabella', 'Mariana', 'Paulina', 'Ximena', 'Alejandra', 'Beatriz',
  'Catalina', 'Diana', 'Estela', 'Fabiola', 'Griselda', 'Irma',
  'Josefina', 'Karla', 'Lourdes', 'Nadia', 'Olivia', 'Pilar',
  'Rebeca', 'Susana', 'Verónica', 'Yolanda', 'Angélica', 'Brenda',
  'Consuelo', 'Dolores', 'Esperanza', 'Francisca', 'Graciela',
  'Hortensia', 'Ivonne', 'Julia',
]

const SURNAMES = [
  'García', 'Hernández', 'López', 'Martínez', 'González', 'Rodríguez',
  'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera',
  'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez',
  'Ortiz', 'Ramos', 'Jiménez', 'Mendoza', 'Ruiz', 'Aguilar',
  'Castillo', 'Vargas', 'Romero', 'Herrera', 'Medina', 'Castro',
  'Núñez', 'Vega', 'Delgado', 'Guerrero', 'Contreras', 'Estrada',
  'Ávila', 'Salazar', 'Fuentes', 'Campos', 'Cervantes', 'Rojas',
  'Acosta', 'Navarro', 'Molina', 'Ibarra', 'Soto', 'Lara',
  'Bautista', 'Cabrera', 'Luna', 'Domínguez', 'Suárez', 'Montes',
  'Orozco', 'Valencia', 'Ponce', 'Figueroa',
]

function generateResidents(): { name: string; apartment: string; tower: string; email: string }[] {
  const residents: { name: string; apartment: string; tower: string; email: string }[] = []

  // Tower DANUBIO (B): floors 01-14 × 4 units + floor 15 × 2 = 58
  // Tower RIN (A): floors 01-14 × 4 units + floor 15 × 2 = 58
  // Total: 116

  const towers = [
    { prefix: 'B', name: 'DANUBIO' },
    { prefix: 'A', name: 'RIN' },
  ]

  let nameIdx = 0

  for (const tower of towers) {
    for (let floor = 1; floor <= 15; floor++) {
      const unitsOnFloor = floor === 15 ? 2 : 4
      for (let unit = 1; unit <= unitsOnFloor; unit++) {
        const apt = `${tower.prefix}${String(floor).padStart(2, '0')}${String(unit).padStart(2, '0')}`

        // Alternate male/female names, cycle through surnames
        const isMale = nameIdx % 2 === 0
        const namePool = isMale ? FIRST_NAMES_M : FIRST_NAMES_F
        const firstName = namePool[Math.floor(nameIdx / 2) % namePool.length]
        const surname = SURNAMES[nameIdx % SURNAMES.length]

        residents.push({
          name: `${firstName} ${surname}`,
          apartment: apt,
          tower: tower.name,
          email: `${apt}@gmail.com`,
        })
        nameIdx++
      }
    }
  }

  return residents
}

// ═══════════════════════════════════════════════════════════════════════
// SEED PHASES
// ═══════════════════════════════════════════════════════════════════════

// ─── Phase 1: Base (always runs) ─────────────────────────────────────

async function seedBase() {
  console.log('[seed] Phase 1: Base setup...')
  migrateMaster()

  // Create demo tenant
  const existing = rawMasterDb.query('SELECT id FROM tenants WHERE id = ?').get(TENANT_ID) as any
  if (!existing) {
    rawMasterDb.exec(`
      INSERT INTO tenants (id, name, slug, category, address, city, state, country, status, created_at, updated_at)
      VALUES ('demo', 'Lote Alemania', 'lote-alemania', 'residencial',
              'Cosmopol HU Lifestyle, Coacalco', 'Coacalco', 'Estado de México', 'México',
              'active', '${NOW}', '${NOW}');
    `)
    console.log('[seed]   ✓ Demo tenant registered')
  }

  // Create tenant DB schema
  migrateTenant(TENANT_ID)

  // Create super_admin user via Better Auth
  const existingUser = rawMasterDb.query("SELECT id FROM user WHERE email = 'admin@property.com'").get() as any
  if (!existingUser) {
    try {
      const result = await auth.api.signUpEmail({
        body: {
          name: 'Administrador General',
          email: 'admin@property.com',
          password: 'admin123',
        },
      })
      const userId = (result as any).user?.id
      if (userId) {
        rawMasterDb.exec(`
          INSERT OR IGNORE INTO user_tenants (id, user_id, tenant_id, role, apartment, created_at)
          VALUES ('${nanoid()}', '${userId}', 'demo', 'super_admin', NULL, '${NOW}');
        `)
        console.log('[seed]   ✓ Super admin created (admin@property.com / admin123)')
      }
    } catch (e: any) {
      console.log('[seed]   ⚠ Admin creation skipped:', e.message || 'already exists')
    }
  } else {
    console.log('[seed]   ✓ Super admin already exists')
  }
}

// ─── Phase 2: Demo data (only when APP_MODE=demo) ────────────────────

async function seedDemo() {
  console.log('[seed] Phase 2: Demo data...')

  const raw = tenantDB.getRaw(TENANT_ID)

  // Check if already seeded
  const count = raw.query('SELECT COUNT(*) as c FROM residents').get() as any
  if (count?.c > 0) {
    console.log('[seed]   Already has data, skipping demo seed')
    return
  }

  // ── Residents (116) ──
  const residents = generateResidents()
  const insertResident = raw.prepare('INSERT INTO residents (id, name, apartment, tower, email) VALUES (?, ?, ?, ?, ?)')
  for (const r of residents) {
    insertResident.run(`res-${r.apartment}`, r.name, r.apartment, r.tower, r.email)
  }
  console.log(`[seed]   ✓ ${residents.length} residents (Mexican names)`)

  // ── Staff ──
  const staffMembers = [
    { name: 'Ricardo Hernández', role: 'Guardia', shiftStart: '07:00', shiftEnd: '19:00', workDays: ['L','M','Mi','J','V','S','D'] },
    { name: 'Enrique Martínez', role: 'Jardinero', shiftStart: '06:00', shiftEnd: '14:00', workDays: ['L','Mi','V'] },
    { name: 'Valentina Sánchez', role: 'Limpieza', shiftStart: '08:00', shiftEnd: '17:00', workDays: ['L','M','Mi','J','V','S'] },
    { name: 'Samantha Guzmán', role: 'Administradora General', shiftStart: '09:00', shiftEnd: '18:00', workDays: ['L','M','Mi','J','V'] },
  ]
  const insertStaff = raw.prepare('INSERT INTO staff (id, name, role, shift_start, shift_end, work_days) VALUES (?, ?, ?, ?, ?, ?)')
  for (const s of staffMembers) {
    insertStaff.run(nanoid(), s.name, s.role, s.shiftStart, s.shiftEnd, JSON.stringify(s.workDays))
  }
  console.log(`[seed]   ✓ ${staffMembers.length} staff members`)

  // ── Amenities ──
  const amenities = [
    { name: 'Asador 1', icon: 'outdoor_grill' },
    { name: 'Asador 2', icon: 'outdoor_grill' },
    { name: 'Asador 3', icon: 'outdoor_grill' },
  ]
  const insertAmenity = raw.prepare('INSERT INTO amenities (id, name, icon) VALUES (?, ?, ?)')
  for (const a of amenities) {
    insertAmenity.run(nanoid(), a.name, a.icon)
  }
  console.log(`[seed]   ✓ ${amenities.length} amenities`)

  // ── Pagos (current month for each resident) ──
  const pagoStatuses = ['Pagado', 'Pagado', 'Pagado', 'Pendiente', 'Por validar', 'Pendiente', 'Pagado', 'Vencido']
  const insertPago = raw.prepare(`INSERT INTO pagos
    (id, apartment, resident, month, month_key, concepto, amount, status, payment_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)

  let pagoCount = 0
  for (const r of residents) {
    const status = pagoStatuses[pagoCount % pagoStatuses.length]
    insertPago.run(
      nanoid(), r.apartment, r.name, 'abril de 2026', '2026-04',
      'Mantenimiento', 1800, status,
      status === 'Pagado' ? '2026-04-05' : null
    )
    pagoCount++
  }
  console.log(`[seed]   ✓ ${pagoCount} pagos`)

  // ── Tickets ──
  const ticketData = [
    { subject: 'Fuga de agua en baño', desc: 'Se detectó una fuga en el baño principal del departamento', category: 'Plomería', priority: 'Alta', status: 'Nuevo', by: residents[0].name, apt: residents[0].apartment },
    { subject: 'Foco fundido en pasillo piso 3', desc: 'El foco del pasillo del 3er piso no enciende desde hace una semana', category: 'Electricidad', priority: 'Baja', status: 'Resuelto', by: residents[1].name, apt: residents[1].apartment },
    { subject: 'Elevador tarda en abrir', desc: 'El elevador de Torre DANUBIO tarda más de lo normal en abrir las puertas', category: 'Áreas Comunes', priority: 'Media', status: 'En Proceso', by: residents[5].name, apt: residents[5].apartment },
    { subject: 'Ruido excesivo en depto vecino', desc: 'El departamento contiguo genera ruido excesivo después de las 22:00', category: 'Seguridad', priority: 'Media', status: 'Asignado', by: residents[10].name, apt: residents[10].apartment },
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
  raw.exec(`INSERT OR REPLACE INTO counters (key, value) VALUES ('ticket_number', ${ticketData.length})`)

  // ── Avisos ──
  const insertAviso = raw.prepare(`INSERT INTO avisos
    (id, title, category, description, attachment, date, pinned, tracking)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)

  insertAviso.run(nanoid(), 'Mantenimiento de elevadores', 'general',
    'Se realizará mantenimiento preventivo a los elevadores los días 25 y 26 de abril. Se solicita usar escaleras durante el horario de 9:00 a 14:00.',
    '', '2026-04-20', 1, '[]')
  insertAviso.run(nanoid(), 'Asamblea Ordinaria Abril 2026', 'asamblea',
    'Se convoca a todos los condóminos a la asamblea ordinaria del mes de abril. Orden del día: revisión financiera, mantenimiento preventivo y asuntos generales.',
    '', '2026-04-15', 0, '[]')
  console.log('[seed]   ✓ 2 avisos')

  // ── Building Config ──
  const buildingConfig = {
    propertyCategory: 'residencial',
    type: 'towers',
    groupingMode: 'vertical',
    towers: ['RIN', 'DANUBIO'],
    buildingName: 'Lote Alemania',
    buildingAddress: 'Cosmopol HU Lifestyle, Coacalco',
    zipCode: '55712',
    city: 'Coacalco de Berriozábal',
    state: 'Estado de México',
    country: 'México',
    managementCompany: 'Canton Alfa Inc.',
    totalUnits: 116,
    adminName: 'Administrador General',
    adminEmail: 'admin@property.com',
    adminPhone: '+52 55 1234 5678',
    conceptosPago: ['Mantenimiento', 'Multa', 'Otros', 'Reserva Amenidad'],
    subConceptos: { 'Otros': [], 'Multa': [], 'Mantenimiento': [], 'Reserva Amenidad': [] },
    categoriasEgreso: ['nomina', 'mantenimiento', 'servicios', 'equipo', 'seguros', 'administracion', 'otros'],
    monthlyFee: 1800,
    recurringEgresos: [
      { id: 're-1', concepto: 'Nómina — Ricardo Hernández',  categoria: 'nomina',         amount: 13000,  description: 'Pago mensual guardia de seguridad.' },
      { id: 're-2', concepto: 'Nómina — Enrique Martínez',   categoria: 'nomina',         amount: 11000,  description: 'Pago mensual jardinero.' },
      { id: 're-3', concepto: 'Nómina — Valentina Sánchez',  categoria: 'nomina',         amount: 10000,  description: 'Pago mensual personal de limpieza.' },
      { id: 're-4', concepto: 'Recibo de Agua',              categoria: 'servicios',      amount: 3200,   description: 'Servicio de agua potable.' },
      { id: 're-5', concepto: 'Recibo de Luz',               categoria: 'servicios',      amount: 5800,   description: 'Servicio de energía eléctrica áreas comunes.' },
      { id: 're-6', concepto: 'Honorarios Administración',   categoria: 'administracion', amount: 15000,  description: 'Cuota mensual de la empresa administradora.' },
    ],
    maturityRules: { mantenimiento: 'next_month_01', amenidad: 'day_of_event', multaOtros: 'immediate' },
    surcharge: { enabled: false, type: 'percent', amount: 5, graceDays: 10, frequency: 'monthly' },
    banking: {
      clabe: '0123 4567 8901 2345 67',
      bankName: 'BBVA México',
      accountHolder: 'Canton Alfa Inc.',
      acceptsTransfer: true,
      acceptsCash: false,
      acceptsOxxo: false,
      referenceFormat: 'apartment',
      notes: 'Indicar número de departamento en referencia del pago.',
    },
    zoning: [
      { id: 'zn-1', name: 'Lobby Principal', type: 'lobby', linkedContainer: 'RIN' },
      { id: 'zn-2', name: 'Elevadores Torre A', type: 'elevator', linkedContainer: 'RIN' },
      { id: 'zn-3', name: 'Acceso Vehicular Norte', type: 'gate', linkedContainer: 'DANUBIO' },
    ],
    topology: {
      containers: [
        { id: 'top-1', name: 'RIN', unitsCount: 58, parkingCount: 65, storageCount: 40 },
        { id: 'top-2', name: 'DANUBIO', unitsCount: 58, parkingCount: 65, storageCount: 40 },
      ],
      unitNomenclature: 'X000',
    },
    defaultUnitDna: { privateArea: 65, totalArea: 72, ownershipCoefficient: 0.0086, usageType: 'propietario' },
    equipment: [
      { id: 'eq-1', name: 'Elevador 1', type: 'elevator', category: 'transporte', location: 'DANUBIO', nextMaintenance: '2026-06-15' },
      { id: 'eq-2', name: 'Escalera Mecánica 1', type: 'elevator', category: 'transporte', location: 'DANUBIO', nextMaintenance: '2026-08-01' },
      { id: 'eq-3', name: 'Bomba 1', type: 'pump', category: 'hidraulica', location: '*', nextMaintenance: '2026-05-10' },
      { id: 'eq-4', name: 'Cisterna 1', type: 'cistern', category: 'hidraulica', location: '*', nextMaintenance: '2026-07-20' },
      { id: 'eq-5', name: 'Paneles Solares 1', type: 'solar', category: 'energia', location: '*', nextMaintenance: '2026-06-15' },
      { id: 'eq-6', name: 'Planta Eléctrica 1', type: 'electric_plant', category: 'energia', location: '*', nextMaintenance: '2026-09-01' },
      { id: 'eq-7', name: 'CCTV 1', type: 'cctv', category: 'seguridad', location: '*', nextMaintenance: '2026-05-30' },
      { id: 'eq-8', name: 'Portón/Acceso 1', type: 'gate', category: 'seguridad', location: '*', nextMaintenance: '2026-10-01' },
    ],
    vendors: [
      { id: 'v-1', service: 'Recolección de Basura', name: 'Servicios Urbanos CDMX', category: 'limpieza', phone: '55 1234 5678', schedule: 'L-S 7:00-10:00', type: 'recurrente', notes: 'Pase L, Mi, V para residuos generales. M para reciclaje.' },
      { id: 'v-2', service: 'Plomería (Urgencias)', name: 'Fontanería Rápida 24h', category: 'plomeria', phone: '55 9876 5432', type: 'urgencias', notes: 'Disponible 24/7. Cobro de urgencia nocturna aplica.' },
      { id: 'v-3', service: 'Técnicos de Elevadores', name: 'Elevadores Thyssen KM', category: 'elevadores', phone: '55 5555 1111', email: 'soporte@thyssenkm.com', schedule: 'L-V 8:00-18:00', type: 'mantenimiento', notes: 'Contrato anual de mantenimiento preventivo. Emergencias ext. 2.' },
      { id: 'v-4', service: 'Electricidad General', name: 'Ingelectra', category: 'electricidad', phone: '55 4321 8765', schedule: 'L-V 9:00-17:00', type: 'mantenimiento' },
      { id: 'v-5', service: 'Seguridad Perimetral', name: 'Grupo Segura SA', category: 'seguridad', phone: '55 0000 9999', type: 'urgencias', notes: 'Panel de alarma conectado directamente a su central de monitoreo.' },
    ],
    permissionsMatrix: {
      finanzas: { ver: ['super_admin', 'administracion'], crear: ['super_admin', 'administracion'], editar: [], eliminar: [] },
      logistica: { ver: ['super_admin', 'administracion', 'operador'], crear: ['super_admin', 'administracion', 'operador'], editar: ['super_admin', 'administracion'], eliminar: ['super_admin'] },
      comunicacion: { ver: ['super_admin', 'administracion', 'operador', 'residente'], crear: ['super_admin', 'administracion'], editar: ['super_admin', 'administracion'], eliminar: ['super_admin'] },
      gobernanza: { ver: ['super_admin', 'administracion', 'residente'], crear: ['super_admin'], votar: ['residente'], eliminar: ['super_admin'] },
      directorio: { ver: ['super_admin', 'administracion', 'operador'], crear: ['super_admin', 'administracion'], editar: ['super_admin', 'administracion'], eliminar: ['super_admin'] },
      configuracion: { ver: ['super_admin'], editar: ['super_admin'] },
    },
  }

  raw.exec(`INSERT OR REPLACE INTO building_config (id, data) VALUES (1, '${JSON.stringify(buildingConfig).replace(/'/g, "''")}')`);
  console.log('[seed]   ✓ Building config (full)')

  // ── Demo login accounts (Better Auth users for residents) ──
  const demoAccounts = [
    { name: residents[0].name, email: residents[0].email, apartment: residents[0].apartment, role: 'residente' },
    { name: residents[1].name, email: residents[1].email, apartment: residents[1].apartment, role: 'residente' },
    { name: residents[58].name, email: residents[58].email, apartment: residents[58].apartment, role: 'residente' },
    { name: residents[59].name, email: residents[59].email, apartment: residents[59].apartment, role: 'residente' },
  ]

  for (const acct of demoAccounts) {
    try {
      const existingUser = rawMasterDb.query('SELECT id FROM user WHERE email = ?').get(acct.email) as any
      if (existingUser) continue

      const result = await auth.api.signUpEmail({
        body: { name: acct.name, email: acct.email, password: 'demo123' },
      })
      const userId = (result as any).user?.id
      if (userId) {
        rawMasterDb.exec(`
          INSERT OR IGNORE INTO user_tenants (id, user_id, tenant_id, role, apartment, created_at)
          VALUES ('${nanoid()}', '${userId}', 'demo', '${acct.role}', '${acct.apartment}', '${NOW}');
        `)
      }
    } catch (e: any) {
      console.log(`[seed]   ⚠ Demo user ${acct.email} skipped:`, e.message || 'exists')
    }
  }
  console.log(`[seed]   ✓ ${demoAccounts.length} demo resident accounts (password: demo123)`)

  console.log('[seed] ✓ Demo data seeded')
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════

if (import.meta.main) {
  console.log(`[seed] APP_MODE = ${APP_MODE}\n`)

  await seedBase()

  if (APP_MODE === 'demo') {
    await seedDemo()
  } else {
    console.log('[seed] Production mode — skipping demo data')
  }

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
  console.log('\n[seed] Stats:', stats)

  // List demo login credentials
  if (APP_MODE === 'demo') {
    console.log('\n[seed] Demo Credentials:')
    console.log('  Admin:    admin@property.com / admin123')
    console.log('  Resident: B0101@gmail.com / demo123')
    console.log('  Resident: B0102@gmail.com / demo123')
    console.log('  Resident: A0101@gmail.com / demo123')
    console.log('  Resident: A0102@gmail.com / demo123')
  }

  tenantDB.closeAll()
  process.exit(0)
}

export { seedBase, seedDemo }
