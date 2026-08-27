// Shared helper — normalize RTK thunk results for hooks / UI
export function asResult(promise) {
  return promise
    .then((data) => {
      if (data && typeof data === 'object' && 'success' in data) return data
      return { success: true, data }
    })
    .catch((err) => ({
      success: false,
      error: typeof err === 'string' ? err : err?.message || 'Request failed',
    }))
}

// Rebuild Map for UI code that calls childrenByParent.get(...)
export function catalogForUi(catalog) {
  if (!catalog) {
    return {
      parents: [],
      childrenByParent: new Map(),
      all: [],
      taxes: [],
      offers: [],
    }
  }
  const raw = catalog.childrenByParent
  const childrenByParent =
    raw instanceof Map ? raw : new Map(Object.entries(raw || {}))
  return {
    parents: catalog.parents || [],
    childrenByParent,
    all: catalog.all || [],
    taxes: catalog.taxes || [],
    offers: catalog.offers || [],
  }
}
