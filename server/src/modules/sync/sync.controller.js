import { z } from 'zod'
import { ingestSyncEvent, listSyncEvents } from './sync.model.js'
import { success } from '../../utils/response.util.js'

const pushSchema = z.object({
  events: z
    .array(
      z.object({
        clientEventId: z.string().min(1),
        eventType: z.enum(['sale', 'refund', 'cashier_log', 'attendance']),
        payload: z.record(z.string(), z.any()),
        deviceId: z.string().optional(),
      }),
    )
    .min(1),
})

export async function push(req, res) {
  const parsed = pushSchema.parse(req.body)
  const saved = []

  for (const event of parsed.events) {
    const row = await ingestSyncEvent(req.tenantId, {
      ...event,
      branchId: req.user.branchId,
      syncedBy: req.user.id,
    }, req.user.id)
    saved.push(row)
  }

  return success(res, { accepted: saved.length, events: saved }, 202)
}

export async function pull(req, res) {
  const rows = await listSyncEvents(req.tenantId, { since: req.query.since })
  return success(res, rows)
}
