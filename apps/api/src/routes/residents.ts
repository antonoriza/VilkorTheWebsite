/**
 * Residents API Routes
 *
 * CRUD operations for resident directory.
 * All routes require tenant middleware.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { residents } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { adminOnly } from '../middleware/rbac'
import { nanoid } from '../db/utils'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

// ─── Schemas ─────────────────────────────────────────────────────────

const createResidentSchema = z.object({
  name: z.string().min(1),
  apartment: z.string().min(1),
  tower: z.string().min(1),
  email: z.string().email(),
})

const updateResidentSchema = createResidentSchema.partial()

// ─── Routes ──────────────────────────────────────────────────────────

// GET /api/residents
app.get('/', async (c) => {
  const db = c.get('db') as any
  const results = await db.select().from(residents)
  return c.json(results)
})

// GET /api/residents/:id
app.get('/:id', async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const [result] = await db.select().from(residents).where(eq(residents.id, id))
  if (!result) return c.json({ error: 'Not Found' }, 404)
  return c.json(result)
})

// POST /api/residents
app.post('/', adminOnly, validate('json', createResidentSchema), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as z.infer<typeof createResidentSchema>
  const id = nanoid()
  await db.insert(residents).values({ id, ...body })
  const [created] = await db.select().from(residents).where(eq(residents.id, id))
  return c.json(created, 201)
})

// PATCH /api/residents/:id
app.patch('/:id', adminOnly, validate('json', updateResidentSchema), async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const body = c.req.valid('json' as never) as z.infer<typeof updateResidentSchema>
  await db.update(residents).set(body).where(eq(residents.id, id))
  const [updated] = await db.select().from(residents).where(eq(residents.id, id))
  if (!updated) return c.json({ error: 'Not Found' }, 404)
  return c.json(updated)
})

// DELETE /api/residents/:id
app.delete('/:id', adminOnly, async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const [existing] = await db.select().from(residents).where(eq(residents.id, id))
  if (!existing) return c.json({ error: 'Not Found' }, 404)
  await db.delete(residents).where(eq(residents.id, id))
  return c.json({ deleted: true })
})

export default app
