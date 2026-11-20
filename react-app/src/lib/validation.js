/**
 * Shared input validation — runs identically in the browser (form UX) and in
 * the Node API (request validation). Keep it dependency-free so both sides
 * import the exact same code.
 *
 * Every validator returns `{ ok: true, value }` on success or
 * `{ ok: false, errors: { field: message } }` on failure, so callers never
 * have to guess which shape they got.
 */

export const LIMITS = {
  authorMin: 2,
  authorMax: 60,
  commentMax: 500,
  nameMax: 80,
  emailMax: 254,
  passwordMin: 4,
  passwordMax: 128,
  scoreMin: 0,
  scoreMax: 5,
  starsMin: 1,
  starsMax: 5,
  budgetMin: 0,
  budgetMax: 100000,
  maxStopsMin: 1,
  maxStopsMax: 20,
}

const isPlainObject = (v) =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Collapse whitespace and trim; returns '' for non-strings. */
export function cleanText(v) {
  if (typeof v !== 'string') return ''
  return v.replace(/\s+/g, ' ').trim()
}

/** Strip C0/C1 control characters (log & terminal-injection guard). */
export function sanitizeText(v) {
  // eslint-disable-next-line no-control-regex -- stripping control chars is the point
  return cleanText(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
}

const fail = (field, message) => ({ ok: false, errors: { [field]: message } })

/* ------------------------------------------------------------------ stars */

export function validateStars(value) {
  // Reject objects/arrays outright — Number([5]) === 5 would otherwise pass.
  const type = typeof value
  if (type !== 'number' && type !== 'string') {
    return fail('stars', 'Overall rating must be a whole number.')
  }
  const n = Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return fail('stars', 'Overall rating must be a whole number.')
  }
  if (n < LIMITS.starsMin || n > LIMITS.starsMax) {
    return fail(
      'stars',
      `Overall rating must be between ${LIMITS.starsMin} and ${LIMITS.starsMax}.`,
    )
  }
  return { ok: true, value: n }
}

/* --------------------------------------------------------------- criteria */

export const CRITERIA_KEYS = ['water', 'covered', 'gloves', 'surroundings']

/**
 * Validate one 0-5 criterion. `null`/`undefined`/'' are rejected: a criterion
 * must be explicitly rated (choosing 0 is allowed and meaningful).
 */
export function validateCriterion(value, key = 'score') {
  // Reject objects/arrays outright — Number([5]) === 5 would otherwise pass.
  // Strings must be non-empty after trimming ('' and '   ' both mean "unset").
  const type = typeof value
  if (value === null || value === undefined) {
    return fail(key, 'Every hygiene criterion must be rated (0–5).')
  }
  if (type === 'string' && value.trim() === '') {
    return fail(key, 'Every hygiene criterion must be rated (0–5).')
  }
  if (type !== 'number' && type !== 'string') {
    return fail(key, 'Ratings must be whole numbers from 0 to 5.')
  }
  const n = Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return fail(key, 'Ratings must be whole numbers from 0 to 5.')
  }
  if (n < LIMITS.scoreMin || n > LIMITS.scoreMax) {
    return fail(key, 'Ratings must be between 0 and 5.')
  }
  return { ok: true, value: n }
}

/**
 * Validate the full four-factor rating set at once.
 * @returns {{ok: true, value: object}|{ok: false, errors: object}}
 */
export function validateCriteria(input) {
  const src = isPlainObject(input) ? input : {}
  const errors = {}
  const value = {}

  for (const key of CRITERIA_KEYS) {
    const r = validateCriterion(src[key], key)
    if (r.ok) value[key] = r.value
    else Object.assign(errors, r.errors)
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value }
}

/* ------------------------------------------------------------------ text */

export function validateAuthor(value) {
  const text = sanitizeText(value)
  if (text.length < LIMITS.authorMin) {
    return fail('author', 'Please enter your name (at least 2 characters).')
  }
  if (text.length > LIMITS.authorMax) {
    return fail('author', `Name must be ${LIMITS.authorMax} characters or fewer.`)
  }
  return { ok: true, value: text }
}

export function validateComment(value) {
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: '' } // optional
  }
  const text = sanitizeText(value)
  if (text.length > LIMITS.commentMax) {
    return fail('comment', `Comment must be ${LIMITS.commentMax} characters or fewer.`)
  }
  return { ok: true, value: text }
}

