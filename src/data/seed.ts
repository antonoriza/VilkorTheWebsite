// ── Seed Data ────────────────────────────────────────────────────────
// Mirrors the v0 prototype at v0-condominio-assistant.vercel.app

export interface Aviso {
  id: string
  title: string
  attachment: string
  date: string
}

export interface Pago {
  id: string
  apartment: string
  resident: string
  month: string
  amount: number
  status: 'Pagado' | 'Pendiente'
  paymentDate: string | null
}

export interface Paquete {
  id: string
  recipient: string
  apartment: string
  receivedDate: string
  status: 'Entregado' | 'Pendiente'
  location: string
}

export interface Reservacion {
  id: string
  date: string
  grill: string
  resident: string
  apartment: string
  status: 'Reservado' | 'Por confirmar' | 'Cancelado'
}

export interface VoteOption {
  label: string
  votes: number
}

export interface Votacion {
  id: string
  title: string
  description: string
  periodStart: string
  periodEnd: string
  status: 'Activa' | 'Cerrada'
  options: VoteOption[]
  voters: string[]
}

export interface Resident {
  name: string
  apartment: string
  email: string
}

// ── Residents ──
export const seedResidents: Resident[] = [
  { name: 'Sofía Torres', apartment: 'A101', email: 'sofia@property.com' },
  { name: 'Luis Díaz', apartment: 'A102', email: 'luis@property.com' },
  { name: 'Luis Martínez', apartment: 'A103', email: 'martinez@property.com' },
  { name: 'Pedro Sánchez', apartment: 'A104', email: 'pedro@property.com' },
  { name: 'Ana López', apartment: 'A201', email: 'ana@property.com' },
  { name: 'María Ramírez', apartment: 'A202', email: 'maria@property.com' },
  { name: 'Carlos Gómez', apartment: 'A203', email: 'carlos@property.com' },
  { name: 'Juan Pérez', apartment: 'A204', email: 'juan@property.com' },
  { name: 'Laura Ramírez', apartment: 'B101', email: 'laura@property.com' },
  { name: 'Roberto Mendez', apartment: 'B102', email: 'roberto@property.com' },
  { name: 'María López', apartment: 'B203', email: 'mlopez@property.com' },
  { name: 'Gabriela Sánchez', apartment: 'B204', email: 'gabriela@property.com' },
]

// ── Avisos ──
export const seedAvisos: Aviso[] = [
  { id: 'av-1', title: 'Mantenimiento de elevadores', attachment: 'mantenimiento.pdf', date: '2025-04-15' },
  { id: 'av-2', title: 'Cambio de administración', attachment: 'cambio-admin.pdf', date: '2025-04-10' },
  { id: 'av-3', title: 'Estado de cuenta mensual - Abril', attachment: 'estado-cuenta-abril.pdf', date: '2025-04-05' },
  { id: 'av-4', title: 'Corte de Agua - Torre B', attachment: 'corte-agua.pdf', date: '2025-04-01' },
  { id: 'av-5', title: 'Nueva Normativa Basura', attachment: 'normativa-basura.pdf', date: '2025-03-28' },
]

