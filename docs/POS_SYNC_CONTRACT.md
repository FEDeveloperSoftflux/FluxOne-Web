# FluxOne POS ↔ Cloud Sync Contract v1

**Production base URL:** `https://fluxone-b2b.onrender.com/api`  
**Response wrapper (all endpoints):** `{ "success": boolean, "data": T | null, "error": string | null }`

---

## Authentication

### POST `/auth/login`

**Request:**
```json
{
  "id": "branch.wah@companya.local",
  "password": "password"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "token": "<jwt>",
    "refreshToken": "<jwt>",
    "expiresIn": 900,
    "tenantId": "11111111-1111-1111-1111-111111111111",
    "user": {
      "id": "a2222222-2222-2222-2222-222222222222",
      "name": "Bilal Khan",
      "email": "branch.wah@companya.local",
      "role": "branch_manager",
      "tenantId": "11111111-1111-1111-1111-111111111111",
      "branchId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
      "branchName": "Company A - Wah Cantt"
    },
    "branches": [
      {
        "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
        "name": "Company A - Wah Cantt",
        "code": null
      }
    ]
  },
  "error": null
}
```

- `branch_manager` / `cashier`: `branches.length === 1` (JWT branch only).
- `b2b_admin`: all tenant branches in `branches[]`.
- `accessToken` and `token` are identical (backward compatible).

### POST `/auth/refresh`

Same `data` shape as login. Body: `{ "refreshToken": "..." }`.

---

## Sync pull (catalog)

**Auth:** Bearer JWT with `sync:pull` (`branch_manager`, `cashier`, `b2b_admin`, …).

**Branch lock:** For `branch_manager`, `cashier`, `inventory_manager`, `branch_admin` — query `branchId` **must** match JWT `branchId` → `403` on mismatch.

### GET `/sync/bootstrap?branchId={uuid}`

Full branch-scoped snapshot for first POS install.

**Users included:**
- Active `branch_manager` where `branch_id = branchId`
- Active `cashier` where `branch_id = branchId`
- Each user includes `passwordHash` (bcrypt). Never plain passwords.
- **Never** `inventory_manager` or `b2b_admin`.

**Response sections:** `syncVersion`, `tenant`, `branch`, `users`, `categories`, `products`, `taxes`, `offers`, `branchInventory`, `counters`, `company`, `productTaxes`.

**Dual field aliases (cloud + POS):**

| Cloud field | POS alias |
|-------------|-----------|
| `fullName` | `name` |
| `loginId` | `email` |
| `itemCode` | `sku` |
| `sellingPrice` | `price` |
| `ratePercent` | `rate` |
| `status: "active"` | `isActive: true` |
| `products[].taxIds[]` | flattened `productTaxes[]` |
| `contactPhone` | `phone` |

### GET `/sync/delta?branchId={uuid}&since={ISO8601}`

Same shape as bootstrap. **`since` is exclusive** — rows with `created_at > since` (or `updated_at > since` for `branch_inventory`).

`taxes` and `offers` are full refresh each delta (small tenant-wide tables).

---

## Sync push (sales outbox)

**Auth:** Bearer JWT with `sync:push`.  
**Rate limit:** 400 requests / 15 minutes (`/api/sync/*`).  
**Branch lock:** JWT `branchId` must match body `branchId` when provided (branch-scoped roles). Body `branchId` required for `b2b_admin`.

### POST `/sync/push`

**Request (POS-shaped — aliases accepted):**
```json
{
  "deviceId": "terminal-001",
  "branchId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
  "events": [
    {
      "clientEventId": "pos-sale-20260831-001",
      "eventType": "sale",
      "payload": {
        "invoiceId": "INV-1009",
        "soldAt": "2026-08-31T10:00:00.000Z",
        "counterCode": "C1",
        "cashierId": "a2222222-2222-2222-2222-222222222222",
        "paymentMethod": "cash",
        "subtotal": 1000,
        "tax": 170,
        "discount": 50,
        "total": 1120,
        "tendered": 1500,
        "changeDue": 380,
        "status": "completed",
        "items": [
          {
            "productId": "<uuid>",
            "quantity": 2,
            "scale": "piece",
            "unitPrice": 500,
            "discount": 25,
            "tax": 85,
            "lineTotal": 975,
            "isExchange": false
          }
        ]
      }
    }
  ]
}
```

**POS → cloud field mapping (automatic):**

| POS sends | Cloud stores |
|-----------|--------------|
| `items[]` | `lines[]` |
| `cashierId` | `staffUserId` |
| `discount`, `tax`, `total` | `discountAmount`, `taxAmount`, `finalAmount` |
| `tendered`, `changeDue` | `paidAmount`, `returnAmount` |
| `invoiceId` | `saleNumber` |
| Line `discount`, `tax` | `discountAmount`, `taxAmount` |

Root-level `deviceId` is applied to events missing `deviceId`.

**Response `202`:**
```json
{
  "success": true,
  "data": {
    "accepted": ["pos-sale-20260831-001"],
    "rejected": [],
    "events": [
      {
        "clientEventId": "pos-sale-20260831-001",
        "skipped": false,
        "saleId": "<uuid>"
      }
    ],
    "acceptedCount": 1
  },
  "error": null
}
```

- Idempotent replay of same `clientEventId` → still in `accepted[]`, `skipped: true`, no duplicate sale.
- Per-event validation failures go to `rejected[]`; other events in batch still process.

**Event types:**

| Type | Behavior |
|------|----------|
| `sale` | `sales` + `sale_items` + `inventory_ledger` OUT |
| `refund` | Same tables, ledger IN; accepts `originalInvoiceId`, `refundAmount` |
| `cashier_log` | Stored in `pos_sync_events` only; payload `{ action, employeeId, entityType, entityId, metadata, timestamp }` |
| `attendance` | Stored in `pos_sync_events` only (Phase 1) |

**Exchange (v1):** Set `isExchange: true` on a sale line, or send separate sale + refund events. No dedicated exchange event type.

---

## Deprecated

- `GET /sync/pull` — aliases `/sync/events` (cloud audit log, **not** POS catalog).

---

## Demo credentials (Company A)

| User | Login ID | Branch UUID |
|------|----------|-------------|
| Branch Manager Wah | `branch.wah@companya.local` | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1` |
| Branch Manager Haripur | `branch.haripur@companya.local` | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2` |
| B2B Admin | `admin@companya.local` | (all branches) |

Demo password: `password`

---

## Acceptance checklist

1. BM login → `accessToken`, `tenantId`, `branches.length === 1`
2. BM bootstrap Wah → `200`, users include BM + cashiers with `passwordHash`
3. BM bootstrap Haripur with Wah token → `403`
4. BM delta → `200`
5. POS-shaped push (`items[]`) → `accepted: ["clientEventId"]`, sale persisted
6. Idempotent replay → same `clientEventId` in `accepted[]`, `skipped: true`
