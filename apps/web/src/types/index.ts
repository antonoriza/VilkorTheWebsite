/**
 * CantonAlfa — Barrel re-export for all domain types.
 *
 * Consumers can import from '../../types' as before.
 * For targeted imports, use the domain files directly:
 *   import type { Pago } from '../../types/financial'
 *   import type { Ticket } from '../../types/tickets'
 */

export * from './communication'
export * from './financial'
export * from './amenities'
export * from './governance'
export * from './residents'
export * from './tickets'
export * from './config'
export * from './permissions'
