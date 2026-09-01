/**
 * Admin Authentication Configuration (Frontend-Only for Testing Phase 1)
 *
 * Dummy credentials for the Admin (B2B Owner) Dashboard.
 * These credentials allow logging in as the B2B Owner / Enterprise Admin
 * without requiring any backend modifications.
 */

export const ADMIN_CREDENTIALS = {
  id: 'admin@fluxone.b2b',
  email: 'admin@fluxone.b2b',
  password: 'password123',
  name: 'Asad Naqvi (B2B Owner)',
  role: 'b2b_owner',
  tenantName: 'FluxOne Enterprise Solutions (All Branches)',
  tenantSlug: 'fluxone-enterprise',
  branchName: 'Global Enterprise HQ',
}

const STORAGE_KEY = 'fluxone_admin_session'

export function getAdminSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isAdminLoggedIn() {
  const session = getAdminSession()
  return Boolean(session && session.role === ADMIN_CREDENTIALS.role)
}

export function setAdminSession(user = ADMIN_CREDENTIALS) {
  try {
    const session = {
      ...user,
      loggedInAt: new Date().toISOString(),
      token: 'mock-admin-token-' + Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    return session
  } catch {
    return null
  }
}

export function clearAdminSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function validateAdminLogin(id, password) {
  const normalizedId = String(id || '').trim().toLowerCase()
  const expectedId = ADMIN_CREDENTIALS.id.toLowerCase()
  const expectedAltEmail = 'owner@fluxone.b2b'

  if (
    (normalizedId === expectedId || normalizedId === expectedAltEmail) &&
    (password === ADMIN_CREDENTIALS.password || password === 'password')
  ) {
    return {
      success: true,
      user: ADMIN_CREDENTIALS,
    }
  }

  return {
    success: false,
    error: 'Invalid Admin credentials. Use admin@fluxone.b2b / password123',
  }
}
