/**
 * Route optimizer — greedy nearest-neighbour + 2-opt, and the
 * budget-constrained picker (greedy value-per-rupee + randomized local search).
 *
 * These tests prove algorithmic correctness: no invalid orderings, budgets
 * never exceeded, determinism under a seeded RNG, and 2-opt never makes a
 * route worse than its input.
 */
import { describe, it, expect } from 'vitest'
import {
  haversineKm,
  distanceMatrix,
  routeLength,
  nearestNeighbour,
  twoOpt,
  optimizeRoute,
  vendorValue,
  averagePrice,
  planBudgetTrip,
  planDay,
} from './optimizer.js'

/** Deterministic PRNG so local-search tests are reproducible (mulberry32). */
function rng(seed = 42) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A small grid of stops (Hyderabad-ish coordinates) for geometric tests.
const POINTS = [
  { id: 'a', lat: 17.4, lng: 78.3 },
  { id: 'b', lat: 17.45, lng: 78.35 },
  { id: 'c', lat: 17.5, lng: 78.4 },
  { id: 'd', lat: 17.35, lng: 78.45 },
  { id: 'e', lat: 17.48, lng: 78.48 },
]

describe('haversineKm', () => {
  it('is zero for identical points', () => {
    expect(haversineKm([17.4, 78.4], [17.4, 78.4])).toBe(0)
  })

  it('is symmetric', () => {
    const a = [17.4, 78.4]
    const b = [17.5, 78.5]
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10)
  })

  it('matches a known distance (1° latitude ≈ 111.19 km)', () => {
    expect(haversineKm([0, 0], [1, 0])).toBeCloseTo(111.19, 1)
  })

  it('computes a plausible city-scale distance', () => {
    const d = haversineKm([17.3616, 78.4747], [17.4435, 78.3772]) // Charminar → Madhapur
    expect(d).toBeGreaterThan(8)
    expect(d).toBeLessThan(20)
  })

  it('never returns NaN or a negative distance for extreme inputs', () => {
    const cases = [
      [[0, 0], [0, 180]],
      [[90, 0], [-90, 0]],
      [[-90, -180], [90, 180]],
      [[17, 78], [17, 78]],
    ]
    for (const [p, q] of cases) {
      const d = haversineKm(p, q)
      expect(Number.isNaN(d)).toBe(false)
      expect(d).toBeGreaterThanOrEqual(0)
      expect(Number.isFinite(d)).toBe(true)
    }
  })

  it('clamps floating-point overshoot in the haversine formula', () => {
    // s can exceed 1 by ~1e-16 for near-antipodal points; sqrt must not NaN.
    const d = haversineKm([0, 0], [0.0000001, 180])
    expect(Number.isFinite(d)).toBe(true)
  })
})

describe('distanceMatrix', () => {
  it('is square, symmetric with a zero diagonal', () => {
    const m = distanceMatrix(POINTS)
    expect(m).toHaveLength(POINTS.length)
    for (let i = 0; i < m.length; i++) {
      expect(m[i]).toHaveLength(POINTS.length)
      expect(m[i][i]).toBe(0)
      for (let j = 0; j < m.length; j++) expect(m[i][j]).toBeCloseTo(m[j][i], 10)
    }
  })

  it('handles a single point and an empty list', () => {
    expect(distanceMatrix([POINTS[0]])).toEqual([[0]])
    expect(distanceMatrix([])).toEqual([])
  })
})

describe('nearestNeighbour', () => {
  it('visits every node exactly once', () => {
    const m = distanceMatrix(POINTS)
    const order = nearestNeighbour(m, 0)
    expect(order).toHaveLength(POINTS.length)
    expect(new Set(order).size).toBe(POINTS.length)
    expect([...order].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4])
  })

  it('starts at the requested index', () => {
    const m = distanceMatrix(POINTS)
    expect(nearestNeighbour(m, 3)[0]).toBe(3)
  })

  it('clamps an out-of-range start index instead of throwing', () => {
    const m = distanceMatrix(POINTS)
    expect(nearestNeighbour(m, 99)[0]).toBe(4)
    expect(nearestNeighbour(m, -5)[0]).toBe(0)
  })

  it('picks the nearest unvisited neighbour at each step', () => {
    // Points on a line: from index 0 the nearest is 1, then 2, etc.
    const line = [
      { lat: 17.0, lng: 78.0 },
      { lat: 17.01, lng: 78.0 },
      { lat: 17.05, lng: 78.0 },
      { lat: 17.02, lng: 78.0 },
    ]
    const order = nearestNeighbour(distanceMatrix(line), 0)
    expect(order).toEqual([0, 1, 3, 2])
  })

  it('is deterministic when distances tie (lowest index wins)', () => {
    const square = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 0 },
      { lat: 1, lng: 1 },
    ]
    const m = distanceMatrix(square)
    expect(nearestNeighbour(m, 0)).toEqual(nearestNeighbour(m, 0))
  })

  it('returns [] for an empty matrix', () => {
    expect(nearestNeighbour([], 0)).toEqual([])
  })
})

