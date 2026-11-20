/**
 * REST API integration tests — run against a real Express app backed by an
 * in-memory SQLite database, so they exercise the same validation, status
 * codes and SQL constraints as production.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createApp } from './index.js'
import { openDatabase, seed, listVendors } from './db.js'
import { vendorHygiene } from '../src/lib/hygiene.js'

let db
let app
let base

/** JSON helper that also sends the demo auth header. */
async function call(path, { method = 'GET', body, user, headers = {} } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(user ? { 'x-chaatmap-user': user } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let parsed = null
  const text = await res.text()
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }
  return { status: res.status, body: parsed, headers: res.headers }
}

const validReview = {
  author: 'API Tester',
  stars: 5,
  water: 5,
  covered: 5,
  gloves: 4,
  surroundings: 4,
  comment: 'Spotless counter.',
}

beforeAll(async () => {
  db = openDatabase(':memory:')
  seed(db)
  app = createApp({ db })
  // Listen on an ephemeral port for genuine HTTP round-trips.
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  base = `http://127.0.0.1:${server.address().port}/api`
  afterAll(() => new Promise((r) => server.close(r)))
})

afterAll(() => {
  try {
    db.close()
  } catch {
    /* already closed */
  }
})

describe('GET /health', () => {
  it('returns 200 with a status and timestamp', async () => {
    const { status, body } = await call('/health')
    expect(status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.time).toBeTruthy()
  })

  it('echoes a request id header', async () => {
    const { headers } = await call('/health')
    expect(headers.get('x-request-id')).toBeTruthy()
  })

  it('honours a client-supplied request id', async () => {
    const { headers } = await call('/health', { headers: { 'x-request-id': 'trace-123' } })
    expect(headers.get('x-request-id')).toBe('trace-123')
  })

  it('rejects a malformed request id (injection guard)', async () => {
    const { headers } = await call('/health', { headers: { 'x-request-id': 'bad id!{}' } })
    expect(headers.get('x-request-id')).not.toBe('bad id!{}')
  })
})

describe('GET /stats', () => {
  it('reports aggregate counts from SQLite', async () => {
    const { status, body } = await call('/stats')
    expect(status).toBe(200)
    expect(body.vendors).toBe(8)
    expect(body.reviews).toBeGreaterThan(0)
    expect(typeof body.verified).toBe('number')
    expect(body.verified).toBeGreaterThanOrEqual(0)
    expect(body.verified).toBeLessThanOrEqual(body.vendors)
  })
})

describe('GET /vendors', () => {
  it('returns every vendor with computed scores', async () => {
    const { status, body } = await call('/vendors')
    expect(status).toBe(200)
    expect(body.count).toBe(8)
    expect(body.vendors).toHaveLength(8)
    for (const v of body.vendors) {
      expect(typeof v.hygieneScore === 'number' || v.hygieneScore === null).toBe(true)
      expect(v).toHaveProperty('reviews')
      expect(v).toHaveProperty('lat')
      expect(v).toHaveProperty('lng')
    }
  })

  it('filters by category', async () => {
    const { body } = await call('/vendors?category=dosa')
    expect(body.vendors.length).toBeGreaterThan(0)
    for (const v of body.vendors) expect(v.category).toBe('dosa')
  })

  it('filters by area', async () => {
    const { body } = await call('/vendors?area=Sindhi%20Colony')
    expect(body.vendors.length).toBeGreaterThan(0)
    for (const v of body.vendors) expect(v.area).toBe('Sindhi Colony')
  })

  it('filters by a search query across name, specialty and dishes', async () => {
    const { body } = await call('/vendors?q=pani%20pur')
    expect(body.vendors.length).toBeGreaterThan(0)
    for (const v of body.vendors) {
      const haystack = `${v.name} ${v.specialty} ${v.dishes.map((d) => d.name).join(' ')}`
      expect(haystack.toLowerCase()).toContain('pani pur')
    }
  })

  it('filters by minimum hygiene score', async () => {
    const { body } = await call('/vendors?minHygiene=4.7')
    for (const v of body.vendors) expect(v.hygieneScore).toBeGreaterThanOrEqual(4.7)
  })

  it('returns an empty list for a query that matches nothing', async () => {
    const { status, body } = await call('/vendors?q=zzzznotathing')
    expect(status).toBe(200)
    expect(body.count).toBe(0)
    expect(body.vendors).toEqual([])
  })

  it('ignores a non-numeric minHygiene instead of erroring', async () => {
    const { status, body } = await call('/vendors?minHygiene=abc')
    expect(status).toBe(200)
    expect(body.count).toBe(8)
  })

  it('scores returned by the API match the library exactly (no drift)', async () => {
    const { body } = await call('/vendors')
    const local = new Map(listVendors(db).map((v) => [v.id, vendorHygiene(v)]))
    for (const v of body.vendors) expect(v.hygieneScore).toBe(local.get(v.id))
  })
})

