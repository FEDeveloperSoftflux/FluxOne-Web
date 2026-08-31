# FluxOne Cloud Sync API — Phase 1 Roadmap

> **Status:** Phase 1 complete — POS contract v1 aligned  
> **Contract doc:** [docs/POS_SYNC_CONTRACT.md](../docs/POS_SYNC_CONTRACT.md)

## Problem Statement

Current sync endpoints do not match POS expectations:

| Endpoint | Current behavior | Required behavior |
|----------|------------------|-------------------|
| `GET /api/sync/pull` | Returns `pos_sync_events` (cloud audit log) | **Deprecated** — POS needs catalog, not cloud events |
| `POST /api/sync/push` | Updates `inventory_ledger` only | Insert `sales` + `sale_items` + `inventory_ledger` atomically |
| `GET /api/sync/bootstrap` | Does not exist | Full branch-scoped snapshot for first POS install |
| `GET /api/sync/delta` | Does not exist | Incremental changes since timestamp |

## Execution Order

1. **Push refactor** (sales ingest) — POS can test without full catalog
2. **Bootstrap** — first-install catalog pull
3. **Delta** — incremental sync after bootstrap
4. **Route cleanup** — deprecate `/pull`, add `/events`
5. **Test script** — manual verification

---

## API Contracts

### POST `/api/sync/push`

**Auth:** `Bearer` JWT with `sync:push` permission. Cashier token **must** include `branchId`.

**Request:**
```json
{
  "events": [
    {
      "clientEventId": "pos-local-uuid-or-slug",
      "eventType": "sale",
      "deviceId": "optional-device-id",
      "payload": {
        "localSaleId": "optional-local-id",
        "saleNumber": "INV-1009",
        "soldAt": "2026-08-31T10:00:00.000Z",
        "counterCode": "C1",
        "staffUserId": "uuid-of-cashier-user",
        "paymentMethod": "cash",
        "subtotal": 1000.00,
        "taxAmount": 170.00,
        "discountAmount": 50.00,
        "finalAmount": 1120.00,
        "paidAmount": 1500.00,
        "returnAmount": 380.00,
        "status": "completed",
        "lines": [
          {
            "productId": "uuid",
            "quantity": 2,
            "scale": "piece",
            "unitPrice": 500.00,
            "discountAmount": 25.00,
            "taxAmount": 85.00,
            "lineTotal": 975.00,
            "isExchange": false
          }
        ]
      }
    }
  ]
}
```

**Event types:** `sale` | `refund` | `cashier_log` | `attendance`

- **sale** — ledger OUT, status `completed`
- **refund** — ledger IN, status `refunded` | `partial_refund`, same payload shape
- **cashier_log / attendance** — stored in `pos_sync_events` only (Phase 1)

**Response:** `202 Accepted`
```json
{
  "success": true,
  "data": {
    "accepted": 1,
    "events": [
      {
        "clientEventId": "pos-local-uuid-or-slug",
        "skipped": false,
        "saleId": "uuid-or-null"
      }
    ]
  }
}
```

**Idempotency:** `ON CONFLICT (tenant_id, client_event_id) DO NOTHING`. If `sales.pos_event_id` or `inventory_ledger.pos_event_id` already exists → `{ skipped: true }`.

---

### GET `/api/sync/bootstrap?branchId={uuid}`

**Auth:** `sync:pull` permission.

**Branch access:**
- `cashier`, `branch_manager`, `inventory_manager`, `branch_admin` — JWT `branchId` **must** match query `branchId` (403 on mismatch)
- `b2b_admin` — any branch in tenant

**Response:**
```json
{
  "success": true,
  "data": {
    "syncVersion": "2026-08-31T12:00:00.000Z",
    "tenant": { "id": "uuid", "name": "Company A", "slug": "company-a" },
    "branch": { "id": "uuid", "name": "Wah Cantt" },
    "users": [
      {
        "id": "uuid",
        "loginId": "cashier@branch.local",
        "passwordHash": "$2a$...",
        "role": "cashier",
        "fullName": "Cashier One",
        "branchId": "uuid",
        "tenantId": "uuid",
        "isActive": true
      }
    ],
    "categories": [
      { "id": "uuid", "parentId": null, "name": "Beverages", "imageUrl": null, "isActive": true, "branchId": "uuid" }
    ],
    "products": [
      {
        "id": "uuid",
        "name": "Cola 500ml",
        "itemCode": "COL-500",
        "barcode": "123456",
        "type": "single",
        "scale": "piece",
        "sellingPrice": 120,
        "discountPercent": 0,
        "status": "active",
        "categoryId": "uuid",
        "subcategoryId": null,
        "branchId": "uuid",
        "taxIds": ["uuid"],
        "bundleItems": []
      }
    ],
    "taxes": [{ "id": "uuid", "name": "GST", "ratePercent": 17 }],
    "offers": [{ "id": "uuid", "name": "Ramadan", "percent": 10 }],
    "branchInventory": [{ "productId": "uuid", "quantity": 50 }],
    "counters": [{ "id": "uuid", "code": "C1", "name": "Counter 1", "isActive": true }],
    "company": {
      "name": "Company A",
      "contactPhone": null,
      "warningMessage": null,
      "returnInstructions": null
    }
  }
}
```

