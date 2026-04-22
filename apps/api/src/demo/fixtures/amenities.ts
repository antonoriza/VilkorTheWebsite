/**
 * Demo Fixture — Amenities
 *
 * 3 outdoor grill amenities available for reservation.
 */

export interface DemoAmenity {
  name: string
  icon: string
}

export const amenitiesList: DemoAmenity[] = [
  { name: 'Asador 1', icon: 'outdoor_grill' },
  { name: 'Asador 2', icon: 'outdoor_grill' },
  { name: 'Asador 3', icon: 'outdoor_grill' },
]
