/**
 * Demo Fixture — Staff
 *
 * 4 staff members with roles, shifts, and work days.
 */

export interface DemoStaff {
  name: string
  role: string
  shiftStart: string
  shiftEnd: string
  workDays: string[]
}

export const staffMembers: DemoStaff[] = [
  {
    name: 'Ricardo Hernández',
    role: 'Guardia de Seguridad',
    shiftStart: '07:00',
    shiftEnd: '19:00',
    workDays: ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'],
  },
  {
    name: 'Valentina Sánchez',
    role: 'Personal de Limpieza',
    shiftStart: '08:00',
    shiftEnd: '17:00',
    workDays: ['L', 'M', 'Mi', 'J', 'V', 'S'],
  },
  {
    name: 'Enrique Martínez',
    role: 'Jardinero',
    shiftStart: '06:00',
    shiftEnd: '14:00',
    workDays: ['L', 'Mi', 'V'],
  },
  {
    name: 'Samantha Guzmán',
    role: 'Administradora General',
    shiftStart: '09:00',
    shiftEnd: '18:00',
    workDays: ['L', 'M', 'Mi', 'J', 'V'],
  },
]

