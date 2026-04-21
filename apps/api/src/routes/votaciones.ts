/**
 * Votaciones (Governance Polls) API Routes
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { votaciones } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { adminOnly } from '../middleware/rbac'
import { nanoid } from '../db/utils'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

app.get('/', async (c) => {
  const db = c.get('db') as any
  return c.json(await db.select().from(votaciones))
})

app.post('/', adminOnly, validate('json', z.object({
  title: z.string().min(1), description: z.string().min(1),
  periodStart: z.string().min(1), periodEnd: z.string().min(1),
  options: z.array(z.object({ label: z.string(), votes: z.number(), color: z.string().optional(), emoji: z.string().optional() })),
})), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as any
  const id = nanoid()
  await db.insert(votaciones).values({ id, ...body, status: 'Activa', voters: [] })
  const [created] = await db.select().from(votaciones).where(eq(votaciones.id, id))
  return c.json(created, 201)
})

// POST /api/votaciones/:id/vote
app.post('/:id/vote', validate('json', z.object({
  name: z.string().min(1), apartment: z.string().min(1), optionLabel: z.string().min(1),
})), async (c) => {
  const db = c.get('db') as any
  const id = c.req.param('id')
  const body = c.req.valid('json' as never) as { name: string; apartment: string; optionLabel: string }

  const [poll] = await db.select().from(votaciones).where(eq(votaciones.id, id))
  if (!poll) return c.json({ error: 'Not Found' }, 404)
  if (poll.status !== 'Activa') return c.json({ error: 'Poll is closed' }, 400)

  const voters = (poll.voters as any[]) || []
  if (voters.some((v: any) => v.apartment === body.apartment)) {
    return c.json({ error: 'Already voted' }, 409)
  }

  voters.push({ ...body, votedAt: new Date().toISOString() })
  const options = (poll.options as any[]).map((o: any) =>
    o.label === body.optionLabel ? { ...o, votes: o.votes + 1 } : o
  )

  await db.update(votaciones).set({ options, voters }).where(eq(votaciones.id, id))
  const [updated] = await db.select().from(votaciones).where(eq(votaciones.id, id))
  return c.json(updated)
})

export default app
