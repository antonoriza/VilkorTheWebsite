/**
 * useDemoMode — Fetches demo status from the API once.
 *
 * Returns { isDemoMode: boolean } derived from GET /api/demo/accounts.
 * Used by DemoBanner and DashboardLayout so only one network call is made
 * (React's strict mode may call twice in dev, but that's fine).
 */
import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Module-level cache so multiple consumers don't each fire a request
let cachedIsDemo: boolean | null = null
const listeners = new Set<(v: boolean) => void>()

async function fetchDemoStatus() {
  try {
    const res = await fetch(`${API_URL}/api/demo/accounts`)
    const data = await res.json()
    const value = (data.accounts?.length ?? 0) > 0
    cachedIsDemo = value
    listeners.forEach(fn => fn(value))
  } catch {
    cachedIsDemo = false
    listeners.forEach(fn => fn(false))
  }
}

export function useDemoMode(): boolean {
  const [isDemo, setIsDemo] = useState<boolean>(cachedIsDemo ?? false)

  useEffect(() => {
    listeners.add(setIsDemo)

    // Only fetch if not already cached
    if (cachedIsDemo === null) {
      fetchDemoStatus()
    } else {
      setIsDemo(cachedIsDemo)
    }

    return () => { listeners.delete(setIsDemo) }
  }, [])

  return isDemo
}
