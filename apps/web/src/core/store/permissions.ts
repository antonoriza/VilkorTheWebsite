/**
 * Permission matrix checker — evaluates access control rules.
 * Consumed by: DashboardLayout (nav filtering).
 * Does NOT handle: UI rendering, authentication, or role assignment.
 */
import type { Resource, UserGroup } from '../../types'
import type { StoreState } from './store'

/**
 * Checks if a user group has permission to perform an action on a resource.
 */
export function hasPermission(
  state: StoreState, 
  resource: Resource, 
  action: string, 
  userGroup: UserGroup
): boolean {
  // super_admin always has full access — regardless of whether a
  // permissionsMatrix has been configured (e.g. right after factory reset)
  if (userGroup === 'super_admin') return true
  const matrix = state.buildingConfig.permissionsMatrix
  if (!matrix) return false
  const allowedGroups = matrix[resource]?.[action] || []
  return allowedGroups.includes(userGroup)
}
