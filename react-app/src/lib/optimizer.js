/**
 * Food-trail itinerary optimizer.
 *
 * Two complementary algorithms, both deterministic and side-effect free so
 * they can be unit-tested exhaustively and reused in the browser and the API:
 *
 *  1. `optimizeRoute`  — orders a set of stops into a short walking route.
 *     Greedy nearest-neighbour construction + 2-opt local search refinement
 *     (a classic TSP heuristic; optimal for the instance sizes we handle).
 *
 *  2. `planBudgetTrip` — picks the best subset of vendors under a rupee
 *     budget. Greedy value-per-rupee fill followed by randomized local
 *     search (swap in / swap out) to escape the greedy choice — the
 *     budget-constrained selection problem (knapsack variant).
 *
 * Distance is the haversine great-circle distance in kilometres.
 */

/* -------------------------------------------------------------- geometry */

const EARTH_RADIUS_KM = 6371
const toRad = (deg) => (deg * Math.PI) / 180

/**
 * Accepts either a `[lat, lng]` pair or a `{ lat, lng }` object and returns
 * a numeric pair. Anything unusable collapses to `[0, 0]` so a malformed
 * stop degrades into "far away" rather than throwing mid-route.
 */
function toLatLng(point) {
  const lat = Number(Array.isArray(point) ? point[0] : point?.lat)
  const lng = Number(Array.isArray(point) ? point[1] : point?.lng)
  return [Number.isFinite(lat) ? lat : 0, Number.isFinite(lng) ? lng : 0]
}

/**
 * Great-circle distance between two lat/lng points, in kilometres.
 * Handles identical points and antipodal-ish inputs without NaN.
 */
export function haversineKm(a, b) {
  const [lat1, lng1] = toLatLng(a)
  const [lat2, lng2] = toLatLng(b)
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const clamped = Math.min(1, Math.max(0, s))
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(clamped))
}

/** Distance matrix for a list of stops (symmetric, zero diagonal). */
export function distanceMatrix(points) {
  const n = points.length
  const m = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = haversineKm(points[i], points[j])
      m[i][j] = d
      m[j][i] = d
    }
  }
  return m
}

/* --------------------------------------------------------- route ordering */

/** Total travel distance of an ordering (open path, not a loop). */
export function routeLength(order, matrix) {
  let total = 0
  for (let i = 1; i < order.length; i++) total += matrix[order[i - 1]][order[i]]
  return total
}

/**
 * Greedy nearest-neighbour construction.
 * @param {number[][]} matrix symmetric distance matrix
 * @param {number} [start=0] index to start from
 * @returns {number[]} permutation visiting every node exactly once
 */
export function nearestNeighbour(matrix, start = 0) {
  const n = matrix.length
  if (n === 0) return []
  const s = Math.min(Math.max(0, start), n - 1)
  const unvisited = new Set(Array.from({ length: n }, (_, i) => i).filter((i) => i !== s))
  const order = [s]
  let current = s
  while (unvisited.size) {
    let best = -1
    let bestDist = Infinity
    for (const candidate of unvisited) {
      const d = matrix[current][candidate]
      // Strict < keeps ties deterministic (lowest index wins).
      if (d < bestDist) {
        bestDist = d
        best = candidate
      }
    }
    order.push(best)
    unvisited.delete(best)
    current = best
  }
  return order
}

/**
 * 2-opt improvement: repeatedly reverse any pair of segments whose swap
 * shortens the route, until no improving swap exists.
 * @param {number[]} order
 * @param {number[][]} matrix
 * @returns {{order: number[], length: number, improvements: number}}
 */
export function twoOpt(order, matrix) {
  if (order.length < 4) {
    return { order: [...order], length: routeLength(order, matrix), improvements: 0 }
  }
  const current = [...order]
  let improved = true
  let improvements = 0
  let guard = 0
  const maxPasses = 1000

  while (improved && guard++ < maxPasses) {
    improved = false
    for (let i = 0; i < current.length - 2; i++) {
      for (let k = i + 1; k < current.length - 1; k++) {
        const a = current[i]
        const b = current[i + 1]
        const c = current[k]
        const d = current[k + 1]
        const delta = matrix[a][c] + matrix[b][d] - matrix[a][b] - matrix[c][d]
        if (delta < -1e-12) {
          // Reverse the segment (i+1 ..k) — the canonical 2-opt move.
          let l = i + 1
          let r = k
          while (l < r) {
            const tmp = current[l]
            current[l] = current[r]
            current[r] = tmp
            l++
            r--
          }
          improved = true
          improvements++
        }
      }
    }
  }
  return { order: current, length: routeLength(current, matrix), improvements }
}

