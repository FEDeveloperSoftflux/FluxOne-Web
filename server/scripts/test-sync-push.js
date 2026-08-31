/**
 * Manual sync push verification script.
 *
 * Usage:
 *   node scripts/test-sync-push.js
 *
 * Env:
 *   API_BASE       — default http://localhost:3000
 *   LOGIN_ID       — cashier login id (email)
 *   PASSWORD       — password
 *   TENANT_SLUG    — optional if multiple tenants share login id
 *   PRODUCT_ID     — UUID of an active product in the cashier branch
 *   CLIENT_EVENT_ID — optional idempotency key (default: random)
 */
import 'dotenv/config'

const API_BASE = process.env.API_BASE || 'http://localhost:3000'
const LOGIN_ID = process.env.LOGIN_ID
const PASSWORD = process.env.PASSWORD
const TENANT_SLUG = process.env.TENANT_SLUG
const PRODUCT_ID = process.env.PRODUCT_ID
const CLIENT_EVENT_ID = process.env.CLIENT_EVENT_ID || `test-${Date.now()}`

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${json.error || JSON.stringify(json)}`)
  }
  return json
}

async function main() {
  if (!LOGIN_ID || !PASSWORD) {
    console.error('Set LOGIN_ID and PASSWORD env vars (cashier with branchId on token).')
    process.exit(1)
  }
  if (!PRODUCT_ID) {
    console.error('Set PRODUCT_ID env var to an active product UUID in the cashier branch.')
    process.exit(1)
  }

  console.log('1. Login…')
  const loginBody = { id: LOGIN_ID, password: PASSWORD }
  if (TENANT_SLUG) loginBody.tenantSlug = TENANT_SLUG

  const login = await request('/api/auth/login', { method: 'POST', body: loginBody })
  const token = login.data?.token
  const branchId = login.data?.user?.branchId
  if (!token) throw new Error('Login did not return accessToken')
  if (!branchId) throw new Error('Cashier token missing branchId — assign branch before sync push')

  console.log('   branchId:', branchId)

  console.log('2. POST /api/sync/push …')
  const pushPayload = {
    events: [
      {
        clientEventId: CLIENT_EVENT_ID,
        eventType: 'sale',
        deviceId: 'test-script',
        payload: {
          saleNumber: `TEST-${CLIENT_EVENT_ID.slice(-6)}`,
          soldAt: new Date().toISOString(),
          counterCode: 'C1',
          staffUserId: login.data.user.id,
          paymentMethod: 'cash',
          subtotal: 100,
          taxAmount: 17,
          discountAmount: 0,
          finalAmount: 117,
          paidAmount: 200,
          returnAmount: 83,
          status: 'completed',
          lines: [
            {
              productId: PRODUCT_ID,
              quantity: 1,
              scale: 'piece',
              unitPrice: 100,
              taxAmount: 17,
              lineTotal: 117,
            },
          ],
        },
      },
    ],
  }

  const pushResult = await request('/api/sync/push', {
    method: 'POST',
    token,
    body: pushPayload,
  })
  console.log('   push result:', JSON.stringify(pushResult.data, null, 2))

  console.log('3. Idempotency re-push …')
  const pushAgain = await request('/api/sync/push', {
    method: 'POST',
    token,
    body: pushPayload,
  })
  const skipped = pushAgain.data?.events?.[0]?.skipped
  console.log('   skipped:', skipped)

  console.log('4. GET /api/sync/bootstrap …')
  const bootstrap = await request(`/api/sync/bootstrap?branchId=${branchId}`, { token })
  console.log(
    '   products:',
    bootstrap.data?.products?.length ?? 0,
    '| users:',
    bootstrap.data?.users?.length ?? 0,
  )

  console.log('Done. Verify sales + sale_items + inventory_ledger in DB for clientEventId:', CLIENT_EVENT_ID)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
