import jwt from 'jsonwebtoken'

function accessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) throw new Error('Missing JWT_ACCESS_SECRET')
  return secret
}

function refreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('Missing JWT_REFRESH_SECRET')
  return secret
}

export function signAccessToken(payload) {
  return jwt.sign(payload, accessSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  })
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, refreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret())
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret())
}

export function signAuthTokens(user) {
  const payload = {
    sub: user.id,
    role: user.role,
    tenantId: user.tenantId,
    tenantSlug: user.tenantSlug || null,
    branchId: user.branchId || null,
  }

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  }
}
