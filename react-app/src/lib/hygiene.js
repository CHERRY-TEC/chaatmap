// Hygiene scoring — weighted four-factor formula.
// Score = (0.40 × Water) + (0.25 × Covered Food) + (0.20 × Gloves) + (0.15 × Surroundings)
// Every criterion is rated 0–5. Vendor scores are ALWAYS derived from reviews — never hardcoded.

export const WEIGHTS = {
  water: 0.4,
  covered: 0.25,
  gloves: 0.2,
  surroundings: 0.15,
}

export const CRITERIA = [
  { key: 'water', label: 'Clean / RO Water Used', weight: '40%', icon: 'Droplets' },
  { key: 'covered', label: 'Covered Food Display', weight: '25%', icon: 'Eye' },
  { key: 'gloves', label: 'Gloves / Headgear Usage', weight: '20%', icon: 'Hand' },
  { key: 'surroundings', label: 'Surroundings Cleanliness', weight: '15', icon: 'Sparkles' },
]

/** Round to 1 decimal, tolerant of floating-point noise (4.85 → 4.9). */
export function round1(x) {
  return Math.round(x * 10 + 1e-6) / 10
}

/** Weighted hygiene score for a single four-factor rating set. */
export function weightedScore(f) {
  return (
    (Number(f.water) || 0) * WEIGHTS.water +
    (Number(f.covered) || 0) * WEIGHTS.covered +
    (Number(f.gloves) || 0) * WEIGHTS.gloves +
    (Number(f.surroundings) || 0) * WEIGHTS.surroundings
  )
}

/**
 * Average of one factor across all of a vendor's reviews.
 * Reviews that do not carry the field are skipped rather than counted as 0,
 * so a partial record can never drag a vendor's score down artificially.
 */
export function factorAverage(reviews, key) {
  if (!Array.isArray(reviews) || !reviews.length) return null
  let sum = 0
  let count = 0
  for (const r of reviews) {
    const n = Number(r?.[key])
    if (Number.isFinite(n)) {
      sum += n
      count++
    }
  }
  return count ? sum / count : null
}

/**
 * Vendor hygiene score: average each factor across reviews,
 * then apply the weighted formula. Returns null when no reviews exist.
 */
export function vendorHygiene(vendor) {
  const reviews = vendor?.reviews || []
  if (!reviews.length) return null
  const avg = {
    water: factorAverage(reviews, 'water'),
    covered: factorAverage(reviews, 'covered'),
    gloves: factorAverage(reviews, 'gloves'),
    surroundings: factorAverage(reviews, 'surroundings'),
  }
  return round1(weightedScore(avg))
}

/** Per-factor averages for the score breakdown UI. */
export function factorBreakdown(vendor) {
  const reviews = vendor?.reviews || []
  return {
    water: factorAverage(reviews, 'water'),
    covered: factorAverage(reviews, 'covered'),
    gloves: factorAverage(reviews, 'gloves'),
    surroundings: factorAverage(reviews, 'surroundings'),
  }
}

/** Overall customer rating = mean star rating across reviews. */
export function vendorRating(vendor) {
  const reviews = vendor?.reviews || []
  if (!reviews.length) return null
  const sum = reviews.reduce((s, r) => s + (Number(r.stars) || 0), 0)
  return round1(sum / reviews.length)
}
