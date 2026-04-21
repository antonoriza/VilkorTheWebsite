/**
 * Avisos (Announcements) API Routes
 *
 * Refactored: tracking (view/confirm) is now stored in a normalized
 * aviso_tracking table instead of a JSON column.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { avisos, avisoTracking } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { adminOnly } from '../middleware/rbac'
import { nanoid } from '../db/utils'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

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

/** Enrich an aviso with its tracking records from the normalized table */
async function enrichAviso(db: any, aviso: any) {
  const tracking = await db.select().from(avisoTracking)
    .where(eq(avisoTracking.avisoId, aviso.id))
  return { ...aviso, tracking }
}

app.get('/', async (c) => {
  const db = c.get('db') as any
  const results = await db.select().from(avisos).orderBy(desc(avisos.date))
  const enriched = await Promise.all(results.map((a: any) => enrichAviso(db, a)))
  return c.json(enriched)
})

app.get('/:id', async (c) => {
  const db = c.get('db') as any
  const [result] = await db.select().from(avisos).where(eq(avisos.id, c.req.param('id')))
  if (!result) return c.json({ error: 'Not Found' }, 404)
  return c.json(await enrichAviso(db, result))
})

app.post('/', adminOnly, validate('json', createAvisoSchema), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as z.infer<typeof createAvisoSchema>
  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(avisos).values({ id, ...body, createdAt: now, updatedAt: now })
  const [created] = await db.select().from(avisos).where(eq(avisos.id, id))
  return c.json({ ...created, tracking: [] }, 201)
})

app.patch('/:id', adminOnly, validate('json', updateAvisoSchema), async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const body = c.req.valid('json' as never) as z.infer<typeof updateAvisoSchema>
  await db.update(avisos).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(avisos.id, id))
  const [updated] = await db.select().from(avisos).where(eq(avisos.id, id))
  if (!updated) return c.json({ error: 'Not Found' }, 404)
  return c.json(await enrichAviso(db, updated))
})

app.delete('/:id', adminOnly, async (c) => {
  const db = c.get('db') as any
  // Tracking records cascade-deleted via FK ON DELETE CASCADE
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
  const avisoId = c.req.param('id')
  const body = c.req.valid('json' as never) as { type: string; apartment: string; resident: string }

  const [aviso] = await db.select().from(avisos).where(eq(avisos.id, avisoId))
  if (!aviso) return c.json({ error: 'Not Found' }, 404)

  await db.insert(avisoTracking).values({
    id: nanoid(),
    avisoId,
    type: body.type,
    apartment: body.apartment,
    resident: body.resident,
    createdAt: new Date().toISOString(),
  })

  return c.json({ tracked: true })
})

export default app
