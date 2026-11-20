/**
 * Hygiene scoring — the product's core calculation.
 * Score = (0.40 × Water) + (0.25 × Covered) + (0.20 × Gloves) + (0.15 × Surroundings)
 *
 * These tests are the proof that every displayed number is derived, never
 * hardcoded, and that floating-point noise never leaks into the UI.
 */
import { describe, it, expect } from 'vitest'
import {
  WEIGHTS,
  CRITERIA,
  round1,
  weightedScore,
  factorAverage,
  vendorHygiene,
  factorBreakdown,
  vendorRating,
} from './hygiene.js'
import { VENDORS } from '../data/vendors.js'

describe('weighted formula', () => {
  it('uses the exact weights from the specification', () => {
    expect(WEIGHTS).toEqual({ water: 0.4, covered: 0.25, gloves: 0.2, surroundings: 0.15 })
  })

  it('weights sum to exactly 1 (no score inflation or deflation)', () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1, 10)
  })

  it('documents all four criteria with the right weights', () => {
    expect(CRITERIA).toHaveLength(4)
    expect(CRITERIA.map((c) => c.key)).toEqual(['water', 'covered', 'gloves', 'surroundings'])
    expect(CRITERIA.map((c) => c.weight)).toEqual(['40%', '25%', '20%', '15'])
  })

  it('computes the all-perfect case as 5.0', () => {
    expect(weightedScore({ water: 5, covered: 5, gloves: 5, surroundings: 5 })).toBe(5)
  })

  it('computes the all-zero case as 0', () => {
    expect(weightedScore({ water: 0, covered: 0, gloves: 0, surroundings: 0 })).toBe(0)
  })

  it.each([
    // [water, covered, gloves, surroundings, expected]
    [5, 5, 5, 5, 5.0],
    [5, 5, 5, 4, 4.85],
    [5, 5, 4, 4, 4.65],
    [4, 5, 5, 5, 4.6],
    [5, 5, 4, 3, 4.5],
    [5, 4, 4, 4, 4.4],
    [0, 5, 5, 5, 3.0],
    [5, 0, 0, 0, 2.0],
    [3, 3, 3, 3, 3.0],
    [2, 4, 3, 5, 3.15],
    [1, 1, 1, 1, 1.0],
    [0, 0, 0, 5, 0.75],
  ])('(%i, %i, %i, %i) → %d', (w, c, g, s, expected) => {
    expect(weightedScore({ water: w, covered: c, gloves: g, surroundings: s })).toBeCloseTo(
      expected,
      10,
    )
  })

  it('weights water most heavily (a 1-point water change moves the score most)', () => {
    const base = { water: 3, covered: 3, gloves: 3, surroundings: 3 }
    const bump = (key) => weightedScore({ ...base, [key]: base[key] + 1 }) - weightedScore(base)
    expect(bump('water')).toBeGreaterThan(bump('covered'))
    expect(bump('covered')).toBeGreaterThan(bump('gloves'))
    expect(bump('gloves')).toBeGreaterThan(bump('surroundings'))
  })

  it('treats missing/non-numeric criteria as 0 instead of NaN', () => {
    expect(weightedScore({})).toBe(0)
    expect(weightedScore({ water: null, covered: 'x', gloves: undefined })).toBe(0)
    expect(Number.isFinite(weightedScore({ water: '4', covered: 4, gloves: 4, surroundings: 4 }))).toBe(true)
  })

  it('accepts numeric strings (form inputs submit strings)', () => {
    const a = weightedScore({ water: 5, covered: 5, gloves: 5, surroundings: 5 })
    const b = weightedScore({ water: '5', covered: '5', gloves: '5', surroundings: '5' })
    expect(b).toBe(a)
  })
})

