/**
 * Permission types — access control matrix.
 * Consumed by: DashboardLayout, store permissions helper, ConfiguracionPage.
 * Does NOT contain: UI rendering or authentication logic.
 */

/** Human-readable group identifiers */
export type UserGroup = 'super_admin' | 'administracion' | 'operador' | 'residente'

/** Functional system areas */
export type Resource = 'finanzas' | 'logistica' | 'comunicacion' | 'gobernanza' | 'directorio' | 'configuracion'

/** Specific interaction capability */
export type PermissionAction = 'ver' | 'crear' | 'editar' | 'eliminar' | 'votar'

/** A ThingWorx-style permission record: Map[Resource] -> Map[Action] -> UserGroups[] */
export type PermissionMatrix = Record<string, Record<string, UserGroup[]>>
