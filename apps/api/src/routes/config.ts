/**
 * Building Config API Routes
 */
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { buildingConfig, staff } from '../db/schema/tenant'
import { adminOnly } from '../middleware/rbac'

const app = new Hono()

// GET /api/config — returns the building config document
app.get('/', async (c) => {
  const db = c.get('db') as any
  const [row] = await db.select().from(buildingConfig).where(eq(buildingConfig.id, 1))
  return c.json(row?.data ?? {})
})

// PUT /api/config — replace the entire building config
app.put('/', adminOnly, async (c) => {
  const db = c.get('db') as any
  const data = await c.req.json()
  const [existing] = await db.select().from(buildingConfig).where(eq(buildingConfig.id, 1))
  if (existing) {
    await db.update(buildingConfig).set({ data }).where(eq(buildingConfig.id, 1))
  } else {
    await db.insert(buildingConfig).values({ id: 1, data })
  }
  return c.json(data)
})

// PATCH /api/config — merge partial update into building config
app.patch('/', adminOnly, async (c) => {
  const db = c.get('db') as any
  const partial = await c.req.json()
  const [existing] = await db.select().from(buildingConfig).where(eq(buildingConfig.id, 1))
  const merged = { ...(existing?.data as object ?? {}), ...partial }
  if (existing) {
    await db.update(buildingConfig).set({ data: merged }).where(eq(buildingConfig.id, 1))
  } else {
    await db.insert(buildingConfig).values({ id: 1, data: merged })
  }
  return c.json(merged)
})

// GET /api/config/staff — list staff (part of config module)
app.get('/staff', async (c) => {
  const db = c.get('db') as any
  return c.json(await db.select().from(staff))
})

export default app
