/**
 * Demo Fixture — Inventory
 *
 * Items used by staff for maintenance and cleaning.
 */

export interface DemoInventory {
  name: string
  category: string
  owner: string
  currentUser: string
  notes?: string
}

export const inventoryData: DemoInventory[] = [
  {
    name: 'Podadora de césped STIHL',
    category: 'Mantenimiento',
    owner: 'Administración',
    currentUser: 'Enrique Martínez (Jardinero)',
    notes: 'Requiere cambio de aceite cada 50h.',
  },
  {
    name: 'Radio Walkie-Talkie Motorola (G1)',
    category: 'Seguridad',
    owner: 'Administración',
    currentUser: 'Ricardo Hernández (Guardia)',
    notes: 'Cargar todas las noches en caseta.',
  },
  {
    name: 'Radio Walkie-Talkie Motorola (G2)',
    category: 'Seguridad',
    owner: 'Administración',
    currentUser: 'Sin asignar',
    notes: 'Reserva para turno nocturno.',
  },
  {
    name: 'Aspiradora Industrial Karcher',
    category: 'Limpieza',
    owner: 'Administración',
    currentUser: 'Valentina Sánchez (Limpieza)',
  },
  {
    name: 'Kit de Herramientas Básico',
    category: 'Mantenimiento',
    owner: 'Administración',
    currentUser: 'Enrique Martínez (Jardinero)',
  },
]