export function validateId(value) {
  const text = cleanText(value)
  if (!text) return fail('id', 'An id is required.')
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/i.test(text)) {
    return fail('id', 'Id may only contain letters, digits and hyphens.')
  }
  return { ok: true, value: text }
}

/* ------------------------------------------------------------------ auth */

export function validateEmail(value) {
  const text = cleanText(value).toLowerCase()
  if (!text) return fail('email', 'Email is required.')
  if (text.length > LIMITS.emailMax) {
    return fail('email', 'Email is too long.')
  }
  // Deliberately conservative: one @, no spaces, TLD of at least 2 chars.
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]{2,})+$/.test(text)) {
    return fail('email', 'Please enter a valid email address.')
  }
  return { ok: true, value: text }
}

export function validatePassword(value) {
  const text = typeof value === 'string' ? value : ''
  if (text.length < LIMITS.passwordMin) {
    return fail('password', `Password must be at least ${LIMITS.passwordMin} characters.`)
  }
  if (text.length > LIMITS.passwordMax) {
    return fail('password', `Password must be ${LIMITS.passwordMax} characters or fewer.`)
  }
  return { ok: true, value: text }
}

/** Admin role is derived from the email prefix — never trusted from input. */
export function roleFromEmail(email) {
  return typeof email === 'string' && email.toLowerCase().startsWith('admin@')
    ? 'admin'
    : 'user'
}

/* ---------------------------------------------------------------- review */

/**
 * Validate a complete hygiene review payload.
 * @param {object} input
 * @param {object} [opts]
 * @param {boolean} [opts.requireVendor] require a valid vendor id
 * @param {string}  [opts.vendorId] when the vendor is fixed by the route
 */
export function validateReview(input, opts = {}) {
  const src = isPlainObject(input) ? input : {}
  const errors = {}
  const value = {}

  const author = validateAuthor(src.author)
  if (author.ok) value.author = author.value
  else Object.assign(errors, author.errors)

  const stars = validateStars(src.stars)
  if (stars.ok) value.stars = stars.value
  else Object.assign(errors, stars.errors)

  const criteria = validateCriteria(src)
  if (criteria.ok) Object.assign(value, criteria.value)
  else Object.assign(errors, criteria.errors)

  const comment = validateComment(src.comment)
  if (comment.ok) value.comment = comment.value
  else Object.assign(errors, comment.errors)

  const vendorSource = opts.vendorId ?? src.vendorId
  if (opts.requireVendor || vendorSource) {
    const id = validateId(vendorSource)
    if (id.ok) value.vendorId = id.value
    else Object.assign(errors, id.errors)
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value }
}

/* ------------------------------------------------------------ itineraries */

/** Validate a budget-constrained trip request (optimizer input). */
export function validateTripPlan(input) {
  const src = isPlainObject(input) ? input : {}
  const errors = {}
  const value = {}

  const budget = Number(src.budget)
  if (!Number.isFinite(budget) || budget < LIMITS.budgetMin || budget > LIMITS.budgetMax) {
    errors.budget = `Budget must be between Rs.${LIMITS.budgetMin} and Rs.${LIMITS.budgetMax}.`
  } else {
    value.budget = Math.round(budget)
  }

  const maxStops = src.maxStops === undefined ? 5 : Number(src.maxStops)
  if (
    !Number.isFinite(maxStops) ||
    !Number.isInteger(maxStops) ||
    maxStops < LIMITS.maxStopsMin ||
    maxStops > LIMITS.maxStopsMax
  ) {
    errors.maxStops =
      `Stops must be a whole number between ${LIMITS.maxStopsMin} and ${LIMITS.maxStopsMax}.`
  } else {
    value.maxStops = maxStops
  }

  if (src.startId !== undefined && src.startId !== null && src.startId !== '') {
    const id = validateId(src.startId)
    if (id.ok) value.startId = id.value
    else Object.assign(errors, id.errors)
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value }
}

/** Convenience: turn a validator result into an HTTP-ish {status, body}. */
export function toHttpError(result, status = 422) {
  if (result.ok) return null
  return {
    status,
    body: { error: 'validation_failed', errors: result.errors },
  }
}
