/**
 * Votaciones (Governance Polls) API Routes
 *
 * Refactored: votes and options are now stored in normalized tables
 * (poll_options, poll_votes) instead of JSON columns. This eliminates
 * the read-modify-write race condition on concurrent votes.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { votaciones, pollOptions, pollVotes } from '../db/schema/tenant'
import { validate } from '../middleware/validate'
import { adminOnly } from '../middleware/rbac'
import { nanoid } from '../db/utils'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

// GET /api/votaciones — list polls with options and vote counts
app.get('/', async (c) => {
  const db = c.get('db') as any
  const polls = await db.select().from(votaciones)

  // Enrich each poll with its options (including vote counts) and voters
  const enriched = await Promise.all(polls.map(async (poll: any) => {
    const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, poll.id))
    const voters = await db.select().from(pollVotes).where(eq(pollVotes.pollId, poll.id))

    // Compute vote counts per option
    const optionsWithCounts = options.map((opt: any) => ({
      ...opt,
      votes: voters.filter((v: any) => v.optionId === opt.id).length,
    }))

    return { ...poll, options: optionsWithCounts, voters }
  }))

  return c.json(enriched)
})

// POST /api/votaciones — create a new poll with options
app.post('/', adminOnly, validate('json', z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  options: z.array(z.object({
    label: z.string(),
    color: z.string().optional(),
    emoji: z.string().optional(),
  })).min(2),
})), async (c) => {
  const db = c.get('db') as any
  const body = c.req.valid('json' as never) as any
  const now = new Date().toISOString()
  const pollId = nanoid()

  // Insert poll
  await db.insert(votaciones).values({
    id: pollId,
    title: body.title,
    description: body.description,
    periodStart: body.periodStart,
    periodEnd: body.periodEnd,
    status: 'Activa',
    createdAt: now,
    updatedAt: now,
  })

  // Insert options
  for (let i = 0; i < body.options.length; i++) {
    const opt = body.options[i]
    await db.insert(pollOptions).values({
      id: nanoid(),
      pollId,
      label: opt.label,
      color: opt.color ?? null,
      emoji: opt.emoji ?? null,
      sortOrder: i,
    })
  }

  // Return enriched poll
  const [poll] = await db.select().from(votaciones).where(eq(votaciones.id, pollId))
  const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, pollId))
  return c.json({ ...poll, options: options.map((o: any) => ({ ...o, votes: 0 })), voters: [] }, 201)
})

// POST /api/votaciones/:id/vote — cast a vote (race-condition-safe via UNIQUE constraint)
app.post('/:id/vote', validate('json', z.object({
  name: z.string().min(1),
  apartment: z.string().min(1),
  optionLabel: z.string().min(1),
})), async (c) => {
  const db = c.get('db') as any
  const pollId = c.req.param('id')
  const body = c.req.valid('json' as never) as { name: string; apartment: string; optionLabel: string }

  // Verify poll exists and is active
  const [poll] = await db.select().from(votaciones).where(eq(votaciones.id, pollId))
  if (!poll) return c.json({ error: 'Not Found' }, 404)
  if (poll.status !== 'Activa') return c.json({ error: 'Poll is closed' }, 400)

  // Find the option by label
  const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, pollId))
  const targetOption = options.find((o: any) => o.label === body.optionLabel)
  if (!targetOption) return c.json({ error: 'Invalid option' }, 400)

  // Insert vote — UNIQUE(poll_id, apartment) prevents duplicate votes at DB level
  try {
    await db.insert(pollVotes).values({
      id: nanoid(),
      pollId,
      optionId: targetOption.id,
      name: body.name,
      apartment: body.apartment,
      votedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    if (e.message?.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Already voted' }, 409)
    }
    throw e
  }

  // Return updated poll
  const voters = await db.select().from(pollVotes).where(eq(pollVotes.pollId, pollId))
  const optionsWithCounts = options.map((opt: any) => ({
    ...opt,
    votes: voters.filter((v: any) => v.optionId === opt.id).length,
  }))
  return c.json({ ...poll, options: optionsWithCounts, voters })
})

export default app
