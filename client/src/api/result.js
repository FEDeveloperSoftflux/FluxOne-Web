export const ok = (data) => ({ success: true, data })
export const fail = (error) => ({ success: false, error: String(error || 'Request failed') })

export function unwrap(result) {
  if (!result?.success) {
    throw new Error(result?.error || 'Request failed')
  }
  return result.data
}