describe('GET /vendors/:id', () => {
  it('returns one vendor with its reviews', async () => {
    const { status, body } = await call('/vendors/mahalaxmi-chaat-center')
    expect(status).toBe(200)
    expect(body.id).toBe('mahalaxmi-chaat-center')
    expect(body.reviews.length).toBeGreaterThan(0)
    expect(typeof body.hygieneScore).toBe('number')
  })

  it('404s for an unknown id', async () => {
    const { status, body } = await call('/vendors/no-such-vendor')
    expect(status).toBe(404)
    expect(body.error).toBe('vendor_not_found')
  })

  it('422s for a malformed id (never reaches SQL)', async () => {
    const { status, body } = await call('/vendors/..%2F..%2Fetc%2Fpasswd')
    expect(status).toBe(422)
    expect(body.error).toBe('validation_failed')
    expect(body.errors.id).toBeTruthy()
  })

  it('422s for an id with a semicolon', async () => {
    const { status } = await call('/vendors/x%3BDROP%20TABLE%20vendors')
    expect(status).toBe(422)
  })
})

describe('POST /vendors/:id/reviews', () => {
  it('401s when unauthenticated', async () => {
    const { status, body } = await call('/vendors/mahalaxmi-chaat-center/reviews', {
      method: 'POST',
      body: validReview,
    })
    expect(status).toBe(401)
    expect(body.error).toBe('unauthenticated')
  })

  it('201s with the created review and hygiene delta when signed in', async () => {
    const { status, body } = await call('/vendors/mahalaxmi-chaat-center/reviews', {
      method: 'POST',
      body: validReview,
      user: 'tester@example.com',
    })
    expect(status).toBe(201)
    expect(body.review.author).toBe('API Tester')
    expect(body.review.id).toMatch(/^r/)
    expect(body.hygiene).toHaveProperty('before')
    expect(body.hygiene).toHaveProperty('after')
    expect(body.vendor.reviews.length).toBeGreaterThan(0)
  })

  it('actually recalculates the vendor score (before → after)', async () => {
    const before = (await call('/vendors/mahalaxmi-chaat-center')).body.hygieneScore
    // A deliberately terrible review must lower the average.
    await call('/vendors/mahalaxmi-chaat-center/reviews', {
      method: 'POST',
      body: { ...validReview, water: 0, covered: 0, gloves: 0, surroundings: 0, stars: 1 },
      user: 'tester@example.com',
    })
    const after = (await call('/vendors/mahalaxmi-chaat-center')).body.hygieneScore
    expect(after).toBeLessThan(before)
  })

  it('422s and lists every invalid field at once', async () => {
    const { status, body } = await call('/vendors/mahalaxmi-chaat-center/reviews', {
      method: 'POST',
      body: { author: 'A', stars: 9, water: null, covered: 5, gloves: 5, surroundings: 5 },
      user: 'tester@example.com',
    })
    expect(status).toBe(422)
    expect(body.error).toBe('validation_failed')
    expect(Object.keys(body.errors).sort()).toEqual(['author', 'stars', 'water'])
  })

  it('422s when a criterion is omitted entirely', async () => {
    const { comment, surroundings, ...partial } = validReview
    const { status, body } = await call('/vendors/mahalaxmi-chaat-center/reviews', {
      method: 'POST',
      body: partial,
      user: 'tester@example.com',
    })
    expect(status).toBe(422)
    expect(body.errors.surroundings).toBeTruthy()
  })

  it('404s for an unknown vendor', async () => {
    const { status } = await call('/vendors/ghost-vendor/reviews', {
      method: 'POST',
      body: validReview,
      user: 'tester@example.com',
    })
    expect(status).toBe(404)
  })

  it('accepts 0 as a rating (it is a valid low score, not "unset")', async () => {
    const { status } = await call('/vendors/mahalaxmi-chaat-center/reviews', {
      method: 'POST',
      body: { ...validReview, water: 0, covered: 0, gloves: 0, surroundings: 0 },
      user: 'tester@example.com',
    })
    expect(status).toBe(201)
  })

  it('rejects a comment over the length limit', async () => {
    const { status, body } = await call('/vendors/mahalaxmi-chaat-center/reviews', {
      method: 'POST',
      body: { ...validReview, comment: 'x'.repeat(600) },
      user: 'tester@example.com',
    })
    expect(status).toBe(422)
    expect(body.errors.comment).toBeTruthy()
  })

  it('strips control characters from the author name', async () => {
    const { status, body } = await call('/vendors/mahalaxmi-chaat-center/reviews', {
      method: 'POST',
      body: { ...validReview, author: 'Eve\u0007\u0000' },
      user: 'eve@example.com',
    })
    expect(status).toBe(201)
    expect(body.review.author).toBe('Eve')
  })

  it('ignores forged fields such as role or fssaiVerified', async () => {
    const { body } = await call('/vendors/mahalaxmi-chaat-center/reviews', {
      method: 'POST',
      body: { ...validReview, role: 'admin', fssaiVerified: true, id: 'forged-id' },
      user: 'tester@example.com',
    })
    expect(body.review.role).toBeUndefined()
    expect(body.review.fssaiVerified).toBeUndefined()
    expect(body.review.id).not.toBe('forged-id')
  })

  it('rejects malformed JSON with 400 (not a 500)', async () => {
    const res = await fetch(`${base}/vendors/mahalaxmi-chaat-center/reviews`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-chaatmap-user': 'a@b.com' },
      body: '{ not json',
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /reviews/:id', () => {
  it('401s without auth', async () => {
    const { status } = await call('/reviews/some-id', { method: 'DELETE' })
    expect(status).toBe(401)
  })

  it('403s for a non-admin user', async () => {
    const { status, body } = await call('/reviews/mahalaxmi-r1', {
      method: 'DELETE',
      user: 'regular@example.com',
    })
    expect(status).toBe(403)
    expect(body.error).toBe('forbidden')
  })

  it('404s for an unknown review id even for an admin', async () => {
    const { status } = await call('/reviews/nope-not-real', {
      method: 'DELETE',
      user: 'admin@chaatmap.in',
    })
    expect(status).toBe(404)
  })

  it('deletes for an admin and 204s, and the score updates', async () => {
    // Create one, then remove it again.
    const created = await call('/vendors/sri-sai-dosa-corner/reviews', {
      method: 'POST',
      body: { ...validReview, water: 0, covered: 0, gloves: 0, surroundings: 0, stars: 1 },
      user: 'admin@chaatmap.in',
    })
    expect(created.status).toBe(201)
    const id = created.body.review.id

    const { status } = await call(`/reviews/${id}`, {
      method: 'DELETE',
      user: 'admin@chaatmap.in',
    })
    expect(status).toBe(204)

    const after = await call('/vendors/sri-sai-dosa-corner')
    expect(after.body.reviews.some((r) => r.id === id)).toBe(false)
  })
})

describe('PATCH /vendors/:id/fssai', () => {
  it('401s without auth', async () => {
    const { status } = await call('/vendors/mahalaxmi-chaat-center/fssai', {
      method: 'PATCH',
      body: { verified: true },
    })
    expect(status).toBe(401)
  })

  it('403s for a non-admin — only admins can mint a badge', async () => {
    const { status } = await call('/vendors/mahalaxmi-chaat-center/fssai', {
      method: 'PATCH',
      body: { verified: true },
      user: 'someone@example.com',
    })
    expect(status).toBe(403)
  })

  it('422s when verified is not a boolean', async () => {
    const { status, body } = await call('/vendors/mahalaxmi-chaat-center/fssai', {
      method: 'PATCH',
      body: { verified: 'yes' },
      user: 'admin@chaatmap.in',
    })
    expect(status).toBe(422)
    expect(body.errors.verified).toBeTruthy()
  })

  it('404s for an unknown vendor', async () => {
    const { status } = await call('/vendors/ghost/fssai', {
      method: 'PATCH',
      body: { verified: true },
      user: 'admin@chaatmap.in',
    })
    expect(status).toBe(404)
  })

  it('toggles the flag on and back off (the only badge code path)', async () => {
    const id = 'hyderabad-mirchi-bajji' // seeded as unverified
    const on = await call(`/vendors/${id}/fssai`, {
      method: 'PATCH',
      body: { verified: true },
      user: 'admin@chaatmap.in',
    })
    expect(on.status).toBe(200)
    expect(on.body.fssaiVerified).toBe(true)
    expect((await call(`/vendors/${id}`)).body.fssaiVerified).toBe(true)

    const off = await call(`/vendors/${id}/fssai`, {
      method: 'PATCH',
      body: { verified: false },
      user: 'admin@chaatmap.in',
    })
    expect(off.body.fssaiVerified).toBe(false)
    expect((await call(`/vendors/${id}`)).body.fssaiVerified).toBe(false)
  })
})

describe('favorites', () => {
  it('starts empty, adds, then removes', async () => {
    const start = await call('/favorites')
    expect(start.status).toBe(200)
    expect(Array.isArray(start.body.favorites)).toBe(true)

    const added = await call('/favorites/pav-bhaji-house', { method: 'POST' })
    expect(added.status).toBe(201)
    expect(added.body.favorites).toContain('pav-bhaji-house')

    const removed = await call('/favorites/pav-bhaji-house', { method: 'DELETE' })
    expect(removed.status).toBe(200)
    expect(removed.body.favorites).not.toContain('pav-bhaji-house')
  })

  it('404s when favouriting an unknown vendor', async () => {
    const { status } = await call('/favorites/ghost-vendor', { method: 'POST' })
    expect(status).toBe(404)
  })

  it('422s for a malformed vendor id', async () => {
    const { status } = await call('/favorites/bad%20id!', { method: 'POST' })
    expect(status).toBe(422)
  })
})

describe('POST /plan (optimizer)', () => {
  it('returns a plan within budget', async () => {
    const { status, body } = await call('/plan', {
      method: 'POST',
      body: { budget: 300, maxStops: 3 },
    })
    expect(status).toBe(200)
    expect(body.totalCost).toBeLessThanOrEqual(300)
    expect(body.stops.length).toBeLessThanOrEqual(3)
    expect(body).toHaveProperty('distanceKm')
  })

  it('422s for a negative budget', async () => {
    const { status, body } = await call('/plan', { method: 'POST', body: { budget: -5 } })
    expect(status).toBe(422)
    expect(body.errors.budget).toBeTruthy()
  })

  it('422s for a non-integer stop count', async () => {
    const { status, body } = await call('/plan', {
      method: 'POST',
      body: { budget: 300, maxStops: 2.5 },
    })
    expect(status).toBe(422)
    expect(body.errors.maxStops).toBeTruthy()
  })

  it('422s when the budget is missing', async () => {
    const { status } = await call('/plan', { method: 'POST', body: {} })
    expect(status).toBe(422)
  })

  it('only returns stops that are real vendors with coordinates', async () => {
    const { body } = await call('/plan', { method: 'POST', body: { budget: 500 } })
    for (const s of body.stops) {
      expect(Number.isFinite(s.lat)).toBe(true)
      expect(Number.isFinite(s.lng)).toBe(true)
      expect(s).toHaveProperty('name')
    }
  })
})

describe('POST /routes/optimize', () => {
  it('returns a full permutation of the given stops', async () => {
    const stops = [
      { id: 'a', lat: 17.4, lng: 78.4 },
      { id: 'b', lat: 17.45, lng: 78.45 },
      { id: 'c', lat: 17.5, lng: 78.5 },
    ]
    const { status, body } = await call('/routes/optimize', {
      method: 'POST',
      body: { stops },
    })
    expect(status).toBe(200)
    expect(body.stops).toHaveLength(3)
    expect(body.order.sort()).toEqual([0, 1, 2])
    expect(body.distanceKm).toBeGreaterThan(0)
  })

  it('422s with fewer than two valid stops', async () => {
    const { status } = await call('/routes/optimize', {
      method: 'POST',
      body: { stops: [{ lat: 1, lng: 2 }] },
    })
    expect(status).toBe(422)
  })

  it('ignores stops with missing coordinates', async () => {
    const { body } = await call('/routes/optimize', {
      method: 'POST',
      body: {
        stops: [
          { id: 'ok1', lat: 17.4, lng: 78.4 },
          { id: 'bad', lat: null, lng: 'x' },
          { id: 'ok2', lat: 17.5, lng: 78.5 },
        ],
      },
    })
    expect(body.stops).toHaveLength(2)
    expect(body.stops.map((s) => s.id).sort()).toEqual(['ok1', 'ok2'])
  })
})

describe('routing & security', () => {
  it('404s an unknown API route', async () => {
    const { status, body } = await call('/nope')
    expect(status).toBe(404)
    expect(body.error).toBe('not_found')
  })

  it('does not advertise the framework (x-powered-by removed)', async () => {
    const res = await fetch(`${base}/health`)
    expect(res.headers.get('x-powered-by')).toBeNull()
  })

  it('rejects an oversized body with 413', async () => {
    const res = await fetch(`${base}/vendors/mahalaxmi-chaat-center/reviews`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-chaatmap-user': 'a@b.com' },
      body: JSON.stringify({ author: 'x'.repeat(2), comment: 'y'.repeat(64 * 1024) }),
    })
    expect(res.status).toBe(413)
  })

  it('derives admin from the header, never from the body', async () => {
    const { status } = await call('/reviews/anything', {
      method: 'DELETE',
      user: 'user@example.com',
      body: { role: 'admin' },
    })
    expect(status).toBe(403)
  })

  it('returns JSON errors for every failure shape', async () => {
    for (const path of ['/vendors/bad id', '/nope', '/vendors/ghost']) {
      const { headers } = await call(path)
      expect(headers.get('content-type')).toContain('application/json')
    }
  })
})
