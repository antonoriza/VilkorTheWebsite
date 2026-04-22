/**
 * Demo Fixture — Auth Accounts
 *
 * The 4 demo resident accounts that get created in Better Auth
 * so a demo viewer can log in as a resident.
 *
 * Indices reference the array returned by generateResidents():
 *   0  → B0101 (Tower DANUBIO, floor 1, unit 1)
 *   1  → B0102
 *   58 → A0101 (Tower RIN, floor 1, unit 1)
 *   59 → A0102
 */

export const DEMO_ACCOUNT_INDICES = [0, 1, 58, 59] as const
export const DEMO_ACCOUNT_PASSWORD = 'demo123'
export const DEMO_ACCOUNT_ROLE = 'residente' as const
