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
  amenityName?: string // New field
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
    name: 'Mesa de Ping Pong (Profesional)',
    category: 'Deportes',
    owner: 'Administración',
    currentUser: 'Sin asignar',
    amenityName: 'Ludoteca', // Will be mapped to amenityId in seed.ts
  },
  {
    name: 'Set de Mancuernas 5-25kg',
    category: 'Fitness',
    owner: 'Administración',
    currentUser: 'Sin asignar',
    amenityName: 'Gimnasio',
  },
  {
    name: 'Aspiradora Industrial Karcher',
    category: 'Limpieza',
    owner: 'Administración',
    currentUser: 'Valentina Sánchez (Limpieza)',
  },
]