describe('twoOpt', () => {
  const m = distanceMatrix(POINTS)

  it('never returns a longer route than it was given', () => {
    const greedy = nearestNeighbour(m, 0)
    const before = routeLength(greedy, m)
    const { length } = twoOpt(greedy, m)
    expect(length).toBeLessThanOrEqual(before + 1e-9)
  })

  it('produces a valid permutation (all indices exactly once)', () => {
    const { order } = twoOpt(nearestNeighbour(m, 0), m)
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4])
  })

  it('is idempotent — a second pass changes nothing', () => {
    const first = twoOpt(nearestNeighbour(m, 0), m)
    const second = twoOpt(first.order, m)
    expect(second.length).toBeCloseTo(first.length, 10)
    expect(second.improvements).toBe(0)
  })

  it('leaves routes shorter than 4 nodes untouched (2-opt needs i<k+1)', () => {
    const small = distanceMatrix(POINTS.slice(0, 3))
    const order = [0, 2, 1]
    const r = twoOpt(order, small)
    expect(r.order).toEqual(order)
    expect(r.improvements).toBe(0)
  })

  it('improves an ordering with a crossing (the canonical 2-opt move)', () => {
    // Four stops on a line, visited in a self-crossing order: 0-2-1-3.
    // 2-opt must detect that swapping segment (0-2 | 1-3) removes the
    // crossing and shortens the route (0-1-2-3).
    const line = [
      { lat: 17.0, lng: 78.0 },
      { lat: 17.01, lng: 78.0 },
      { lat: 17.1, lng: 78.0 },
      { lat: 17.11, lng: 78.0 },
    ]
    const lm = distanceMatrix(line)
    const crossed = [0, 2, 1, 3]
    const before = routeLength(crossed, lm)
    const { order, length, improvements } = twoOpt(crossed, lm)
    expect(improvements).toBeGreaterThan(0)
    expect(length).toBeLessThan(before - 1e-9)
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3])
  })

  it('always returns a finite, non-negative length', () => {
    const r = twoOpt(nearestNeighbour(m, 2), m)
    expect(Number.isFinite(r.length)).toBe(true)
    expect(r.length).toBeGreaterThanOrEqual(0)
  })
})

describe('optimizeRoute', () => {
  it('handles the empty case gracefully', () => {
    expect(optimizeRoute([])).toMatchObject({ stops: [], distanceKm: 0, algorithm: 'none' })
  })

  it('handles a single stop with zero distance', () => {
    const r = optimizeRoute([POINTS[0]])
    expect(r.stops).toHaveLength(1)
    expect(r.distanceKm).toBe(0)
  })

  it('returns every input stop exactly once', () => {
    const r = optimizeRoute(POINTS)
    expect(r.stops).toHaveLength(POINTS.length)
    expect(new Set(r.stops.map((s) => s.id)).size).toBe(POINTS.length)
  })

  it('records which algorithm ran', () => {
    expect(optimizeRoute(POINTS, { refine: false }).algorithm).toBe('nearest-neighbour')
    expect(optimizeRoute(POINTS).algorithm).toBe('nearest-neighbour+2-opt')
    expect(optimizeRoute(POINTS.slice(0, 2)).algorithm).toBe('nearest-neighbour')
  })

  it('respects the requested start index', () => {
    const r = optimizeRoute(POINTS, { startIndex: 3 })
    expect(r.stops[0].id).toBe(POINTS[3].id)
  })

  it('reports a distance no worse than the unrefined greedy route', () => {
    const greedy = optimizeRoute(POINTS, { refine: false }).distanceKm
    const refined = optimizeRoute(POINTS).distanceKm
    expect(refined).toBeLessThanOrEqual(greedy)
  })

  it('rounds distance to 2 decimals (no float noise in the UI)', () => {
    const r = optimizeRoute(POINTS)
    expect(r.distanceKm).toBe(Math.round(r.distanceKm * 100) / 100)
  })

  it('is deterministic — same input, identical output', () => {
    const a = optimizeRoute(POINTS)
    const b = optimizeRoute(POINTS)
    expect(a.stops.map((s) => s.id)).toEqual(b.stops.map((s) => s.id))
    expect(a.distanceKm).toBe(b.distanceKm)
  })

  it('does not mutate the input array', () => {
    const input = [...POINTS]
    optimizeRoute(input)
    expect(input.map((p) => p.id)).toEqual(POINTS.map((p) => p.id))
  })

  it('tolerates malformed entries without throwing', () => {
    const r = optimizeRoute([{ id: 'x' }, { id: 'y' }, null, { id: 'z' }])
    expect(Number.isFinite(r.distanceKm)).toBe(true)
  })
})

