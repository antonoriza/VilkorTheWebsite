/**
 * Building configuration types — Digital Twin infrastructure.
 * Consumed by: ConfiguracionPage, store, dashboard.
 * Does NOT contain: financial records or user-facing components.
 */
import type { EgresoCategoria, RecurringEgreso, FinancialMaturityRules, SurchargeConfig, BankingConfig, ConceptoFinanciero } from './financial'
import type { PermissionMatrix } from './permissions'

/** Property classification for future scalability */
export type PropertyCategory = 'residencial' | 'industrial' | 'comercial' | 'hotel'

/** Topographical grouping logic */
export type GroupingMode = 'vertical' | 'horizontal'

/** Spatial zoning points (Digital Twin infrastructure) */
export interface ZoningPoint {
  id: string
  name: string
  type: 'lobby' | 'elevator' | 'gate' | 'other'
  linkedContainer: string
}

/** The "DNA" of a residential unit */
export interface UnitDna {
  privateArea: number
  totalArea: number
  ownershipCoefficient: number
  usageType: 'propietario' | 'renta_largo' | 'renta_corto' | 'desocupado'
}

/** Topology hierarchies (Digital Twin structure generator) */
export interface TopologyContainer {
  id: string
  name: string
  unitsCount: number
  parkingCount: number
  storageCount: number
}

export interface TopologyParams {
  containers: TopologyContainer[]
  unitNomenclature: string
}

/** Objects linked to a primary unit */
export interface LinkedObject {
  id: string
  type: 'estacionamiento' | 'bodega' | 'tag'
  location: string
  hasEVCharger?: boolean
  meta?: string
}

/** Utility points for consumption mapping */
export interface UtilityPoint {
  id: string
  meterId: string
  type: 'agua' | 'gas' | 'electricidad'
  isIndividual: boolean
}

/** Critical infrastructure for preventive maintenance */
export interface CriticalEquipment {
  id: string
  name: string
  type: 'solar' | 'ac' | 'boiler' | 'pump' | 'elevator' | 'cistern' | 'cctv' | 'electric_plant' | 'transformer' | 'hvac' | 'intercom' | 'gate'
  category: 'transporte' | 'hidraulica' | 'energia' | 'seguridad'
  location?: string
  lastMaintenance?: string
  nextMaintenance?: string
}

/** Agentic-first vendor directory */
export type VendorCategory =
  | 'limpieza' | 'plomeria' | 'elevadores' | 'electricidad'
  | 'seguridad' | 'jardineria' | 'hvac' | 'otro'

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  limpieza: 'Limpieza / Recolección',
  plomeria: 'Plomería',
  elevadores: 'Elevadores',
  electricidad: 'Electricidad',
  seguridad: 'Seguridad',
  jardineria: 'Jardinería',
  hvac: 'HVAC / Climatización',
  otro: 'Otro',
}

export interface Vendor {
  id: string
  service: string
  name: string
  category: VendorCategory
  phone: string
  email?: string
  schedule?: string
  type: 'urgencias' | 'mantenimiento' | 'recurrente'
  notes?: string
}

/** Reservation approval mode — controls how amenity bookings are handled */
export type ReservationApprovalMode = 'auto_approve' | 'manual_approval' | 'auto_with_exceptions'

export interface BuildingConfig {
  propertyCategory: PropertyCategory
  type: 'towers' | 'houses'
  groupingMode: GroupingMode
  towers: string[]
  buildingName: string
  buildingAddress: string
  zipCode?: string
  city?: string
  state?: string
  country?: string
  managementCompany: string
  totalUnits: number
  adminName: string
  adminEmail: string
  adminPhone: string
  conceptosPago: string[]
  subConceptos?: Record<string, string[]>
  categoriasEgreso?: EgresoCategoria[]
  monthlyFee: number
  recurringEgresos: RecurringEgreso[]
  maturityRules: FinancialMaturityRules
  surcharge: SurchargeConfig
  banking: BankingConfig
  zoning: ZoningPoint[]
  topology: TopologyParams
  defaultUnitDna: UnitDna
  equipment: CriticalEquipment[]
  vendors: Vendor[]
  permissionsMatrix: PermissionMatrix
  conceptosFinancieros?: ConceptoFinanciero[]

  // Amenity reservation settings
  reservationApprovalMode: ReservationApprovalMode
  reservationExceptionApartments: string[]

  // Paquetería storage location catalog
  packageLocations: string[]
}
