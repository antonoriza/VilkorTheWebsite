/**
 * Utility functions for the API layer
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/**
 * Generates a compact, URL-safe unique ID.
 * Uses crypto.getRandomValues for secure randomness.
 */
export function nanoid(size = 21): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  let id = ''
  for (let i = 0; i < size; i++) {
    id += CHARS[bytes[i] % CHARS.length]
  }
  return id
}