describe('vendorValue / averagePrice', () => {
  it('prices a vendor as the midpoint of its range', () => {
    expect(averagePrice({ priceMin: 20, priceMax: 60 })).toBe(40)
    expect(averagePrice({ priceMin: 50, priceMax: 50 })).toBe(50)
    expect(averagePrice({})).toBe(0)
    expect(averagePrice(null)).toBe(0)
  })

  it('rewards hygiene above all else', () => {
    const clean = vendorValue({ hygieneScore: 5, rating: 3, avgPrice: 100 })
    const dirty = vendorValue({ hygieneScore: 2, rating: 5, avgPrice: 100 })
    expect(clean).toBeGreaterThan(dirty)
  })

  it('penalises higher prices (budget should stretch further)', () => {
    const cheap = vendorValue({ hygieneScore: 4, rating: 4, avgPrice: 30 })
    const pricey = vendorValue({ hygieneScore: 4, rating: 4, avgPrice: 90 })
    expect(cheap).toBeGreaterThan(pricey)
  })

  it('gives a small bonus to vendors that are open', () => {
    const open = vendorValue({ hygieneScore: 4, rating: 4, avgPrice: 50, openNow: true })
    const shut = vendorValue({ hygieneScore: 4, rating: 4, avgPrice: 50, openNow: false })
    expect(open).toBeGreaterThan(shut)
  })

  it('always returns a finite number, even for garbage input', () => {
    expect(Number.isFinite(vendorValue(null))).toBe(true)
    expect(Number.isFinite(vendorValue({}))).toBe(true)
    expect(Number.isFinite(vendorValue({ hygieneScore: NaN }))).toBe(true)
  })
})

