/**
 * Inventory API Routes
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { inventory } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { staffOrAbove } from '../middleware/rbac'
import { nanoid } from '../db/utils'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

app.get('/', async (c) => {
  const db = c.get('db') as any
  return c.json(await db.select().from(inventory))
})

app.post('/', staffOrAbove, validate('json', z.object({
  name: z.string().min(1), category: z.string().min(1),
  ownerId: z.string().min(1), owner: z.string().min(1),
  currentUserId: z.string().nullable(), currentUser: z.string().min(1),
  notes: z.string().optional(),
})), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as any
  const id = nanoid()
  await db.insert(inventory).values({ id, ...body, lastUpdated: new Date().toISOString() })
  const [created] = await db.select().from(inventory).where(eq(inventory.id, id))
  return c.json(created, 201)
})

app.patch('/:id', staffOrAbove, async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const body = await c.req.json()
  await db.update(inventory).set({ ...body, lastUpdated: new Date().toISOString() }).where(eq(inventory.id, id))
  const [updated] = await db.select().from(inventory).where(eq(inventory.id, id))
  if (!updated) return c.json({ error: 'Not Found' }, 404)
  return c.json(updated)
})

app.delete('/:id', staffOrAbove, async (c) => {
  const db = c.get('db') as any
  await db.delete(inventory).where(eq(inventory.id, c.req.param('id')))
  return c.json({ deleted: true })
})

export default app
