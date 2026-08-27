import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Pool } = pg

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('Missing required environment variable: DATABASE_URL')
}

export const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 120_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
})

let keepAliveTimer = null

function startPoolKeepAlive() {
  if (keepAliveTimer) return
  keepAliveTimer = setInterval(() => {
    pool.query('SELECT 1').catch(() => {
      // ignore — next real query will reconnect
    })
  }, 25_000)
  keepAliveTimer.unref?.()
}

// Prefer pool.query for one-shot reads/writes (avoids manual connect/release).
export async function query(text, params = []) {
  try {
    return await pool.query(text, params)
  } catch (error) {
    console.error('Query error:', error)
    throw error
  }
}

export async function testConnection() {
  try {
    await pool.query('SELECT 1')
    console.log('Database connection established successfully.')
    startPoolKeepAlive()
  } catch (error) {
    console.error('Database connection failed:', error.message)
    throw error
  }
}

export async function withTransaction(work) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    const summary =
      result && typeof result === 'object' && 'id' in result
        ? { id: result.id, name: result.name, status: result.status }
        : result
    console.log('Transaction successful:', summary)
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Transaction error:', error)
    throw error
  } finally {
    client.release()
  }
}

export function requireTenantId(tenantId) {
  if (!tenantId) {
    const error = new Error('tenant_id is required — refusing unscoped query')
    error.status = 403
    throw error
  }
  return tenantId
}

export async function tenantQuery(tenantId, text, params = []) {
  const scopedTenantId = requireTenantId(tenantId)
  return query(text, [scopedTenantId, ...params])
}

export async function tenantClientQuery(client, tenantId, text, params = []) {
  const scopedTenantId = requireTenantId(tenantId)
  return client.query(text, [scopedTenantId, ...params])
}
