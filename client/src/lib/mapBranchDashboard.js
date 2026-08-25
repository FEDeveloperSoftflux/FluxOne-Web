import { BRANCH_DASHBOARD_DUMMY } from '@/data/branchDashboard'

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Keys where an empty array from the API is intentional (do not fall back to dummy). */
const EMPTY_ARRAY_OK = new Set(['staff'])

/** Deep-ish merge: arrays from API replace dummy when non-empty; staff empty list is kept. */
export function mergeBranchDashboard(apiData) {
  if (!isPlainObject(apiData)) return structuredClone(BRANCH_DASHBOARD_DUMMY)

  const base = structuredClone(BRANCH_DASHBOARD_DUMMY)
  const merged = { ...base }

  for (const key of Object.keys(apiData)) {
    const value = apiData[key]
    if (value == null) continue

    if (Array.isArray(value)) {
      if (value.length > 0 || EMPTY_ARRAY_OK.has(key)) {
        merged[key] = value
      }
      continue
    }

    if (isPlainObject(value) && isPlainObject(base[key])) {
      merged[key] = { ...base[key], ...value }
      continue
    }

    merged[key] = value
  }

  return merged
}

export function formatCurrency(amount, currency = 'PKR') {
  const n = Number(amount) || 0
  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `${currency} ${n.toLocaleString()}`
  }
}

export function formatPct(value) {
  const n = Number(value) || 0
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export function staffInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (parts[0] || 'U').slice(0, 2).toUpperCase()
}
