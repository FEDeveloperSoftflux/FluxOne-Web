import path from 'path'

/** Cloudinary / remote URL as stored in DB. */
export function isAbsoluteImageUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

/**
 * Normalize stored image paths for clients (IM web, POS offline sync).
 * - Cloudinary URLs pass through
 * - Relative /uploads/ paths pass through
 * - Local multer disk paths → /uploads/<filename>
 */
export function normalizeImageUrl(value) {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (isAbsoluteImageUrl(trimmed)) return trimmed
  if (trimmed.startsWith('/uploads/')) return trimmed
  const base = path.basename(trimmed.replace(/\\/g, '/'))
  return base ? `/uploads/${base}` : null
}

/**
 * Resolve a multer file to a storable public URL.
 * Prefer Cloudinary secure_url; local disk → /uploads/<filename>.
 */
export function resolveUploadUrl(file, req) {
  if (!file) return null
  if (file.secure_url) return file.secure_url
  if (file.url && isAbsoluteImageUrl(file.url)) return file.url

  const filename = file.filename || (file.path ? path.basename(file.path) : null)
  if (!filename) return null

  if (req?.get?.('host')) {
    const protocol = req.protocol || 'http'
    return `${protocol}://${req.get('host')}/uploads/${filename}`
  }

  return `/uploads/${filename}`
}
