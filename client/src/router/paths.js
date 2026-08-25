export const PATHS = {
  splash: '/',
  login: '/login',
  profile: '/profile',
  inventory: {
    root: '/inventory',
    dashboard: '/inventory',
    products: '/inventory/products',
    control: '/inventory/control',
    suppliers: '/inventory/suppliers',
    orders: '/inventory/orders',
    categories: '/inventory/categories',
    profile: '/inventory/profile',
  },
  branch: {
    root: '/branch',
    dashboard: '/branch',
    staff: '/branch/staff',
    profile: '/branch/profile',
  },
}

export const INVENTORY_ROLES = ['inventory_manager']
export const BRANCH_ROLES = ['branch_manager']

export function homePathForRole(role) {
  if (INVENTORY_ROLES.includes(role)) return PATHS.inventory.root
  if (BRANCH_ROLES.includes(role)) return PATHS.branch.root
  return PATHS.profile
}

/** Profile lives inside BM / IM layouts so the top nav stays visible. */
export function profilePathForRole(role) {
  if (INVENTORY_ROLES.includes(role)) return PATHS.inventory.profile
  if (BRANCH_ROLES.includes(role)) return PATHS.branch.profile
  return PATHS.profile
}