// ── Pagos ──
export const seedPagos: Pago[] = [
  { id: 'pg-1', apartment: 'A101', resident: 'Sofía Torres', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-13' },
  { id: 'pg-2', apartment: 'A102', resident: 'Luis Díaz', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-20' },
  { id: 'pg-3', apartment: 'A103', resident: 'Luis Martínez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-11' },
  { id: 'pg-4', apartment: 'A104', resident: 'Pedro Sánchez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-02' },
  { id: 'pg-5', apartment: 'A201', resident: 'Ana López', month: 'abril de 2026', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-6', apartment: 'A202', resident: 'María Ramírez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-12' },
  { id: 'pg-7', apartment: 'A203', resident: 'Carlos Gómez', month: 'abril de 2026', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-8', apartment: 'A204', resident: 'Juan Pérez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-08' },
  { id: 'pg-9', apartment: 'B101', resident: 'Laura Ramírez', month: 'abril de 2026', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-10', apartment: 'B102', resident: 'Roberto Mendez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-15' },
  { id: 'pg-11', apartment: 'B203', resident: 'María López', month: 'abril de 2026', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-12', apartment: 'B204', resident: 'Gabriela Sánchez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-09' },
  // March
  { id: 'pg-13', apartment: 'A101', resident: 'Sofía Torres', month: 'marzo de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-03-10' },
  { id: 'pg-14', apartment: 'A201', resident: 'Ana López', month: 'marzo de 2026', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-15', apartment: 'B101', resident: 'Laura Ramírez', month: 'marzo de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-03-15' },
]

// ── Paquetería ──
export const seedPaquetes: Paquete[] = [
  { id: 'pq-1', recipient: 'Luis Martínez', apartment: 'A101', receivedDate: '2026-04-11', status: 'Entregado', location: 'N/A' },
  { id: 'pq-2', recipient: 'Carlos Díaz', apartment: 'A102', receivedDate: '2026-04-11', status: 'Entregado', location: 'N/A' },
  { id: 'pq-3', recipient: 'Pedro Pérez', apartment: 'A103', receivedDate: '2026-04-11', status: 'Entregado', location: 'N/A' },
  { id: 'pq-4', recipient: 'Gabriela Sánchez', apartment: 'A104', receivedDate: '2026-04-11', status: 'Entregado', location: 'N/A' },
  { id: 'pq-5', recipient: 'Laura Ramírez', apartment: 'A201', receivedDate: '2026-04-11', status: 'Entregado', location: 'N/A' },
  { id: 'pq-6', recipient: 'Ana López', apartment: 'A201', receivedDate: '2026-04-12', status: 'Pendiente', location: 'Caseta' },
  { id: 'pq-7', recipient: 'Roberto Mendez', apartment: 'B102', receivedDate: '2026-04-12', status: 'Pendiente', location: 'Caseta' },
  { id: 'pq-8', recipient: 'Juan Antonio', apartment: 'A201', receivedDate: '2026-04-13', status: 'Pendiente', location: 'Lobby' },
]

// ── Reservaciones (Asadores) ──
export const seedReservaciones: Reservacion[] = [
  { id: 'res-1', date: '2025-04-20', grill: 'Asador 1', resident: 'Juan Pérez', apartment: 'A101', status: 'Reservado' },
  { id: 'res-2', date: '2025-04-21', grill: 'Asador 1', resident: 'María López', apartment: 'B203', status: 'Reservado' },
  { id: 'res-3', date: '2025-04-22', grill: 'Asador 1', resident: 'Carlos Gómez', apartment: 'A101', status: 'Por confirmar' },
  { id: 'res-4', date: '2025-04-23', grill: 'Asador 2', resident: 'Ana López', apartment: 'A201', status: 'Reservado' },
  { id: 'res-5', date: '2025-04-25', grill: 'Asador 3', resident: 'Juan Antonio', apartment: 'A201', status: 'Reservado' },
]

// ── Votaciones ──
export const seedVotaciones: Votacion[] = [
  {
    id: 'vot-1',
    title: 'Convivio X',
    description: 'Votación para definir la fecha del próximo convivio',
    periodStart: '2025-04-20',
    periodEnd: '2025-05-20',
    status: 'Activa',
    options: [
      { label: 'Sábado 10 de mayo', votes: 18 },
      { label: 'Domingo 11 de mayo', votes: 7 },
      { label: 'Sábado 17 de mayo', votes: 25 },
    ],
    voters: [],
  },
  {
    id: 'vot-2',
    title: 'Pintura de áreas comunes',
    description: 'Selección de color para pintar las áreas comunes del condominio',
    periodStart: '2025-04-15',
    periodEnd: '2025-05-15',
    status: 'Activa',
    options: [
      { label: 'Azul claro', votes: 12 },
      { label: 'Beige', votes: 8 },
      { label: 'Blanco', votes: 15 },
    ],
    voters: [],
  },
]
