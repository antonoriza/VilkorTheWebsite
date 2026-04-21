/**
 * Tickets API Routes
 *
 * Service request lifecycle management with activity logging.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { tickets, counters } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { staffOrAbove } from '../middleware/rbac'
import { nanoid } from '../db/utils'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

const createTicketSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['Plomería', 'Electricidad', 'Áreas Comunes', 'Seguridad', 'Limpieza', 'Otro']),
  priority: z.enum(['Alta', 'Media', 'Baja']),
  createdBy: z.string().min(1),
  apartment: z.string().min(1),
  location: z.string().optional(),
})

const updateTicketSchema = z.object({
  status: z.enum(['Nuevo', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado']).optional(),
  priority: z.enum(['Alta', 'Media', 'Baja']).optional(),
  category: z.enum(['Plomería', 'Electricidad', 'Áreas Comunes', 'Seguridad', 'Limpieza', 'Otro']).optional(),
})

const addActivitySchema = z.object({
  author: z.string().min(1),
  visibility: z.enum(['internal', 'public']),
  message: z.string().min(1),
})

// GET /api/tickets
app.get('/', async (c) => {
  const db = c.get('db') as any
  const results = await db.select().from(tickets).orderBy(desc(tickets.createdAt))
  return c.json(results)
})

// GET /api/tickets/:id
app.get('/:id', async (c) => {
  const db = c.get('db') as any
  const [result] = await db.select().from(tickets).where(eq(tickets.id, c.req.param('id')))
  if (!result) return c.json({ error: 'Not Found' }, 404)
  return c.json(result)
})

// POST /api/tickets — any authenticated user can create
app.post('/', validate('json', createTicketSchema), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as z.infer<typeof createTicketSchema>
  const now = new Date().toISOString()
  const id = nanoid()

  // Auto-increment ticket number using counters table
  await db.update(counters).set({ value: db.$count(tickets) }).where(eq(counters.key, 'ticket_number'))
  const [counter] = await db.select().from(counters).where(eq(counters.key, 'ticket_number'))
  const nextNumber = (counter?.value ?? 0) + 1
  await db.update(counters).set({ value: nextNumber }).where(eq(counters.key, 'ticket_number'))

  await db.insert(tickets).values({
    id,
    number: nextNumber,
    ...body,
    status: 'Nuevo',
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    activities: [],
  })

  const [created] = await db.select().from(tickets).where(eq(tickets.id, id))
  return c.json(created, 201)
})

// PATCH /api/tickets/:id — staff+ can update status
app.patch('/:id', staffOrAbove, validate('json', updateTicketSchema), async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const body = c.req.valid('json' as never) as z.infer<typeof updateTicketSchema>
  const now = new Date().toISOString()

  const updates: Record<string, unknown> = { ...body, updatedAt: now }
  if (body.status === 'Resuelto' || body.status === 'Cerrado') {
    updates.resolvedAt = now
  }

  await db.update(tickets).set(updates).where(eq(tickets.id, id))
  const [updated] = await db.select().from(tickets).where(eq(tickets.id, id))
  if (!updated) return c.json({ error: 'Not Found' }, 404)
  return c.json(updated)
})

// POST /api/tickets/:id/activities — add activity note
app.post('/:id/activities', validate('json', addActivitySchema), async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const body = c.req.valid('json' as never) as z.infer<typeof addActivitySchema>

  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id))
  if (!ticket) return c.json({ error: 'Not Found' }, 404)

  const currentActivities = (ticket.activities as any[]) || []
  const newActivity = {
    id: nanoid(),
    ...body,
    createdAt: new Date().toISOString(),
  }

  await db.update(tickets).set({
    activities: [...currentActivities, newActivity],
    updatedAt: new Date().toISOString(),
  }).where(eq(tickets.id, id))

  return c.json(newActivity, 201)
})

export default app
