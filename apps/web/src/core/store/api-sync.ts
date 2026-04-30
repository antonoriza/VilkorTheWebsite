/**
 * api-sync.ts — Syncs dispatched actions to the backend API.
 * Runs after the optimistic local update — failures are logged, not thrown.
 */
import {
  residentsApi, pagosApi, egresosApi, ticketsApi, avisosApi,
  paquetesApi, amenidadesApi, votacionesApi, inventoryApi,
  configApi, ApiError,
} from '../../lib/api'
import type { Action } from './reducer'

export async function syncActionToAPI(action: Action): Promise<void> {
  try {
    switch (action.type) {
      case 'ADD_RESIDENT':    await residentsApi.create(action.payload); break
      case 'UPDATE_RESIDENT': await residentsApi.update(action.payload.id, action.payload); break
      case 'DELETE_RESIDENT': await residentsApi.delete(action.payload); break
      case 'ADD_PAGO':        await pagosApi.create(action.payload); break
      case 'UPDATE_PAGO':     await pagosApi.update(action.payload.id, action.payload); break
      case 'ADD_EGRESO':      await egresosApi.create(action.payload); break
      case 'UPDATE_EGRESO':   await egresosApi.update(action.payload.id, action.payload); break
      case 'DELETE_EGRESO':   await egresosApi.delete(action.payload); break
      case 'ADD_TICKET':      await ticketsApi.create(action.payload); break
      case 'UPDATE_TICKET':   await ticketsApi.update(action.payload.id, action.payload); break
      case 'ADD_TICKET_ACTIVITY': await ticketsApi.addActivity(action.payload.ticketId, action.payload.activity); break
      case 'ADD_AVISO':       await avisosApi.create(action.payload); break
      case 'UPDATE_AVISO':    await avisosApi.update(action.payload.id, action.payload); break
      case 'DELETE_AVISO':    await avisosApi.delete(action.payload); break
      case 'TRACK_AVISO':     await avisosApi.track(action.payload.avisoId, { type: action.payload.type, apartment: action.payload.apartment, resident: action.payload.resident }); break
      case 'ADD_PAQUETE':     await paquetesApi.create(action.payload); break
      case 'UPDATE_PAQUETE':  action.payload.status === 'Entregado' ? await paquetesApi.deliver(action.payload.id) : await paquetesApi.update(action.payload.id, action.payload); break
      case 'DELETE_PAQUETA':  await paquetesApi.delete(action.payload); break
      case 'ADD_AMENITY':     await amenidadesApi.create(action.payload); break
      case 'ADD_RESERVACION': await amenidadesApi.createReservacion(action.payload); break
      case 'ADD_VOTACION':    await votacionesApi.create(action.payload); break
      case 'VOTE':            await votacionesApi.vote(action.payload.votacionId, action.payload.voter); break
      case 'ADD_INVENTORY':    await inventoryApi.create(action.payload); break
      case 'UPDATE_INVENTORY': await inventoryApi.update(action.payload.id, action.payload); break
      case 'DELETE_INVENTORY': await inventoryApi.delete(action.payload); break
      case 'SAVE_BUILDING_CONFIG':   await configApi.update(action.payload); break
      // Local-only actions — no API sync
      default: break
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      console.warn('[Store] API session expired — mutation saved locally only')
    } else {
      console.error('[Store] API sync failed for', action.type, err)
    }
  }
}