describe('round1', () => {
  it('rounds to one decimal', () => {
    expect(round1(4.74)).toBe(4.7)
    expect(round1(4.75)).toBe(4.8)
    expect(round1(4.85)).toBe(4.9) // the classic .5 case must round up
  })

  it('tolerates floating-point noise (0.1 + 0.2 style errors)', () => {
    expect(round1(0.30000000000000004)).toBe(0.3)
    // 4.65 is stored as 4.6499999999999995 — the epsilon keeps it rounding up.
    expect(round1(4.6499999999999995)).toBe(4.7)
    expect(round1(1.0000000000000002)).toBe(1)
    expect(round1(2.675)).toBe(2.7) // stored as 2.67499999999999982
  })

  it('leaves integers alone and never returns NaN for finite input', () => {
    expect(round1(5)).toBe(5)
    expect(round1(0)).toBe(0)
    expect(Number.isNaN(round1(1.234))).toBe(false)
  })
})

describe('factorAverage', () => {
  it('returns null when there are no reviews (score must not pretend to exist)', () => {
    expect(factorAverage([], 'water')).toBeNull()
    expect(factorAverage(undefined, 'water')).toBeNull()
    expect(factorAverage(null, 'water')).toBeNull()
  })

  it('averages one criterion across reviews', () => {
    const reviews = [
      { water: 5, covered: 4 },
      { water: 3, covered: 4 },
      { water: 4, covered: 4 },
    ]
    expect(factorAverage(reviews, 'water')).toBeCloseTo(4, 10)
    expect(factorAverage(reviews, 'covered')).toBe(4)
  })

  it('ignores missing values rather than counting them as zero', () => {
    const reviews = [{ water: 5 }, { water: 5 }, {}]
    expect(factorAverage(reviews, 'water')).toBe(5)
  })
})

describe('vendorHygiene', () => {
  it('returns null for a vendor with no reviews', () => {
    expect(vendorHygiene({ reviews: [] })).toBeNull()
    expect(vendorHygiene({})).toBeNull()
    expect(vendorHygiene(null)).toBeNull()
    expect(vendorHygiene(undefined)).toBeNull()
  })

  it('averages each factor across reviews, then applies the weights', () => {
    const vendor = {
      reviews: [
        { water: 5, covered: 5, gloves: 5, surroundings: 5 },
        { water: 5, covered: 5, gloves: 5, surroundings: 3 },
      ],
    }
    // averages → (5, 5, 5, 4) → 0.4*5 + 0.25*5 + 0.2*5 + 0.15*4 = 4.85 → 4.9
    expect(vendorHygiene(vendor)).toBe(4.9)
  })

  it('is order-independent (review order must not change the score)', () => {
    const reviews = [
      { water: 4, covered: 5, gloves: 3, surroundings: 5 },
      { water: 5, covered: 4, gloves: 4, surroundings: 4 },
      { water: 3, covered: 5, gloves: 5, surroundings: 3 },
    ]
    const a = vendorHygiene({ reviews })
    const b = vendorHygiene({ reviews: [...reviews].reverse() })
    expect(a).toBe(b)
  })

  it('stays within the 0–5 range for any valid input', () => {
    for (const water of [0, 1, 2, 3, 4, 5]) {
      for (const surroundings of [0, 5]) {
        const score = vendorHygiene({
          reviews: [{ water, covered: 5, gloves: 0, surroundings }],
        })
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(5)
      }
    }
  })

  it('never returns NaN', () => {
    const score = vendorHygiene({
      reviews: [{ water: 5, covered: 4, gloves: 3, surroundings: 2 }],
    })
    expect(Number.isNaN(score)).toBe(false)
  })
})

describe('factorBreakdown', () => {
  it('returns per-factor averages for the UI bars', () => {
    const vendor = {
      reviews: [
        { water: 5, covered: 4, gloves: 3, surroundings: 2 },
        { water: 5, covered: 4, gloves: 3, surroundings: 2 },
      ],
    }
    expect(factorBreakdown(vendor)).toEqual({
      water: 5,
      covered: 4,
      gloves: 3,
      surroundings: 2,
    })
  })

  it('returns nulls when there are no reviews', () => {
    expect(factorBreakdown({})).toEqual({
      water: null,
      covered: null,
      gloves: null,
      surroundings: null,
    })
  })
})

