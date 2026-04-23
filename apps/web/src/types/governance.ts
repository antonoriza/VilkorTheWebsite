/**
 * Governance types — voting and community polls.
 * Consumed by: VotacionesPage, store.
 * Does NOT contain: financial records or user management.
 */

/** A single option within a community vote */
export interface VoteOption {
  label: string
  votes: number
  color?: string
  emoji?: string
}

/** A record of a resident's vote */
export interface Voter {
  name: string
  apartment: string
  /** Which option they selected */
  optionLabel: string
  /** ISO timestamp of when they voted */
  votedAt: string
}

/** A community governance poll */
export interface Votacion {
  id: string
  title: string
  description: string
  /** ISO date — voting opens */
  periodStart: string
  /** ISO date — voting closes */
  periodEnd: string
  status: 'Activa' | 'Cerrada'
  options: VoteOption[]
  /** Audit trail: who voted and when */
  voters: Voter[]
}
