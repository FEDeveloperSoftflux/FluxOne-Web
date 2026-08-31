import {
  buildBootstrapSnapshot,
  buildDeltaSnapshot,
  ingestSyncEvent,
  listSyncEvents,
} from './sync.model.js'
import {
  bootstrapQuerySchema,
  deltaQuerySchema,
  pushBodySchema,
} from './sync.validator.js'
import { resolveSyncPullBranchId, resolveSyncPushBranchId } from './sync.access.js'
import { success } from '../../utils/response.util.js'

export async function push(req, res) {
  const parsed = pushBodySchema.parse(req.body)
  const branchId = resolveSyncPushBranchId(req)
  const saved = []

  for (const event of parsed.events) {
    const row = await ingestSyncEvent(
      req.tenantId,
      {
        ...event,
        branchId,
        syncedBy: req.user.id,
      },
      req.user.id,
    )
    saved.push(row)
  }

  return success(res, { accepted: saved.length, events: saved }, 202)
}

export async function bootstrap(req, res) {
  const { branchId } = bootstrapQuerySchema.parse(req.query)
  const resolvedBranchId = resolveSyncPullBranchId(req, branchId)
  const snapshot = await buildBootstrapSnapshot(req.tenantId, resolvedBranchId)
  return success(res, snapshot)
}

export async function delta(req, res) {
  const { branchId, since } = deltaQuerySchema.parse(req.query)
  const resolvedBranchId = resolveSyncPullBranchId(req, branchId)
  const snapshot = await buildDeltaSnapshot(req.tenantId, resolvedBranchId, since)
  return success(res, snapshot)
}

/** Cloud pos_sync_events audit log — not POS catalog. */
export async function events(req, res) {
  const rows = await listSyncEvents(req.tenantId, { since: req.query.since })
  return success(res, rows)
}

/** @deprecated Use GET /api/sync/bootstrap and /api/sync/delta for POS catalog sync. */
export async function pull(req, res) {
  return events(req, res)
}
