/**
 * Paquetes (Packages) API Routes
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { paquetes } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { staffOrAbove } from '../middleware/rbac'
import { nanoid } from '../db/utils'

const app = new Hono()

const createPaqueteSchema = z.object({
  recipient: z.string().min(1),
  apartment: z.string().min(1),
  receivedDate: z.string().min(1),
  expirationDays: z.number().optional(),
  location: z.string().min(1),
})

app.get('/', async (c) => {
  const db = c.get('db') as any
  return c.json(await db.select().from(paquetes).orderBy(desc(paquetes.receivedDate)))
})

app.post('/', staffOrAbove, validate('json', createPaqueteSchema), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as z.infer<typeof createPaqueteSchema>
  const id = nanoid()
  await db.insert(paquetes).values({ id, ...body, status: 'Pendiente', deliveredDate: null })
  const [created] = await db.select().from(paquetes).where(eq(paquetes.id, id))
  return c.json(created, 201)
})

app.patch('/:id/deliver', staffOrAbove, async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  await db.update(paquetes).set({ status: 'Entregado', deliveredDate: new Date().toISOString().split('T')[0] }).where(eq(paquetes.id, id))
  const [updated] = await db.select().from(paquetes).where(eq(paquetes.id, id))
  if (!updated) return c.json({ error: 'Not Found' }, 404)
  return c.json(updated)
})

app.delete('/:id', staffOrAbove, async (c) => {
  const db = c.get('db') as any
  await db.delete(paquetes).where(eq(paquetes.id, c.req.param('id')))
  return c.json({ deleted: true })
})

export default app
