/**
 * Pagos (Payments) API Routes
 *
 * Payment ledger CRUD with status management.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { pagos } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { adminOnly } from '../middleware/rbac'
import { nanoid } from '../db/utils'

const app = new Hono()

// ─── Schemas ─────────────────────────────────────────────────────────

const createPagoSchema = z.object({
  apartment: z.string().min(1),
  resident: z.string().min(1),
  month: z.string().min(1),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  concepto: z.string().min(1),
  amount: z.number().positive(),
  status: z.enum(['Pagado', 'Pendiente', 'Por validar', 'Vencido']),
  paymentDate: z.string().nullable().optional(),
  adeudoId: z.string().optional(),
  receiptData: z.string().optional(),
  receiptType: z.enum(['image', 'pdf']).optional(),
  receiptName: z.string().optional(),
  notes: z.string().optional(),
})

const updatePagoSchema = createPagoSchema.partial()

// ─── Routes ──────────────────────────────────────────────────────────

// GET /api/pagos
app.get('/', async (c) => {
  const db = c.get('db') as any
  const monthKey = c.req.query('monthKey')

  let query = db.select().from(pagos)
  if (monthKey) {
    query = query.where(eq(pagos.monthKey, monthKey))
  }

  const results = await query.orderBy(desc(pagos.monthKey))
  return c.json(results)
})

// GET /api/pagos/:id
app.get('/:id', async (c) => {
  const db = c.get('db') as any
  const [result] = await db.select().from(pagos).where(eq(pagos.id, c.req.param('id')))
  if (!result) return c.json({ error: 'Not Found' }, 404)
  return c.json(result)
})

// POST /api/pagos
app.post('/', adminOnly, validate('json', createPagoSchema), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as z.infer<typeof createPagoSchema>
  const id = nanoid()
  await db.insert(pagos).values({ id, ...body })
  const [created] = await db.select().from(pagos).where(eq(pagos.id, id))
  return c.json(created, 201)
})

// PATCH /api/pagos/:id
app.patch('/:id', adminOnly, validate('json', updatePagoSchema), async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const body = c.req.valid('json' as never) as z.infer<typeof updatePagoSchema>
  await db.update(pagos).set(body).where(eq(pagos.id, id))
  const [updated] = await db.select().from(pagos).where(eq(pagos.id, id))
  if (!updated) return c.json({ error: 'Not Found' }, 404)
  return c.json(updated)
})

// DELETE /api/pagos/:id
app.delete('/:id', adminOnly, async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const [existing] = await db.select().from(pagos).where(eq(pagos.id, c.req.param('id')))
  if (!existing) return c.json({ error: 'Not Found' }, 404)
  await db.delete(pagos).where(eq(pagos.id, id))
  return c.json({ deleted: true })
})

export default app
