import { ROLES } from '../../config/constants.js'

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

const BRANCH_LOCKED_ROLES = new Set([
  ROLES.CASHIER,
  ROLES.INVENTORY_MANAGER,
  ROLES.BRANCH_ADMIN,
])

/**
 * Resolve branchId for sync pull (bootstrap/delta).
 * Branch-scoped roles must match JWT branchId.
 */
export function resolveSyncPullBranchId(req, queryBranchId) {
  const branchId = queryBranchId || req.user?.branchId || null
  if (!branchId) {
    throw httpError(422, 'branchId is required')
  }

  const tokenBranchId = req.user?.branchId || null
  if (BRANCH_LOCKED_ROLES.has(req.user?.role) && tokenBranchId && tokenBranchId !== branchId) {
    throw httpError(403, 'Branch access denied')
  }

  return branchId
}

/** Push requires branch on token for branch-scoped roles. */
export function resolveSyncPushBranchId(req) {
  const branchId = req.user?.branchId || null
  if (BRANCH_LOCKED_ROLES.has(req.user?.role) && !branchId) {
    throw httpError(403, 'Account is not assigned to a branch')
  }
  return branchId
}
