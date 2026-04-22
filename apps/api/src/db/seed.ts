/**
 * Database Seeder — Phase 1: Base Setup
 *
 * Creates the minimum required state for the application to run:
 *   - Tenant registration
 *   - Tenant DB schema
 *   - Super admin user (Better Auth)
 *
 * Usage:
 *   bun run src/db/seed.ts
 *
 * Demo data (Phase 2):
 *   Loaded dynamically from src/demo/seed.ts when APP_MODE=demo.
 *   In production that module is never imported.
 */
import { nanoid } from './utils'
import { rawMasterDb } from './master'
import { tenantDB } from './tenant'
import { migrateMaster, migrateTenant } from './migrate'
import { auth } from '../auth'

const APP_MODE = process.env.APP_MODE || 'production'
const TENANT_ID = 'demo'
const NOW = new Date().toISOString()

// ─── Phase 1: Base (always runs) ──────────────────────────────────────

export async function seedBase(): Promise<void> {
  console.log('[seed] Phase 1: Base setup...')
  migrateMaster()

  // Create demo tenant (idempotent)
  const existing = rawMasterDb.query('SELECT id FROM tenants WHERE id = ?').get(TENANT_ID) as any
  if (!existing) {
    rawMasterDb.exec(`
      INSERT INTO tenants (id, name, slug, category, address, city, state, country, status, created_at, updated_at)
      VALUES ('demo', 'Lote Alemania', 'lote-alemania', 'residencial',
              'Cosmopol HU Lifestyle, Coacalco', 'Coacalco', 'Estado de México', 'México',
              'active', '${NOW}', '${NOW}');
    `)
    console.log('[seed]   ✓ Demo tenant registered')
  }

  // Apply tenant schema
  migrateTenant(TENANT_ID)

  // Create super admin (idempotent)
  const existingUser = rawMasterDb.query("SELECT id FROM user WHERE email = 'admin@property.com'").get() as any
  if (!existingUser) {
    try {
      const result = await auth.api.signUpEmail({
        body: {
          name: 'Administrador General',
          email: 'admin@property.com',
          password: 'admin123',
        },
      })
      const userId = (result as any).user?.id
      if (userId) {
        rawMasterDb.exec(`
          INSERT OR IGNORE INTO user_tenants (id, user_id, tenant_id, role, apartment, created_at)
          VALUES ('${nanoid()}', '${userId}', '${TENANT_ID}', 'super_admin', NULL, '${NOW}');
        `)
        console.log('[seed]   ✓ Super admin created (admin@property.com / admin123)')
      }
    } catch (e: any) {
      console.log('[seed]   ⚠ Admin creation skipped:', e.message || 'already exists')
    }
  } else {
    console.log('[seed]   ✓ Super admin already exists')
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

if (import.meta.main) {
  console.log(`[seed] APP_MODE = ${APP_MODE}\n`)

  await seedBase()

  if (APP_MODE === 'demo') {
    try {
      const { seedDemo } = await import('../demo/seed')
      await seedDemo(TENANT_ID)
    } catch (e: any) {
      console.warn('[seed] Demo module not available:', e.message)
    }
  } else {
    console.log('[seed] Production mode — skipping demo data')
  }

  // Print final stats
  const raw = tenantDB.getRaw(TENANT_ID)
  const stats = {
    residents:  (raw.query('SELECT COUNT(*) as c FROM residents').get()  as any).c,
    staff:      (raw.query('SELECT COUNT(*) as c FROM staff').get()      as any).c,
    pagos:      (raw.query('SELECT COUNT(*) as c FROM pagos').get()      as any).c,
    tickets:    (raw.query('SELECT COUNT(*) as c FROM tickets').get()    as any).c,
    avisos:     (raw.query('SELECT COUNT(*) as c FROM avisos').get()     as any).c,
    amenities:  (raw.query('SELECT COUNT(*) as c FROM amenities').get()  as any).c,
  }
  console.log('\n[seed] Stats:', stats)

  if (APP_MODE === 'demo') {
    console.log('\n[seed] Demo Credentials:')
    console.log('  Admin:    admin@property.com / admin123')
    console.log('  Resident: B0101@gmail.com / demo123')
    console.log('  Resident: B0102@gmail.com / demo123')
    console.log('  Resident: A0101@gmail.com / demo123')
    console.log('  Resident: A0102@gmail.com / demo123')
  }

  tenantDB.closeAll()
  process.exit(0)
}
