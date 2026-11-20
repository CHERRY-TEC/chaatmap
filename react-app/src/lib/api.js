/**
 * API client — the browser's single place that talks to the ChaatMap REST
 * API (server/index.js).
 *
 * Graceful degradation is deliberate:
 *   1. probe /api/health once on boot
 *   2. if the API answers  → every read/write goes to SQLite via the API
 *   3. if it does not      → fall back to localStorage (file://, static hosts)
 *
 * The caller sees one interface either way, and `mode` reports which path
 * is active so the UI can show it honestly.
 */

const BASE = import.meta.env?.VITE_API_URL ?? '/api'
const USER_KEY = 'chaatmap.user'

/** Thrown for non-2xx responses; carries status + parsed body. */
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message ?? body?.error ?? `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.errors = body?.errors ?? null
  }
}

/** The email used to derive the server-side role (demo auth). */
export function currentUserEmail() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')?.email ?? null
  } catch {
    return null
  }
}

export function setCurrentUserEmail(email) {
  try {
    if (email) localStorage.setItem(USER_KEY, JSON.stringify({ email }))
    else localStorage.removeItem(USER_KEY)
  } catch {
    /* storage unavailable — auth simply will not persist */
  }
}

/**
 * Low-level fetch with JSON handling, request id and auth headers.
 * @param {string} path e.g. '/vendors'
 * @param {object} [init]
 */
export async function request(path, init = {}) {
  const headers = { ...(init.headers ?? {}) }
  if (init.body !== undefined && !headers['content-type']) {
    headers['content-type'] = 'application/json'
  }
  const email = currentUserEmail()
  if (email) headers['x-chaatmap-user'] = email
  headers['x-request-id'] = crypto.randomUUID?.() ?? String(Date.now())

  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (res.status === 204) return null

  let body = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = { message: text.slice(0, 200) }
    }
  }

  if (!res.ok) throw new ApiError(res.status, body)
  return body
}

/* ---------------------------------------------------------- health/mode */

let modePromise = null

/**
 * Probe the API once and remember the result.
 * @returns {Promise<'api'|'local'>}
 */
export function detectMode() {
  if (modePromise) return modePromise
  modePromise = (async () => {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 2500)
      const res = await fetch(`${BASE}/health`, { signal: ctrl.signal })
      clearTimeout(t)
      return res.ok ? 'api' : 'local'
    } catch {
      return 'local'
    }
  })()
  return modePromise
}

/** Reset the cached probe (tests). */
export function resetMode() {
  modePromise = null
}

/* ------------------------------------------------------------- resources */

export const api = {
  /** @returns {Promise<{count:number, vendors:Array}>} */
  listVendors: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString()
    return request(`/vendors${qs ? `?${qs}` : ''}`)
  },

  getVendor: (id) => request(`/vendors/${encodeURIComponent(id)}`),

  /** @returns {Promise<{review:object, vendor:object, hygiene:object}>} */
  createReview: (vendorId, payload) =>
    request(`/vendors/${encodeURIComponent(vendorId)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteReview: (reviewId) =>
    request(`/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' }),

  setFssai: (vendorId, verified) =>
    request(`/vendors/${encodeURIComponent(vendorId)}/fssai`, {
      method: 'PATCH',
      body: JSON.stringify({ verified }),
    }),

  listFavorites: () => request('/favorites'),
  addFavorite: (id) =>
    request(`/favorites/${encodeURIComponent(id)}`, { method: 'POST' }),
  removeFavorite: (id) =>
    request(`/favorites/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  stats: () => request('/stats'),

  /** Budget-constrained itinerary from the server-side optimizer. */
  planTrip: (payload) =>
    request('/plan', { method: 'POST', body: JSON.stringify(payload) }),

  optimizeRoute: (stops, startIndex = 0) =>
    request('/routes/optimize', {
      method: 'POST',
      body: JSON.stringify({ stops, startIndex }),
    }),
}