/**
 * Build the shortest practical order for a list of stops.
 *
 * @param {Array<{lat:number,lng:number,id?:string}>} stops
 * @param {object} [opts]
 * @param {number} [opts.startIndex=0] index of the first stop
 * @param {boolean} [opts.refine=true] run 2-opt after nearest-neighbour
 * @returns {{order:number[], stops:Array, distanceKm:number, improvements:number, algorithm:string}}
 */
export function optimizeRoute(stops, opts = {}) {
  const { startIndex = 0, refine = true } = opts
  const list = Array.isArray(stops) ? stops : []
  if (list.length === 0) {
    return { order: [], stops: [], distanceKm: 0, improvements: 0, algorithm: 'none' }
  }

  const matrix = distanceMatrix(list)
  const greedy = nearestNeighbour(matrix, startIndex)
  const greedyLength = routeLength(greedy, matrix)

  if (!refine || list.length < 3) {
    return {
      order: greedy,
      stops: greedy.map((i) => list[i]),
      distanceKm: round(greedyLength),
      improvements: 0,
      algorithm: 'nearest-neighbour',
    }
  }

  const refined = twoOpt(greedy, matrix)
  const used = refined.length < greedyLength - 1e-12 ? refined.order : greedy
  const usedLength = refined.length < greedyLength - 1e-12 ? refined.length : greedyLength

  return {
    order: used,
    stops: used.map((i) => list[i]),
    distanceKm: round(usedLength),
    improvements: refined.improvements,
    algorithm: 'nearest-neighbour+2-opt',
  }
}

/* ------------------------------------------------- budget-constrained pick */

/** Round to 2 decimals, tolerant of float noise. */
function round(x) {
  return Math.round(x * 100) / 100
}

/**
 * Score a vendor for itinerary selection: hygiene dominates (it is the
 * product's core promise), customer rating and open-now break ties, and
 * price penalises expensive stops so the budget stretches further.
 *
 * @returns {number} higher is better; always finite
 */
export function vendorValue(vendor, opts = {}) {
  const { hygieneWeight = 10, ratingWeight = 3, openBonus = 0.5, pricePenalty = 0.01 } = opts
  const hygiene = vendor?.hygieneScore ?? 0
  const rating = vendor?.rating ?? 0
  const price = vendor?.avgPrice ?? 0
  const open = vendor?.openNow ? openBonus : 0
  const raw = hygieneWeight * hygiene + ratingWeight * rating + open - pricePenalty * price
  return Number.isFinite(raw) ? raw : 0
}

/** Typical spend for a stop (midpoint of the price range). */
export function averagePrice(vendor) {
  const min = Number(vendor?.priceMin) || 0
  const max = Number(vendor?.priceMax) || min
  return (min + max) / 2
}

/** Normalise raw vendor objects into the shape the selector needs. */
function prepare(vendors) {
  return (Array.isArray(vendors) ? vendors : [])
    .filter((v) => v && Number.isFinite(Number(v.lat)) && Number.isFinite(Number(v.lng)))
    .map((v) => ({
      ...v,
      avgPrice: averagePrice(v),
      hygieneScore: Number(v.hygieneScore ?? 0),
      rating: Number(v.rating ?? 0),
    }))
}

/**
 * Greedy value-per-rupee fill, then randomized local search (swap in a
 * rejected stop for an included one when it improves total value without
 * blowing the budget).
 *
 * @param {Array} vendors candidate vendors (needs lat/lng; hygiene/rating optional)
 * @param {object} opts
 * @param {number} opts.budget total rupees available
 * @param {number} [opts.maxStops=5] cap on number of stops
 * @param {string} [opts.startId] optional vendor id the trip starts from
 * @param {number} [opts.iterations=200] local-search iterations
 * @param {() => number} [opts.random] injectable RNG (deterministic in tests)
 * @returns {{stops:Array, totalCost:number, remainingBudget:number, value:number, algorithm:string, iterations:number}}
 */
