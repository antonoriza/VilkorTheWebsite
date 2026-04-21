/**
 * Egresos (Expenses) API Routes
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { egresos } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { adminOnly } from '../middleware/rbac'
import { nanoid } from '../db/utils'

const app = new Hono()

const createEgresoSchema = z.object({
  categoria: z.enum(['nomina', 'mantenimiento', 'servicios', 'equipo', 'seguros', 'administracion', 'otros']),
  concepto: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  date: z.string().min(1),
  registeredBy: z.string().min(1),
  status: z.enum(['Pendiente', 'Pagado']),
  receiptData: z.string().optional(),
  receiptType: z.enum(['image', 'pdf']).optional(),
  receiptName: z.string().optional(),
})

const updateEgresoSchema = createEgresoSchema.partial()

app.get('/', async (c) => {
  const db = c.get('db') as any
  const results = await db.select().from(egresos).orderBy(desc(egresos.date))
  return c.json(results)
})

app.get('/:id', async (c) => {
  const db = c.get('db') as any
  const [result] = await db.select().from(egresos).where(eq(egresos.id, c.req.param('id')))
  if (!result) return c.json({ error: 'Not Found' }, 404)
  return c.json(result)
})

app.post('/', adminOnly, validate('json', createEgresoSchema), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as z.infer<typeof createEgresoSchema>
  const id = nanoid()
  await db.insert(egresos).values({ id, ...body })
  const [created] = await db.select().from(egresos).where(eq(egresos.id, id))
  return c.json(created, 201)
})

app.patch('/:id', adminOnly, validate('json', updateEgresoSchema), async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const body = c.req.valid('json' as never) as z.infer<typeof updateEgresoSchema>
  await db.update(egresos).set(body).where(eq(egresos.id, id))
  const [updated] = await db.select().from(egresos).where(eq(egresos.id, id))
  if (!updated) return c.json({ error: 'Not Found' }, 404)
  return c.json(updated)
})

app.delete('/:id', adminOnly, async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  await db.delete(egresos).where(eq(egresos.id, id))
  return c.json({ deleted: true })
})

export default app
