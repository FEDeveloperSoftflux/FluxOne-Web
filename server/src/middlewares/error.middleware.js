import { error } from '../utils/response.util.js'

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export function errorMiddleware(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500
  const isProd = process.env.NODE_ENV === 'production'
  const message = status >= 500 && isProd ? 'Internal server error' : err.message || 'Internal server error'

  if (status >= 500) {
    console.error(err)
  }

  return error(res, message, status)
}

export function notFoundMiddleware(req, res) {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404)
}
