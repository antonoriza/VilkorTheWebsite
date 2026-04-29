/**
 * Demo Fixture — Amenities
 *
 * 6 amenities representing the full recreational offering of the complex.
 */

export interface DemoAmenity {
  name: string
  icon: string
}

export const amenitiesList: DemoAmenity[] = [
  { name: 'Asador',             icon: 'outdoor_grill' },
  { name: 'Alberca',            icon: 'pool' },
  { name: 'Gimnasio',           icon: 'fitness_center' },
  { name: 'Ludoteca',           icon: 'toys' },
  { name: 'Cancha de Fútbol',   icon: 'sports_soccer' },
  { name: 'Cancha de Tenis',    icon: 'sports_tennis' },
]
