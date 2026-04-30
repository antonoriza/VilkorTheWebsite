/**
 * Demo Fixture — Paquetes
 *
 * 8 packages with realistic statuses and storage locations.
 * Resident indices reference the array returned by generateResidents().
 */

export interface DemoPaquete {
  residentIndex: number
  status: 'Pendiente' | 'Entregado'
  location: string
  /** Days ago the package was received */
  daysAgo: number
}

export const paqueteData: DemoPaquete[] = [
  { residentIndex: 2,  status: 'Pendiente',  location: 'Recepción — Casillero A1', daysAgo: 0 },
  { residentIndex: 7,  status: 'Pendiente',  location: 'Recepción — Casillero A2', daysAgo: 1 },
  { residentIndex: 12, status: 'Pendiente',  location: 'Cuarto de Paquetes',       daysAgo: 2 },
  { residentIndex: 20, status: 'Pendiente',  location: 'Recepción — Casillero B1', daysAgo: 2 },
  { residentIndex: 33, status: 'Pendiente',  location: 'Cuarto de Paquetes',       daysAgo: 3 },
  { residentIndex: 45, status: 'Pendiente',  location: 'Recepción — Casillero B2', daysAgo: 4 },
  { residentIndex: 1,  status: 'Entregado',  location: 'N/A',                      daysAgo: 5 },
  { residentIndex: 8,  status: 'Entregado',  location: 'N/A',                      daysAgo: 6 },
  { residentIndex: 50, status: 'Pendiente',  location: 'Casillero A3',             daysAgo: 0 },
  { residentIndex: 60, status: 'Pendiente',  location: 'Casillero A4',             daysAgo: 1 },
  { residentIndex: 70, status: 'Pendiente',  location: 'Recepción',               daysAgo: 2 },
]
