/**
 * API Client — Typed HTTP client for the PropertyPulse backend.
 *
 * Centralizes all API calls with:
 *   - Automatic cookie-based auth (credentials: 'include')
 *   - X-Tenant-ID header injection
 *   - JSON serialization/deserialization
 *   - Structured error handling
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Tenant ID — stored in memory after login
let currentTenantId: string = 'demo'

export function setTenantId(id: string) { currentTenantId = id }
export function getTenantId() { return currentTenantId }

// ─── Core Request Function ────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`
  const headers: Record<string, string> = {
    'X-Tenant-ID': currentTenantId,
    ...(options.headers as Record<string, string> || {}),
  }

  // Add Content-Type for JSON bodies
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(res.status, body.error || body.message || 'Request failed', body)
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T
  return res.json()
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────

export const authApi = {
  signUp: (name: string, email: string, password: string) =>
    request<{ token: string; user: any }>('/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  signIn: (email: string, password: string) =>
    request<{ token: string; user: any }>('/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getSession: () =>
    request<{ session: any; user: any } | null>('/api/auth/get-session'),

  signOut: () =>
    request('/api/auth/sign-out', { method: 'POST' }),
}

// ─── Tenant-Scoped Resources ─────────────────────────────────────────

function crudApi<T extends { id: string }>(resource: string) {
  return {
    list:   ()          => request<T[]>(`/api/${resource}`),
    get:    (id: string) => request<T>(`/api/${resource}/${id}`),
    create: (data: Partial<T>) => request<T>(`/api/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<T>) => request<T>(`/api/${resource}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request<{ deleted: boolean }>(`/api/${resource}/${id}`, {
      method: 'DELETE',
    }),
  }
}

export const residentsApi = crudApi<any>('residents')
export const pagosApi = {
  ...crudApi<any>('pagos'),
  listByMonth: (monthKey: string) => request<any[]>(`/api/pagos?monthKey=${monthKey}`),
}
export const egresosApi = crudApi<any>('egresos')
export const ticketsApi = {
  ...crudApi<any>('tickets'),
  addActivity: (ticketId: string, activity: { author: string; visibility: string; message: string }) =>
    request<any>(`/api/tickets/${ticketId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activity),
    }),
}
export const avisosApi = {
  ...crudApi<any>('avisos'),
  track: (avisoId: string, data: { type: string; apartment: string; resident: string }) =>
    request<any>(`/api/avisos/${avisoId}/track`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
export const paquetesApi = {
  ...crudApi<any>('paquetes'),
  deliver: (id: string) => request<any>(`/api/paquetes/${id}/deliver`, { method: 'PATCH' }),
}
export const amenidadesApi = {
  list: () => request<any[]>('/api/amenidades'),
  create: (data: { name: string; icon: string }) => request<any>('/api/amenidades', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listReservaciones: () => request<any[]>('/api/amenidades/reservaciones'),
  createReservacion: (data: any) => request<any>('/api/amenidades/reservaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateReservacion: (id: string, data: any) => request<any>(`/api/amenidades/reservaciones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
}
export const votacionesApi = {
  ...crudApi<any>('votaciones'),
  vote: (id: string, data: { name: string; apartment: string; optionLabel: string }) =>
    request<any>(`/api/votaciones/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
export const inventoryApi = crudApi<any>('inventory')

export const configApi = {
  get: () => request<any>('/api/config'),
  update: (data: any) => request<any>('/api/config', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  replace: (data: any) => request<any>('/api/config', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getStaff: () => request<any[]>('/api/config/staff'),
}

export const dashboardApi = {
  getKPIs: () => request<any>('/api/dashboard'),
}

export const systemApi = {
  factoryReset: () => request<{ ok: boolean; message: string }>('/api/system/factory-reset', {
    method: 'POST',
  }),
  demoRestore: () => request<{ ok: boolean; message: string }>('/api/system/demo-restore', {
    method: 'POST',
  }),
}
