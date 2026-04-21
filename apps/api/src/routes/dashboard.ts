/**
 * Dashboard KPI Aggregation Routes
 *
 * Returns computed metrics from the tenant database for the admin dashboard.
 */
import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import { pagos, tickets, residents, adeudos, egresos, paquetes } from '../db/schema/tenant'

const app = new Hono()

// GET /api/dashboard — all KPIs in one call
app.get('/', async (c) => {
  const db = c.get('db') as any

  // Run all queries in parallel
  const [
    residentCount,
    pagoStats,
    ticketStats,
    pendingPackages,
    egresoTotal,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(residents),
    db.select({
      total: sql<number>`count(*)`,
      paid: sql<number>`count(*) filter (where status = 'Pagado')`,
      pending: sql<number>`count(*) filter (where status = 'Pendiente')`,
      overdue: sql<number>`count(*) filter (where status = 'Vencido')`,
      totalAmount: sql<number>`coalesce(sum(amount), 0)`,
      collectedAmount: sql<number>`coalesce(sum(case when status = 'Pagado' then amount else 0 end), 0)`,
    }).from(pagos),
    db.select({
      total: sql<number>`count(*)`,
      open: sql<number>`count(*) filter (where status not in ('Resuelto', 'Cerrado'))`,
      resolved: sql<number>`count(*) filter (where status = 'Resuelto' or status = 'Cerrado')`,
      highPriority: sql<number>`count(*) filter (where priority = 'Alta' and status not in ('Resuelto', 'Cerrado'))`,
    }).from(tickets),
    db.select({ count: sql<number>`count(*)` }).from(paquetes).where(sql`status = 'Pendiente'`),
    db.select({ total: sql<number>`coalesce(sum(amount), 0)` }).from(egresos),
  ])

  const totalAmt = pagoStats[0]?.totalAmount ?? 0
  const collectedAmt = pagoStats[0]?.collectedAmount ?? 0
  const collectionRate = totalAmt > 0 ? Math.round((collectedAmt / totalAmt) * 100) : 0

  return c.json({
    residents: residentCount[0]?.count ?? 0,
    payments: {
      total: pagoStats[0]?.total ?? 0,
      paid: pagoStats[0]?.paid ?? 0,
      pending: pagoStats[0]?.pending ?? 0,
      overdue: pagoStats[0]?.overdue ?? 0,
      totalAmount: totalAmt,
      collectedAmount: collectedAmt,
      collectionRate,
    },
    tickets: {
      total: ticketStats[0]?.total ?? 0,
      open: ticketStats[0]?.open ?? 0,
      resolved: ticketStats[0]?.resolved ?? 0,
      highPriority: ticketStats[0]?.highPriority ?? 0,
    },
    packages: { pending: pendingPackages[0]?.count ?? 0 },
    expenses: { total: egresoTotal[0]?.total ?? 0 },
  })
})

export default app