export function planBudgetTrip(vendors, opts = {}) {
  const {
    budget = 0,
    maxStops = 5,
    startId,
    iterations = 200,
    random = Math.random,
  } = opts

  const pool = prepare(vendors)
  if (pool.length === 0 || budget <= 0 || maxStops <= 0) {
    return {
      stops: [],
      totalCost: 0,
      remainingBudget: budget,
      value: 0,
      algorithm: 'none',
      iterations: 0,
    }
  }

  // Pin the start-of-trip vendor if requested (costs budget like any stop).
  let start = null
  let remainingPool = pool
  if (startId) {
    const idx = pool.findIndex((v) => v.id === startId)
    if (idx >= 0) {
      start = pool[idx]
      remainingPool = pool.filter((_, i) => i !== idx)
    }
  }

  const costOf = (v) => v.avgPrice
  const totalValue = (list) => list.reduce((s, v) => s + vendorValue(v), 0)
  const totalCost = (list) => list.reduce((s, v) => s + costOf(v), 0)

  // --- greedy: best value-per-rupee first, respecting both caps ---
  const chosen = []
  let spent = 0
  if (start && costOf(start) <= budget) {
    chosen.push(start)
    spent += costOf(start)
  }

  const ranked = [...remainingPool].sort((a, b) => {
    const va = vendorValue(a) / Math.max(1, costOf(a))
    const vb = vendorValue(b) / Math.max(1, costOf(b))
    if (vb !== va) return vb - va
    return String(a.id).localeCompare(String(b.id)) // deterministic tie-break
  })

  for (const v of ranked) {
    if (chosen.length >= maxStops) break
    const c = costOf(v)
    if (spent + c <= budget) {
      chosen.push(v)
      spent += c
    }
  }

  // --- local search: swap in/out to escape greedy choices ---
  const rejected = ranked.filter((v) => !chosen.includes(v))
  let current = chosen
  let currentCost = spent
  let currentVal = totalValue(current)
  let applied = 0

  for (let i = 0; i < iterations && rejected.length; i++) {
    const k = Math.floor(random() * rejected.length)
    const candidateIn = rejected[k]
    const inCost = costOf(candidateIn)

    // Try adding if there is room.
    if (current.length < maxStops && currentCost + inCost <= budget) {
      const next = [...current, candidateIn]
      const nextVal = totalValue(next)
      if (nextVal > currentVal + 1e-9) {
        current = next
        currentCost += inCost
        currentVal = nextVal
        rejected.splice(k, 1)
        applied++
        continue
      }
    }

    // Otherwise swap it against the least valuable included stop.
    if (current.length > (start ? 1 : 0)) {
      let worstIdx = -1
      let worstVal = Infinity
      current.forEach((v, idx) => {
        if (start && v.id === start.id) return
        const val = vendorValue(v)
        if (val < worstVal) {
          worstVal = val
          worstIdx = idx
        }
      })
      if (worstIdx >= 0) {
        const outgoing = current[worstIdx]
        const nextCost = currentCost - costOf(outgoing) + inCost
        if (nextCost <= budget) {
          const next = current.filter((_, idx) => idx !== worstIdx)
          next.push(candidateIn)
          const nextVal = totalValue(next)
          if (nextVal > currentVal + 1e-9) {
            current = next
            currentCost = nextCost
            currentVal = nextVal
            rejected[k] = outgoing
            applied++
          }
        }
      }
    }
  }

  const total = totalCost(current)
  return {
    stops: current,
    totalCost: Math.round(total * 100) / 100,
    remainingBudget: Math.round((budget - total) * 100) / 100,
    value: Math.round(currentVal * 100) / 100,
    algorithm: applied > 0 ? 'greedy+local-search' : 'greedy',
    iterations: applied,
  }
}

/**
 * Full "day plan": pick stops under budget, then order them by geography
 * starting from `startId` (or the nearest-to-centre stop).
 *
 * @returns {{stops:Array, totalCost:number, remainingBudget:number, value:number,
 *           distanceKm:number, algorithm:string, iterations:number, improvements:number}}
 */
export function planDay(vendors, opts = {}) {
  const picked = planBudgetTrip(vendors, opts)
  if (picked.stops.length === 0) {
    return { ...picked, distanceKm: 0, improvements: 0 }
  }
  const startId = opts.startId ?? picked.stops[0]?.id
  const startIndex = Math.max(0, picked.stops.findIndex((v) => v.id === startId))
  const route = optimizeRoute(picked.stops, { startIndex })
  return { ...picked, stops: route.stops, distanceKm: route.distanceKm, improvements: route.improvements }
}
