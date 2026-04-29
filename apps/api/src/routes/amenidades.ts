/**
 * Amenidades + Reservaciones API Routes
 *
 * Amenities CRUD includes scheduling, financial, and reglamento config.
 * Reservaciones support status lifecycle (Reservado / Por confirmar / Cancelado).
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { amenities, reservaciones } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { adminOnly } from '../middleware/rbac'
import { nanoid } from '../db/utils'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

// ─── Amenities CRUD ──────────────────────────────────────────────────

/** List all amenities */
app.get('/', async (c) => {
  const db = c.get('db') as any
  return c.json(await db.select().from(amenities))
})

/** Create a new amenity (admin only) */
const createAmenitySchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  openTime: z.string().default('10:00'),
  closeTime: z.string().default('22:00'),
  slotDurationMinutes: z.number().int().min(30).default(240),
  cleaningBufferMinutes: z.number().int().min(0).default(0),
  maxAdvanceDays: z.number().int().min(1).default(30),
  depositAmount: z.number().min(0).default(500),
  reglamentoType: z.enum(['none', 'text', 'pdf']).default('none'),
  reglamentoText: z.string().default(''),
  reglamentoPdfUrl: z.string().default(''),
})

app.post('/', adminOnly, validate('json', createAmenitySchema), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as z.infer<typeof createAmenitySchema>
  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(amenities).values({ id, ...body, createdAt: now, updatedAt: now })
  const [created] = await db.select().from(amenities).where(eq(amenities.id, id))
  return c.json(created, 201)
})

/** Update an amenity's configuration (admin only) */
const updateAmenitySchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  slotDurationMinutes: z.number().int().min(30).optional(),
  cleaningBufferMinutes: z.number().int().min(0).optional(),
  maxAdvanceDays: z.number().int().min(1).optional(),
  depositAmount: z.number().min(0).optional(),
  reglamentoType: z.enum(['none', 'text', 'pdf']).optional(),
  reglamentoText: z.string().optional(),
  reglamentoPdfUrl: z.string().optional(),
})

app.patch('/:id', adminOnly, validate('json', updateAmenitySchema), async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const body = c.req.valid('json' as never) as z.infer<typeof updateAmenitySchema>
  await db.update(amenities).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(amenities.id, id))
  const [updated] = await db.select().from(amenities).where(eq(amenities.id, id))
  if (!updated) return c.json({ error: 'Not Found' }, 404)
  return c.json(updated)
})

/** Delete an amenity (admin only) */
app.delete('/:id', adminOnly, async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  await db.delete(amenities).where(eq(amenities.id, id))
  return c.json({ ok: true })
})

// ─── Reservaciones ───────────────────────────────────────────────────

/** List all reservations */
app.get('/reservaciones', async (c) => {
  const db = c.get('db') as any
  return c.json(await db.select().from(reservaciones).orderBy(desc(reservaciones.date)))
})

/** Create a new reservation */
app.post('/reservaciones', validate('json', z.object({
  date: z.string().min(1), grill: z.string().min(1),
  resident: z.string().min(1), apartment: z.string().min(1),
  status: z.enum(['Reservado', 'Por confirmar']).default('Reservado'),
})), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as { date: string; grill: string; resident: string; apartment: string; status: string }
  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(reservaciones).values({ id, ...body, createdAt: now, updatedAt: now })
  const [created] = await db.select().from(reservaciones).where(eq(reservaciones.id, id))
  return c.json(created, 201)
})

/** Update a reservation's status */
app.patch('/reservaciones/:id', async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const { status } = await c.req.json()
  await db.update(reservaciones).set({ status, updatedAt: new Date().toISOString() }).where(eq(reservaciones.id, id))
  const [updated] = await db.select().from(reservaciones).where(eq(reservaciones.id, id))
  if (!updated) return c.json({ error: 'Not Found' }, 404)
  return c.json(updated)
})

/** Delete a reservation */
app.delete('/reservaciones/:id', async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  await db.delete(reservaciones).where(eq(reservaciones.id, id))
  return c.json({ ok: true })
})

export default app
