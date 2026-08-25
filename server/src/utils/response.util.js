export function success(res, data = null, httpStatus = 200) {
  return res.status(httpStatus).json({ success: true, data, error: null })
}

export function error(res, message = 'Request failed', httpStatus = 400) {
  return res.status(httpStatus).json({ success: false, data: null, error: message })
}

export const fail = error

export function notImplemented(_req, res) {
  return error(res, 'Not implemented', 501)
}
