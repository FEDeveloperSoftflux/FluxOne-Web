import { z } from 'zod'
import { tenantClientQuery, tenantQuery, withTransaction } from '../../config/db.js'
import { MOVEMENT_TYPES } from '../../config/constants.js'
import { insertLedgerEventInTx } from '../inventory-manager/control/control.model.js'

const posLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  scale: z.string().min(1).optional(),
})

const posInventoryPayloadSchema = z.object({
  lines: z.array(posLineSchema).min(1),
  reason: z.string().optional(),
})

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

export async function insertSyncEvent(tenantId, event) {
  return withTransaction((client) => insertSyncEventInTx(client, tenantId, event))
}

async function insertSyncEventInTx(client, tenantId, event) {
  const { rows } = await tenantClientQuery(
    client,
    tenantId,
    `
      INSERT INTO pos_sync_events (
        tenant_id, branch_id, device_id, event_type, payload, client_event_id, synced_by
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
      ON CONFLICT (tenant_id, client_event_id) DO UPDATE
      SET payload = EXCLUDED.payload
      RETURNING id, client_event_id AS "clientEventId", event_type AS "eventType", payload
    `,
    [
      event.branchId || null,
      event.deviceId || null,
      event.eventType,
      JSON.stringify(event.payload || {}),
      event.clientEventId,
      event.syncedBy || null,
    ],
  )
  return rows[0]
}

async function ledgerAlreadyProcessed(client, tenantId, posEventId) {
  const { rows } = await tenantClientQuery(
    client,
    tenantId,
    `SELECT id FROM inventory_ledger WHERE tenant_id = $1 AND pos_event_id = $2 LIMIT 1`,
    [posEventId],
  )
  return Boolean(rows[0])
}

async function processPosInventoryEvent(client, tenantId, syncEvent, userId) {
  if (syncEvent.eventType !== 'sale' && syncEvent.eventType !== 'refund') {
    return { ledgerLines: [], skipped: false }
  }

  const parsed = posInventoryPayloadSchema.safeParse(syncEvent.payload)
  if (!parsed.success) {
    throw httpError(422, 'Sale/refund events require payload.lines with productId and quantity')
  }

  if (await ledgerAlreadyProcessed(client, tenantId, syncEvent.id)) {
    return { ledgerLines: [], skipped: true }
  }

  const movementType = syncEvent.eventType === 'sale' ? MOVEMENT_TYPES.OUT : MOVEMENT_TYPES.IN
  const reason = parsed.data.reason || `POS ${syncEvent.eventType}`
  const ledgerLines = []

  for (const line of parsed.data.lines) {
    ledgerLines.push(
      await insertLedgerEventInTx(client, tenantId, {
        productId: line.productId,
        movementType,
        quantity: line.quantity,
        scale: line.scale || 'unit',
        reason,
        posEventId: syncEvent.id,
        createdBy: userId,
      }),
    )
  }

  return { ledgerLines, skipped: false }
}

export async function ingestSyncEvent(tenantId, event, userId) {
  return withTransaction(async (client) => {
    const syncEvent = await insertSyncEventInTx(client, tenantId, event)
    const inventory = await processPosInventoryEvent(client, tenantId, syncEvent, userId)
    return { ...syncEvent, ...inventory }
  })
}

export async function listSyncEvents(tenantId, { since } = {}) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT id, event_type AS "eventType", payload, client_event_id AS "clientEventId", created_at AS "createdAt"
      FROM pos_sync_events
      WHERE tenant_id = $1
        AND ($2::timestamptz IS NULL OR created_at > $2::timestamptz)
      ORDER BY created_at ASC
    `,
    [since || null],
  )
  return rows
}