describe('planBudgetTrip', () => {
  const vendors = [
    { id: 'v1', lat: 17.4, lng: 78.4, priceMin: 40, priceMax: 60, hygieneScore: 5, rating: 4.8, openNow: true },
    { id: 'v2', lat: 17.41, lng: 78.41, priceMin: 20, priceMax: 40, hygieneScore: 4.5, rating: 4.5, openNow: true },
    { id: 'v3', lat: 17.42, lng: 78.42, priceMin: 80, priceMax: 120, hygieneScore: 4.9, rating: 4.7, openNow: false },
    { id: 'v4', lat: 17.43, lng: 78.43, priceMin: 30, priceMax: 50, hygieneScore: 4.4, rating: 4.4, openNow: true },
    { id: 'v5', lat: 17.44, lng: 78.44, priceMin: 50, priceMax: 70, hygieneScore: 4.6, rating: 4.6, openNow: true },
    { id: 'v6', lat: 17.45, lng: 78.45, priceMin: 10, priceMax: 20, hygieneScore: 4.7, rating: 4.6, openNow: true },
  ]

  it('never exceeds the budget', () => {
    for (const budget of [50, 100, 200, 300, 500]) {
      const r = planBudgetTrip(vendors, { budget, random: rng(1) })
      expect(r.totalCost).toBeLessThanOrEqual(budget)
      expect(r.remainingBudget).toBeGreaterThanOrEqual(0)
      // remainingBudget must reconcile with totalCost
      expect(r.remainingBudget).toBeCloseTo(budget - r.totalCost, 6)
    }
  })

  it('never exceeds maxStops', () => {
    for (const maxStops of [1, 2, 3]) {
      const r = planBudgetTrip(vendors, { budget: 1000, maxStops, random: rng(2) })
      expect(r.stops.length).toBeLessThanOrEqual(maxStops)
    }
  })

  it('returns no stops when the budget cannot afford anything', () => {
    const r = planBudgetTrip(vendors, { budget: 0 })
    expect(r.stops).toEqual([])
    expect(r.totalCost).toBe(0)
    expect(r.algorithm).toBe('none')
  })

  it('returns no stops for an empty candidate pool', () => {
    expect(planBudgetTrip([], { budget: 500 }).stops).toEqual([])
    expect(planBudgetTrip(null, { budget: 500 }).stops).toEqual([])
    expect(planBudgetTrip(undefined, { budget: 500 }).stops).toEqual([])
  })

  it('returns no stops when maxStops is 0 or negative', () => {
    expect(planBudgetTrip(vendors, { budget: 500, maxStops: 0 }).stops).toEqual([])
    expect(planBudgetTrip(vendors, { budget: 500, maxStops: -3 }).stops).toEqual([])
  })

  it('produces unique stops (no vendor twice)', () => {
    const r = planBudgetTrip(vendors, { budget: 1000, maxStops: 6, random: rng(3) })
    const ids = r.stops.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only selects vendors that exist in the input', () => {
    const r = planBudgetTrip(vendors, { budget: 400, random: rng(4) })
    const known = new Set(vendors.map((v) => v.id))
    for (const s of r.stops) expect(known.has(s.id)).toBe(true)
  })

  it('picks something when the budget is generous', () => {
    const r = planBudgetTrip(vendors, { budget: 1000, maxStops: 5, random: rng(5) })
    expect(r.stops.length).toBeGreaterThan(0)
    expect(r.totalCost).toBeGreaterThan(0)
  })

  it('prefers the cheapest viable stop when the budget is very tight', () => {
    // Cheapest vendor is v6 (avg 15).
    const r = planBudgetTrip(vendors, { budget: 20, maxStops: 1, random: rng(6) })
    expect(r.stops).toHaveLength(1)
    expect(r.stops[0].id).toBe('v6')
  })

  it('honours startId by including it as the first stop', () => {
    const r = planBudgetTrip(vendors, { budget: 1000, maxStops: 5, startId: 'v4', random: rng(7) })
    expect(r.stops[0].id).toBe('v4')
    expect(r.stops).toHaveLength(5)
  })

  it('is deterministic under the same seeded RNG', () => {
    const a = planBudgetTrip(vendors, { budget: 300, random: rng(99) })
    const b = planBudgetTrip(vendors, { budget: 300, random: rng(99) })
    expect(a.stops.map((s) => s.id)).toEqual(b.stops.map((s) => s.id))
    expect(a.totalCost).toBe(b.totalCost)
  })

  it('reports the algorithm actually used', () => {
    expect(['greedy', 'greedy+local-search']).toContain(
      planBudgetTrip(vendors, { budget: 300, random: rng(8) }).algorithm,
    )
  })

  it('never returns NaN in any numeric field', () => {
    const r = planBudgetTrip(vendors, { budget: 250, maxStops: 4, random: rng(9) })
    expect(Number.isNaN(r.totalCost)).toBe(false)
    expect(Number.isNaN(r.remainingBudget)).toBe(false)
    expect(Number.isNaN(r.value)).toBe(false)
  })

  it('skips vendors without usable coordinates instead of throwing', () => {
    const broken = [...vendors, { id: 'bad', lat: null, lng: 'x' }]
    const r = planBudgetTrip(broken, { budget: 500, random: rng(10) })
    expect(r.stops.every((s) => s.id !== 'bad')).toBe(true)
  })

  it('ignores a startId that does not exist (still plans a trip)', () => {
    const r = planBudgetTrip(vendors, { budget: 500, startId: 'ghost', random: rng(11) })
    expect(r.stops.length).toBeGreaterThan(0)
  })
})

describe('planDay', () => {
  const vendors = [
    { id: 'v1', lat: 17.4, lng: 78.4, priceMin: 40, priceMax: 60, hygieneScore: 5, rating: 4.8, openNow: true },
    { id: 'v2', lat: 17.41, lng: 78.41, priceMin: 20, priceMax: 40, hygieneScore: 4.5, rating: 4.5, openNow: true },
    { id: 'v3', lat: 17.42, lng: 78.42, priceMin: 80, priceMax: 120, hygieneScore: 4.9, rating: 4.7, openNow: false },
    { id: 'v4', lat: 17.43, lng: 78.43, priceMin: 30, priceMax: 50, hygieneScore: 4.4, rating: 4.4, openNow: true },
    { id: 'v5', lat: 17.44, lng: 78.44, priceMin: 50, priceMax: 70, hygieneScore: 4.6, rating: 4.6, openNow: true },
  ]

  it('respects the budget and stop cap', () => {
    const r = planDay(vendors, { budget: 200, maxStops: 3, random: rng(12) })
    expect(r.totalCost).toBeLessThanOrEqual(200)
    expect(r.stops.length).toBeLessThanOrEqual(3)
  })

  it('returns a finite travel distance', () => {
    const r = planDay(vendors, { budget: 500, maxStops: 4, random: rng(13) })
    expect(Number.isFinite(r.distanceKm)).toBe(true)
    expect(r.distanceKm).toBeGreaterThanOrEqual(0)
  })

  it('starts the route at startId when provided', () => {
    const r = planDay(vendors, { budget: 500, maxStops: 4, startId: 'v3', random: rng(14) })
    if (r.stops.length > 0) expect(r.stops[0].id).toBe('v3')
  })

  it('returns nothing when the budget is zero', () => {
    const r = planDay(vendors, { budget: 0 })
    expect(r.stops).toEqual([])
    expect(r.distanceKm).toBe(0)
  })
})