**Users included:**
- Active `branch_manager` + `cashier` where `branch_id = branchId`
- Each user includes `passwordHash` (bcrypt)
- **Never** `inventory_manager` or `b2b_admin`

---

### GET `/api/sync/delta?branchId={uuid}&since={ISO8601}`

Same response sections as bootstrap, but only rows changed after `since`.

**Timestamp strategy (v1):**
| Table | Filter column |
|-------|---------------|
| `users` | `created_at > since` |
| `categories` | `created_at > since` |
| `products` | `created_at > since` |
| `branch_inventory` | `updated_at > since` |
| `pos_counters` | `created_at > since` |
| `taxes`, `offers` | Full refresh each delta (no `updated_at` column; small tenant-wide data) |

If no changes: empty arrays + new `syncVersion`.

---

### GET `/api/sync/events?since={ISO8601}` *(replaces `/pull`)*

Returns cloud `pos_sync_events` for audit/debug. **Not** for POS catalog sync.

`GET /api/sync/pull` — **@deprecated**, aliases to `/events`.

---

## File Change List

| File | Action |
|------|--------|
| `CURSOR_CLOUD_SYNC_ROADMAP.md` | Created (this file) |
| `server/src/modules/sync/sync.validator.js` | **New** — Zod schemas |
| `server/src/modules/sync/sync.access.js` | **New** — branch access helpers |
| `server/src/modules/sync/sync.model.js` | **Refactor** — push ingest, bootstrap, delta |
| `server/src/modules/sync/sync.controller.js` | **Update** — thin handlers |
| `server/src/modules/sync/sync.routes.js` | **Update** — bootstrap, delta, events |
| `server/scripts/test-sync-push.js` | **New** — manual push verification |

---

## SQL Query Outline

### Push — sale ingest (single transaction)
1. `INSERT pos_sync_events … ON CONFLICT DO NOTHING`
2. Check `sales` / `inventory_ledger` by `pos_event_id` → skip if exists
3. `INSERT pos_counters … ON CONFLICT DO UPDATE` (by tenant+branch+code)
4. `SELECT staff.id FROM staff WHERE user_id = $staffUserId`
5. `INSERT sales (…, pos_event_id)`
6. `INSERT sale_items` per line
7. `INSERT inventory_ledger` OUT/IN via `insertLedgerEventInTx` + `branch_inventory` adjust

### Bootstrap — `buildBootstrapSnapshot(tenantId, branchId)`
1. Tenant + branch metadata
2. Users: cashiers @ branch + b2b_admins @ tenant
3. Categories: `branch_id = $branchId AND is_active`
4. Products: `branch_id = $branchId AND status = 'active'`
5. Product taxes + bundle items (join/aggregate)
6. Taxes + offers (tenant-wide)
7. `branch_inventory` for branch
8. `pos_counters` for branch

### Delta — `buildDeltaSnapshot(tenantId, branchId, since)`
Same queries with `created_at > since` / `updated_at > since` filters.

---

## Test Plan

### Push
1. Login as cashier with `branchId` on JWT
2. `POST /api/sync/push` with sample sale (valid product UUIDs)
3. Verify DB:
   - `pos_sync_events` row exists
   - `sales` row with matching `pos_event_id`
   - `sale_items` rows for each line
   - `inventory_ledger` OUT rows
   - `branch_inventory` quantity decreased
4. Re-send same `clientEventId` → `{ skipped: true }`, no duplicate sales
5. BM dashboard `/api/branch-manager/dashboard/sales-summary` shows revenue

### Bootstrap
1. Login as cashier
2. `GET /api/sync/bootstrap?branchId={jwt.branchId}`
3. Verify users include cashiers + b2b_admin, products are branch-scoped UUIDs
4. Attempt bootstrap for another branch → 403

### Delta
1. Note `syncVersion` from bootstrap
2. Create/update a product on cloud
3. `GET /api/sync/delta?branchId=…&since={syncVersion}`
4. Verify only changed rows returned

### Deprecation
- `GET /api/sync/pull` still works (aliases `/events`)
- Document in POS integration guide to use bootstrap/delta instead

---

## Permissions

From `server/src/config/constants.js`:
- `sync:push` — cashier, **branch_manager**, branch_admin, inventory_manager, b2b_admin
- `sync:pull` — cashier, **branch_manager**, branch_admin, inventory_manager, b2b_admin

JWT payload: `{ sub, role, tenantId, branchId }`

---

## Definition of Done (Phase 1)

- [x] This roadmap file exists
- [x] Push creates `sales` + `sale_items` + `inventory_ledger` atomically
- [x] Bootstrap returns branch-scoped UUID catalog + BM/cashier users with `passwordHash`
- [x] Delta returns incremental changes
- [x] Old `/pull` deprecated; `/events` added
- [x] `branch_manager` sync permissions + branch lock
- [x] POS field aliases on push + dual response aliases on pull
- [x] Login/refresh POS aliases (`accessToken`, `branches`, `expiresIn`)
- [x] POS contract doc: `docs/POS_SYNC_CONTRACT.md`
- [ ] BM dashboard shows sales after POS push (verify with live DB)
- [x] Migrations run on server startup
