/**
 * api-loader.ts — Loads all data from the backend API on app startup.
 * Returns null if API is unreachable.
 */
import {
  residentsApi, pagosApi, egresosApi, ticketsApi, avisosApi,
  paquetesApi, amenidadesApi, votacionesApi, inventoryApi,
  configApi,
} from '../../lib/api'
import { EMPTY_BUILDING_CONFIG, type StoreState } from './reducer'

export async function loadStateFromAPI(): Promise<StoreState | null> {
  try {
    const results = await Promise.allSettled([
      residentsApi.list(),
      pagosApi.list(),
      egresosApi.list(),
      ticketsApi.list(),
      avisosApi.list(),
      paquetesApi.list(),
      amenidadesApi.list(),
      amenidadesApi.listReservaciones(),
      votacionesApi.list(),
      inventoryApi.list(),
      configApi.get(),
      configApi.getStaff(),
    ])

    const allFailed = results.every(r => r.status === 'rejected')
    if (allFailed) return null

    const get = <T,>(i: number, fb: T): T => {
      const r = results[i]
      return r.status === 'fulfilled' ? (r.value as T) : fb
    }

    return {
      residents:      get(0, []),
      pagos:          get(1, []),
      egresos:        get(2, []),
      tickets:        get(3, []),
      avisos:         get(4, []),
      paquetes:       get(5, []),
      amenities:      get(6, []),
      reservaciones:  get(7, []),
      votaciones:     get(8, []),
      inventory:      get(9, []),
      buildingConfig: { ...EMPTY_BUILDING_CONFIG, ...get(10, {}) },
      staff:          get(11, []),
      notificaciones: [],
      ticketCounter:  0,
      adeudos:        [],
      shiftOverrides: [],
      version:        1,
    }
  } catch {
    return null
  }
}
