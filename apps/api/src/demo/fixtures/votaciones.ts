/**
 * Demo Fixture — Votaciones
 *
 * 2 community votes: one active with ongoing participation,
 * one closed with final results to demonstrate the full lifecycle.
 */

export interface DemoVotacionOption {
  label: string
  votes: number
}

export interface DemoVoter {
  name: string
  apartment: string
  optionLabel: string
  votedAt: string
}

export interface DemoVotacion {
  title: string
  description: string
  status: 'Activa' | 'Cerrada'
  options: DemoVotacionOption[]
  /** Resident indices who voted and which option they chose (index into options) */
  voterResidents: { residentIndex: number; optionIndex: number }[]
  /** Days offset for period start (negative = future, positive = past) */
  periodStartDaysAgo: number
  periodEndDaysFromNow: number
}

export const votacionData: DemoVotacion[] = [
  {
    title: '¿Debemos renovar el salón de eventos?',
    description:
      'La administración propone renovar el salón de eventos con nueva iluminación, sistema de audio y mobiliario. El costo estimado es de $180,000 MXN financiado con el fondo de reserva.',
    status: 'Activa',
    options: [
      { label: 'Sí, aprobar renovación', votes: 42 },
      { label: 'No, diferir para el próximo ejercicio', votes: 18 },
      { label: 'Solicitar cotizaciones adicionales primero', votes: 11 },
    ],
    voterResidents: [
      { residentIndex: 0, optionIndex: 0 },
      { residentIndex: 1, optionIndex: 1 },
      { residentIndex: 3, optionIndex: 0 },
      { residentIndex: 5, optionIndex: 2 },
      { residentIndex: 9, optionIndex: 0 },
    ],
    periodStartDaysAgo: 7,
    periodEndDaysFromNow: 23,
  },
  {
    title: 'Horario de uso de amenidades en fines de semana',
    description:
      'Se somete a votación el cambio de horario de amenidades (alberca, asador, canchas) de 08:00–22:00 a 07:00–23:00 los sábados y domingos.',
    status: 'Cerrada',
    options: [
      { label: 'Mantener horario actual (08:00–22:00)', votes: 29 },
      { label: 'Ampliar a 07:00–23:00', votes: 67 },
    ],
    voterResidents: [
      { residentIndex: 2, optionIndex: 1 },
      { residentIndex: 4, optionIndex: 0 },
      { residentIndex: 6, optionIndex: 1 },
      { residentIndex: 8, optionIndex: 1 },
      { residentIndex: 10, optionIndex: 0 },
    ],
    periodStartDaysAgo: 60,
    periodEndDaysFromNow: -30, // ended 30 days ago
  },
]
