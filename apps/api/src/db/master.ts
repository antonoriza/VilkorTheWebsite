/**
 * Master Database Connection
 *
 * Connects to master.db which holds:
 *   - Better Auth tables (user, session, account, verification)
 *   - Tenant registry (tenants, user_tenants)
 *
 * This is the only database that is always open.
 */
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema/master'

const DB_PATH = './data/master.db'

const sqlite = new Database(DB_PATH, { create: true })

// Performance + safety pragmas
sqlite.exec('PRAGMA journal_mode = WAL')
sqlite.exec('PRAGMA foreign_keys = ON')
sqlite.exec('PRAGMA busy_timeout = 5000')
sqlite.exec('PRAGMA synchronous = NORMAL')

export const masterDb = drizzle(sqlite, { schema })
export const rawMasterDb = sqlite
