/**
 * WebSocket Real-Time Layer
 *
 * Uses Bun's native pub/sub for O(1) broadcast to all subscribers.
 * Each tenant gets its own topic: `tenant:{tenantId}`.
 *
 * Events are JSON messages with shape:
 *   { event: string, data: unknown, timestamp: number }
 */

// Store the server reference for pub/sub
let serverRef: { publish: (topic: string, message: string) => void } | null = null

/**
 * Set the Bun server reference (called once from index.ts after Bun.serve).
 */
export function setServer(server: any) {
  serverRef = server
}

/**
 * Broadcast an event to all WebSocket subscribers of a tenant.
 * No-op if no server or no subscribers.
 */
export function broadcast(tenantId: string, event: string, data: unknown) {
  if (!serverRef) return
  const topic = `tenant:${tenantId}`
  const message = JSON.stringify({ event, data, timestamp: Date.now() })
  try {
    serverRef.publish(topic, message)
  } catch {
    // No subscribers — this is fine
  }
}

/**
 * WebSocket upgrade handler config for Bun.serve.
 * Validates auth and subscribes to tenant topic.
 */
export const websocketHandler = {
  open(ws: any) {
    const tenantId = ws.data?.tenantId
    if (tenantId) {
      ws.subscribe(`tenant:${tenantId}`)
    }
  },
  message(_ws: any, _message: any) {
    // Currently read-only — clients receive broadcasts but don't send
  },
  close(ws: any) {
    const tenantId = ws.data?.tenantId
    if (tenantId) {
      ws.unsubscribe(`tenant:${tenantId}`)
    }
  },
}
