/**
 * Avisos (Announcements) API Routes
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { avisos } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { adminOnly } from '../middleware/rbac'
import { nanoid } from '../db/utils'

const app = new Hono()

const createAvisoSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['general', 'asamblea']),
  description: z.string().optional(),
  attachment: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  attachmentData: z.string().optional(),
  attachmentType: z.enum(['image', 'pdf']).optional(),
  pinned: z.boolean().optional(),
})

const updateAvisoSchema = createAvisoSchema.partial()

app.get('/', async (c) => {
  const db = c.get('db') as any
  const results = await db.select().from(avisos).orderBy(desc(avisos.date))
  return c.json(results)
})

app.get('/:id', async (c) => {
  const db = c.get('db') as any
  const [result] = await db.select().from(avisos).where(eq(avisos.id, c.req.param('id')))
  if (!result) return c.json({ error: 'Not Found' }, 404)
  return c.json(result)
})

app.post('/', adminOnly, validate('json', createAvisoSchema), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as z.infer<typeof createAvisoSchema>
  const id = nanoid()
  await db.insert(avisos).values({ id, ...body, tracking: [] })
  const [created] = await db.select().from(avisos).where(eq(avisos.id, id))
  return c.json(created, 201)
})

app.patch('/:id', adminOnly, validate('json', updateAvisoSchema), async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const body = c.req.valid('json' as never) as z.infer<typeof updateAvisoSchema>
  await db.update(avisos).set(body).where(eq(avisos.id, id))
  const [updated] = await db.select().from(avisos).where(eq(avisos.id, id))
  if (!updated) return c.json({ error: 'Not Found' }, 404)
  return c.json(updated)
})

app.delete('/:id', adminOnly, async (c) => {
  const db = c.get('db') as any
  await db.delete(avisos).where(eq(avisos.id, c.req.param('id')))
  return c.json({ deleted: true })
})

// POST /api/avisos/:id/track — record view/confirm
app.post('/:id/track', validate('json', z.object({
  type: z.enum(['view', 'confirm']),
  apartment: z.string().min(1),
  resident: z.string().min(1),
})), async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const body = c.req.valid('json' as never) as { type: string; apartment: string; resident: string }

  const [aviso] = await db.select().from(avisos).where(eq(avisos.id, id))
  if (!aviso) return c.json({ error: 'Not Found' }, 404)

  const tracking = (aviso.tracking as any[]) || []
  tracking.push({ ...body, timestamp: new Date().toISOString() })

  await db.update(avisos).set({ tracking }).where(eq(avisos.id, id))
  return c.json({ tracked: true })
})

export default app
