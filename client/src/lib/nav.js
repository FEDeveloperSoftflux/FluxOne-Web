import { PATHS } from '@/router/paths'
import { ROLES } from '@/lib/constants'

/** Shared top-nav links by role — BM currently only Dashboard + Staff */
export const NAV_BY_ROLE = {
  [ROLES.BRANCH_MANAGER]: [
    { to: PATHS.branch.dashboard, label: 'Dashboard', end: true },
    { to: PATHS.branch.staff, label: 'Staff', end: false },
  ],
  [ROLES.INVENTORY_MANAGER]: [
    { to: PATHS.inventory.dashboard, label: 'Dashboard', end: true },
    { to: PATHS.inventory.categories, label: 'Categories', end: false },
    { to: PATHS.inventory.products, label: 'Products', end: false },
    { to: PATHS.inventory.control, label: 'Control', end: false },
    { to: PATHS.inventory.suppliers, label: 'Suppliers', end: false },
    { to: PATHS.inventory.orders, label: 'Orders', end: false }
  ],
}

export function getNavItemsForRole(role) {
  return NAV_BY_ROLE[role] || []
}

export function roleDisplayName(role) {
  if (role === ROLES.BRANCH_MANAGER) return 'Branch Manager'
  if (role === ROLES.INVENTORY_MANAGER) return 'Inventory Manager'
  if (role === ROLES.B2B_ADMIN) return 'B2B Admin'
  return role || 'User'
}

export function getInitials(name = '', email = '') {
  const source = (name || email || 'U').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}
