/**
 * Demo Fixture — Auth Accounts
 *
 * The demo resident accounts created in Better Auth so a demo
 * viewer can log in as a resident.
 *
 * Identified by apartment code (stable) rather than array index
 * (fragile — would break if resident generation order ever changes).
 *
 * Apartments chosen: first unit in each tower on each floor.
 *   B0101 → Tower DANUBIO, floor 1, unit 1
 *   B0102 → Tower DANUBIO, floor 1, unit 2
 *   A0101 → Tower RIN,     floor 1, unit 1
 *   A0102 → Tower RIN,     floor 1, unit 2
 */

export const DEMO_ACCOUNT_APARTMENTS = ['B0101', 'B0102', 'A0101', 'A0102'] as const
export const DEMO_ACCOUNT_PASSWORD = 'demo123'
export const DEMO_ACCOUNT_ROLE = 'residente' as const

export const DEMO_ADMIN_ACCOUNTS = [
  { name: 'Admin Vilkor', email: 'admin@vilkor.com', role: 'administracion' }
]

export const DEMO_STAFF_ACCOUNTS = [
  { name: 'Ricardo Guardia', email: 'guardia@vilkor.com', role: 'operador' },
  { name: 'Valentina Limpieza', email: 'limpieza@vilkor.com', role: 'operador' }
]