describe('vendorRating', () => {
  it('returns null with no reviews', () => {
    expect(vendorRating({ reviews: [] })).toBeNull()
    expect(vendorRating(null)).toBeNull()
  })

  it('averages star ratings and rounds to 1 decimal', () => {
    expect(vendorRating({ reviews: [{ stars: 5 }, { stars: 4 }] })).toBe(4.5)
    expect(vendorRating({ reviews: [{ stars: 5 }, { stars: 5 }, { stars: 4 }] })).toBe(4.7)
  })

  it('never exceeds 5 or drops below 1 for valid star values', () => {
    expect(vendorRating({ reviews: [{ stars: 5 }, { stars: 5 }] })).toBe(5)
    expect(vendorRating({ reviews: [{ stars: 1 }, { stars: 1 }] })).toBe(1)
  })
})

describe('seed data integrity', () => {
  it('ships 8 vendors with reviews, coordinates and dishes', () => {
    expect(VENDORS).toHaveLength(8)
    for (const v of VENDORS) {
      expect(v.id).toMatch(/^[a-z0-9-]+$/)
      expect(v.name.length).toBeGreaterThan(2)
      expect(v.reviews.length).toBeGreaterThan(0)
      expect(v.dishes.length).toBeGreaterThan(0)
      expect(Number.isFinite(v.lat)).toBe(true)
      expect(Number.isFinite(v.lng)).toBe(true)
      expect(v.lat).toBeGreaterThan(16)
      expect(v.lat).toBeLessThan(19)
      expect(v.lng).toBeGreaterThan(77)
      expect(v.lng).toBeLessThan(80)
    }
  })

  it('has unique vendor ids and unique review ids', () => {
    const ids = VENDORS.map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)
    const reviewIds = VENDORS.flatMap((v) => v.reviews.map((r) => r.id))
    expect(new Set(reviewIds).size).toBe(reviewIds.length)
  })

  it('every seed review satisfies the 0–5 / 1–5 constraints', () => {
    for (const v of VENDORS) {
      for (const r of v.reviews) {
        expect(r.stars).toBeGreaterThanOrEqual(1)
        expect(r.stars).toBeLessThanOrEqual(5)
        for (const k of ['water', 'covered', 'gloves', 'surroundings']) {
          expect(r[k]).toBeGreaterThanOrEqual(0)
          expect(r[k]).toBeLessThanOrEqual(5)
          expect(Number.isInteger(r[k])).toBe(true)
        }
      }
    }
  })

  it('every vendor computes a real score in the designed 4.4–4.9 band', () => {
    for (const v of VENDORS) {
      const score = vendorHygiene(v)
      expect(score).not.toBeNull()
      expect(score).toBeGreaterThanOrEqual(4.4)
      expect(score).toBeLessThanOrEqual(4.9)
      expect(score).toBe(round1(score)) // already rounded — no float leakage
    }
  })

  it('derives each vendor score from its own reviews (no shared constant)', () => {
    // Mutating one vendor's reviews must change only that vendor's score.
    const before = VENDORS.map((v) => vendorHygiene(v))
    const tampered = VENDORS.map((v, i) =>
      i === 0
        ? { ...v, reviews: [{ ...v.reviews[0], water: 0, covered: 0, gloves: 0, surroundings: 0 }] }
        : v,
    )
    const after = tampered.map((v) => vendorHygiene(v))
    expect(after[0]).toBeLessThan(before[0])
    for (let i = 1; i < before.length; i++) expect(after[i]).toBe(before[i])
  })

  it('FSSAI flags exist on both values (so the badge is genuinely conditional)', () => {
    const flags = VENDORS.map((v) => v.fssaiVerified)
    expect(flags).toContain(true)
    expect(flags).toContain(false)
  })

  it('references only known categories', () => {
    const allowed = new Set([
      'pani-puri', 'chaat', 'dosa', 'pav-bhaji', 'momos', 'samosa', 'vada-pav', 'snacks',
    ])
    for (const v of VENDORS) expect(allowed.has(v.category)).toBe(true)
  })
})
