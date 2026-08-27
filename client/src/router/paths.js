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
  // Phase 2 roles — shell only (logo + profile + logout)
  workspace: {
    root: '/workspace',
    home: '/workspace',
    profile: '/workspace/profile',
  },
}

export const INVENTORY_ROLES = ['inventory_manager', 'b2b_admin']
export const BRANCH_ROLES = ['branch_manager']
export const PHASE2_ROLES = ['production_staff', 'delivery_staff']

export function homePathForRole(role) {
  if (INVENTORY_ROLES.includes(role)) return PATHS.inventory.root
  if (BRANCH_ROLES.includes(role)) return PATHS.branch.root
  if (PHASE2_ROLES.includes(role)) return PATHS.workspace.root
  return PATHS.profile
}

// Profile lives inside each role layout so the top nav stays visible.
export function profilePathForRole(role) {
  if (INVENTORY_ROLES.includes(role)) return PATHS.inventory.profile
  if (BRANCH_ROLES.includes(role)) return PATHS.branch.profile
  if (PHASE2_ROLES.includes(role)) return PATHS.workspace.profile
  return PATHS.profile
}
