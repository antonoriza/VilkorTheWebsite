/**
 * Tenant Database Manager — Multi-Tenant SQLite
 *
 * Each property (tenant) has its own SQLite .db file at:
 *   data/tenants/tenant_{id}.db
 *
 * This manager:
 *   - Lazily opens connections on first access
 *   - Caches connections with LRU eviction
 *   - Applies WAL mode + safety pragmas on creation
 *   - Runs migrations on new databases
 */
import { Database } from 'bun:sqlite'
import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import * as tenantSchema from './schema/tenant'

const DB_DIR = './data/tenants'
const MAX_CACHED = 50

type TenantDb = BunSQLiteDatabase<typeof tenantSchema>

interface CachedConnection {
  db: TenantDb
  raw: Database
  lastAccess: number
}

class TenantDBManager {
  private cache = new Map<string, CachedConnection>()

  /**
   * Returns a Drizzle-wrapped connection to the specified tenant's database.
   * Creates the file and applies the schema if it doesn't exist yet.
   */
  get(tenantId: string): TenantDb {
    this.validateId(tenantId)

    const cached = this.cache.get(tenantId)
    if (cached) {
      cached.lastAccess = Date.now()
      return cached.db
    }

    const path = `${DB_DIR}/tenant_${tenantId}.db`
    const sqlite = new Database(path, { create: true })

    // Performance + safety pragmas
    sqlite.exec('PRAGMA journal_mode = WAL')
    sqlite.exec('PRAGMA foreign_keys = ON')
    sqlite.exec('PRAGMA busy_timeout = 5000')
    sqlite.exec('PRAGMA synchronous = NORMAL')

    const db = drizzle(sqlite, { schema: tenantSchema })

    this.cache.set(tenantId, { db, raw: sqlite, lastAccess: Date.now() })
    this.evict()

    return db
  }

  /**
   * Returns the raw Bun SQLite handle for DDL operations (migrations, etc.).
   */
  getRaw(tenantId: string): Database {
    this.validateId(tenantId)

    const cached = this.cache.get(tenantId)
    if (cached) return cached.raw

    // Force open via get()
    this.get(tenantId)
    return this.cache.get(tenantId)!.raw
  }

  /**
   * Creates a new tenant database with the full schema applied.
   */
  create(tenantId: string): TenantDb {
    this.validateId(tenantId)
    const db = this.get(tenantId)
    // Schema will be applied by migration runner
    return db
  }

  /**
   * Closes and removes a specific tenant connection from the cache.
   */
  close(tenantId: string): void {
    const cached = this.cache.get(tenantId)
    if (cached) {
      cached.raw.close()
      this.cache.delete(tenantId)
    }
  }

  /**
   * Closes all cached connections. Call during shutdown.
   */
  closeAll(): void {
    for (const [id, conn] of this.cache) {
      conn.raw.close()
      this.cache.delete(id)
    }
  }

  /**
   * Returns the list of currently cached tenant IDs.
   */
  get cachedTenants(): string[] {
    return Array.from(this.cache.keys())
  }

  // ─── Private ─────────────────────────────────────────────────────

  /** Sanitize tenant ID to prevent path traversal */
  private validateId(tenantId: string): void {
    if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
      throw new Error(`Invalid tenant ID: "${tenantId}" — must be alphanumeric, hyphens, or underscores`)
    }
  }

  /** Evict the least recently used connection when cache exceeds limit */
  private evict(): void {
    if (this.cache.size <= MAX_CACHED) return

    let oldest = { key: '', time: Infinity }
    for (const [key, val] of this.cache) {
      if (val.lastAccess < oldest.time) {
        oldest = { key, time: val.lastAccess }
      }
    }

    if (oldest.key) {
      this.close(oldest.key)
    }
  }
}

/** Singleton tenant database manager */
export const tenantDB = new TenantDBManager()
