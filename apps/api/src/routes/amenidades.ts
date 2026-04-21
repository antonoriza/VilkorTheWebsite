/**
 * Amenidades + Reservaciones API Routes
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { amenities, reservaciones } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { adminOnly } from '../middleware/rbac'
import { nanoid } from '../db/utils'

const app = new Hono()

// Amenities CRUD
app.get('/', async (c) => {
  const db = c.get('db') as any
  return c.json(await db.select().from(amenities))
})

app.post('/', adminOnly, validate('json', z.object({ name: z.string().min(1), icon: z.string().min(1) })), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as { name: string; icon: string }
  const id = nanoid()
  await db.insert(amenities).values({ id, ...body })
  const [created] = await db.select().from(amenities).where(eq(amenities.id, id))
  return c.json(created, 201)
})

// Reservaciones
app.get('/reservaciones', async (c) => {
  const db = c.get('db') as any
  return c.json(await db.select().from(reservaciones).orderBy(desc(reservaciones.date)))
})

app.post('/reservaciones', validate('json', z.object({
  date: z.string().min(1), grill: z.string().min(1),
  resident: z.string().min(1), apartment: z.string().min(1),
})), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as { date: string; grill: string; resident: string; apartment: string }
  const id = nanoid()
  await db.insert(reservaciones).values({ id, ...body, status: 'Reservado' })
  const [created] = await db.select().from(reservaciones).where(eq(reservaciones.id, id))
  return c.json(created, 201)
})

app.patch('/reservaciones/:id', async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const { status } = await c.req.json()
  await db.update(reservaciones).set({ status }).where(eq(reservaciones.id, id))
  const [updated] = await db.select().from(reservaciones).where(eq(reservaciones.id, id))
  if (!updated) return c.json({ error: 'Not Found' }, 404)
  return c.json(updated)
})

export default app
