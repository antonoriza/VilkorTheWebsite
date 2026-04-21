/**
 * Database — SQLite (sql.js/WASM) persistence layer for CantonAlfa.
 *
 * Architecture:
 *   1. On first load: initializes sql.js WASM, loads DB from IndexedDB
 *      or bootstraps from seed data if no prior state exists.
 *   2. On every mutation: serializes entire DB to IndexedDB for persistence.
 *   3. Provides typed query/exec wrappers for the domain layer.
 *
 * The DB stores the full application state as a single JSON blob in a
 * `state` table. This is the "Phase 1" approach — a drop-in replacement
 * for localStorage that gives us a real DB handle for future per-table
 * normalization without touching any UI code.
 *
 * Future Phase 2 will normalize into per-entity tables with proper
 * SQL queries, but this phase ensures zero UI breakage.
 */
import initSqlJs, { type Database } from 'sql.js'

// ─── Constants ───────────────────────────────────────────────────────

const IDB_DB_NAME = 'cantonalfa_db'
const IDB_STORE_NAME = 'sqlitedb'
const IDB_KEY = 'main'

// ─── IndexedDB Helpers ───────────────────────────────────────────────

/** Opens (or creates) the IndexedDB database used for persistence. */
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Loads the raw SQLite binary from IndexedDB, or returns null. */
async function loadFromIDB(): Promise<Uint8Array | null> {
  const idb = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE_NAME, 'readonly')
    const store = tx.objectStore(IDB_STORE_NAME)
    const req = store.get(IDB_KEY)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

/** Saves the raw SQLite binary to IndexedDB. */
async function saveToIDB(data: Uint8Array): Promise<void> {
  const idb = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE_NAME, 'readwrite')
    const store = tx.objectStore(IDB_STORE_NAME)
    const req = store.put(data, IDB_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** Clears the saved database from IndexedDB. */
async function clearIDB(): Promise<void> {
  const idb = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE_NAME, 'readwrite')
    const store = tx.objectStore(IDB_STORE_NAME)
    const req = store.delete(IDB_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// ─── Database Singleton ──────────────────────────────────────────────

let dbInstance: Database | null = null
let sqlPromise: ReturnType<typeof initSqlJs> | null = null

/**
 * Initializes the sql.js WASM engine and loads or creates the database.
 * Safe to call multiple times — returns the cached instance after first init.
 */
export async function initDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance

  // Initialize WASM (cached after first call)
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (file: string) => `/${file}`,
    })
  }
  const SQL = await sqlPromise

  // Try loading from IndexedDB first
  const savedData = await loadFromIDB()
  if (savedData) {
    dbInstance = new SQL.Database(savedData)
    console.log('[DB] Loaded from IndexedDB')
  } else {
    // Fresh database — create the state table
    dbInstance = new SQL.Database()
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `)
    console.log('[DB] Created fresh database')
  }

  return dbInstance
}

/**
 * Returns the current database instance. Throws if not yet initialized.
 */
export function getDatabase(): Database {
  if (!dbInstance) throw new Error('[DB] Not initialized — call initDatabase() first')
  return dbInstance
}

// ─── State Persistence ───────────────────────────────────────────────

/**
 * Saves the full application state as a JSON blob in the SQLite database,
 * then exports the entire DB binary to IndexedDB.
 */
export async function saveState(state: unknown): Promise<void> {
  const db = getDatabase()
  const json = JSON.stringify(state)
  
  db.run(
    `INSERT OR REPLACE INTO app_state (id, data, updated_at) VALUES (1, ?, datetime('now'))`,
    [json]
  )

  // Persist to IndexedDB
  const data = db.export()
  const buffer = new Uint8Array(data)
  await saveToIDB(buffer)
}

/**
 * Loads the application state from the SQLite database.
 * Returns null if no state has been saved yet.
 */
export function loadState<T>(): T | null {
  const db = getDatabase()
  const result = db.exec('SELECT data FROM app_state WHERE id = 1')
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null
  }
  
  const json = result[0].values[0][0] as string
  return JSON.parse(json) as T
}

/**
 * Resets the database — clears the state table and IndexedDB persistence.
 */
export async function resetDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.run('DELETE FROM app_state')
  }
  await clearIDB()
}

/**
 * Exports the current database for debugging or backup purposes.
 */
export function exportDatabase(): Uint8Array | null {
  if (!dbInstance) return null
  return new Uint8Array(dbInstance.export())
}
