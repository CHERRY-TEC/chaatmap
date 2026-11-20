/**
 * ChaatMap REST API — tier 2 of the 3-tier architecture.
 *
 *   React client  ──>  Express API  ──>  SQLite (node:sqlite)
 *
 * The browser app degrades gracefully: it tries this API first and falls
 * back to localStorage when the API is unreachable (file://, static
 * hosting), so the single-file build keeps working with no server.
 *
 * Security posture:
 *  - every mutating payload passes src/lib/validation.js (shared with the UI)
 *  - role is derived server-side from the caller's token, never trusted body
 *  - FSSAI flags are only settable through PATCH /vendors/:id/fssai
 *  - CORS is restricted to an explicit allow-list
 *  - JSON body size is capped; errors never leak stack traces
 */

import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import {
  getDb,
  listVendors,
  getVendor,
  insertReview,
  deleteReview,
  setFssai,
  addFavorite,
  removeFavorite,
  listFavorites,
  stats,
  vendorExists,
} from './db.js'
import { vendorHygiene, vendorRating } from '../src/lib/hygiene.js'
import {
  validateReview,
  validateTripPlan,
  validateId,
  roleFromEmail,
} from '../src/lib/validation.js'
import { planDay, optimizeRoute } from '../src/lib/optimizer.js'

/* ------------------------------------------------------------- logging */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }

/**
 * Structured JSON logger — one object per line so output is greppable and
 * machine-parseable. Level is controlled by LOG_LEVEL (default 'info').
 */
export function createLogger(stream = process.stdout, level = process.env.LOG_LEVEL ?? 'info') {
  const threshold = LEVELS[level] ?? LEVELS.info
  const write = (lvl, msg, fields) => {
    if (LEVELS[lvl] < threshold) return
    const line = JSON.stringify({
      time: new Date().toISOString(),
      level: lvl,
      msg,
      ...fields,
    })
    stream.write(`${line}\n`)
  }
  return {
    debug: (msg, fields) => write('debug', msg, fields),
    info: (msg, fields) => write('info', msg, fields),
    warn: (msg, fields) => write('warn', msg, fields),
    error: (msg, fields) => write('error', msg, fields),
  }
}

/* ------------------------------------------------------- request context */

const REQUEST_ID_HEADER = 'x-request-id'

/** Attach a request id + start time; log every request when it finishes. */
function requestContext(logger) {
  return (req, res, next) => {
    const incoming = req.get(REQUEST_ID_HEADER)
    req.id = incoming && /^[A-Za-z0-9_-]{1,64}$/.test(incoming) ? incoming : crypto.randomUUID()
    req.startedAt = process.hrtime.bigint()
    res.setHeader(REQUEST_ID_HEADER, req.id)
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - req.startedAt) / 1e6
      logger.info('request', {
        id: req.id,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms: Math.round(ms * 100) / 100,
      })
    })
    next()
  }
}

/**
 * Demo auth. The client sends `x-chaatmap-user` = email (no real sessions in
 * this build); the ROLE is always derived here so a forged body cannot
 * escalate. Real deployments swap this for a signed session cookie.
 */
function auth(req, res, next) {
  const email = (req.get('x-chaatmap-user') ?? '').trim().toLowerCase()
  req.user = email ? { email, role: roleFromEmail(email) } : null
  next()
}

/** Require an authenticated user (401) and optionally an admin role (403). */
function requireAuth({ admin = false } = {}) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'unauthenticated', message: 'Sign in first.' })
    }
    if (admin && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'forbidden', message: 'Admin access required.' })
    }
    next()
  }
}

/** Wrap async handlers so rejections reach the error middleware. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/** 404 for unknown API routes. */
function notFound(req, res) {
  res.status(404).json({ error: 'not_found', message: `No route for ${req.method} ${req.path}` })
}

/** Central error handler — logged with the request id, never leaks stacks. */
function errorHandler(logger) {
  // Express identifies error middleware by arity: keep all four parameters.
  return (err, req, res, _next) => {
    if (err?.code === 'VENDOR_NOT_FOUND') {
      logger.warn('unknown vendor', { id: req.id, detail: err.message })
      return res.status(404).json({ error: 'vendor_not_found', message: 'Vendor does not exist.' })
    }
    if (err?.type === 'entity.parse.failed' || err?.status === 400) {
      return res.status(400).json({ error: 'bad_json', message: 'Request body must be valid JSON.' })
    }
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ error: 'payload_too_large', message: 'Body too large.' })
    }
    logger.error('unhandled', { id: req.id, message: err?.message, stack: err?.stack })
    res.status(500).json({ error: 'internal_error', message: 'Something went wrong.' })
  }
}

/* -------------------------------------------------------------- helpers */

const uid = () => `r${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`

/** Attach computed hygiene + rating to a vendor without mutating the row. */
function withScores(v) {
  if (!v) return v
  return {
    ...v,
    hygieneScore: vendorHygiene(v),
    rating: vendorRating(v),
    reviewCount: v.reviews?.length ?? 0,
  }
}

/** Validate and send a 422 when a shared validator fails. */
function guard(res, result) {
  if (result.ok) return true
  res.status(422).json({ error: 'validation_failed', errors: result.errors })
  return false
}

/* --------------------------------------------------------------- routes */

/**
 * Build the Express app.
 * @param {object} [opts]
 * @param {import('node:sqlite').DatabaseSync} [opts.db] pre-opened database
 * @param {ReturnType<createLogger>} [opts.logger]
 * @param {string[]} [opts.origins] CORS allow-list
 */
export function createApp(opts = {}) {
  const db = opts.db ?? getDb()
  const logger = opts.logger ?? createLogger()
  const origins = opts.origins ?? (
    process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [
      'http://localhost:5173',
      'http://localhost:5180',
      'http://localhost:4173',
      'https://cherry-tec.github.io',
    ]
  )

  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '32kb' }))
  app.use(
    cors({
      origin(origin, cb) {
        // No Origin header = same-origin or a non-browser client.
        if (!origin || origins.includes(origin)) return cb(null, true)
        cb(new Error('CORS_NOT_ALLOWED'))
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['content-type', 'x-request-id', 'x-chaatmap-user'],
      exposedHeaders: ['x-request-id'],
      maxAge: 600,
    }),
  )
  app.use(requestContext(logger))
  app.use(auth)

  /* ---------------------------------------------------------- health */

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), requestId: req.id })
  })

  app.get('/api/stats', (req, res) => {
    res.json(stats(db))
  })

  /* --------------------------------------------------------- vendors */

  app.get('/api/vendors', (req, res) => {
    const { category, area, q, minHygiene } = req.query
    let list = listVendors(db).map(withScores)

    if (category && category !== 'all') list = list.filter((v) => v.category === category)
    if (area && area !== 'Hyderabad') list = list.filter((v) => v.area === area)
    if (q) {
      const s = String(q).toLowerCase()
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(s) ||
          v.specialty.toLowerCase().includes(s) ||
          v.area.toLowerCase().includes(s) ||
          v.dishes.some((d) => d.name.toLowerCase().includes(s)),
      )
    }
    if (minHygiene) {
      const min = Number(minHygiene)
      if (Number.isFinite(min)) list = list.filter((v) => (v.hygieneScore ?? 0) >= min)
    }

    res.json({ count: list.length, vendors: list })
  })

  app.get('/api/vendors/:id', (req, res) => {
    const check = validateId(req.params.id)
    if (!guard(res, check)) return
    const v = getVendor(check.value, db)
    if (!v) {
      return res.status(404).json({ error: 'vendor_not_found', message: 'Vendor does not exist.' })
    }
    res.json(withScores(v))
  })

  /* --------------------------------------------------------- reviews */

  app.post(
    '/api/vendors/:id/reviews',
    requireAuth(),
    asyncHandler((req, res) => {
      const idCheck = validateId(req.params.id)
      if (!guard(res, idCheck)) return
      if (!vendorExists(idCheck.value, db)) {
        return res
          .status(404)
          .json({ error: 'vendor_not_found', message: 'Vendor does not exist.' })
      }

      const result = validateReview({ ...req.body, vendorId: idCheck.value }, { requireVendor: true })
      if (!guard(res, result)) return

      const review = {
        id: uid(),
        ...result.value,
        date: new Date().toISOString().slice(0, 10),
      }
      // Author defaults to the signed-in user when the body omits it.
      if (!review.author && req.user) review.author = req.user.email.split('@')[0]

      const before = vendorHygiene(getVendor(idCheck.value, db))
      const vendor = insertReview(idCheck.value, review, db)
      const after = vendorHygiene(vendor)

      logger.info('review.created', {
        id: req.id,
        vendor: idCheck.value,
        review: review.id,
        hygieneBefore: before,
        hygieneAfter: after,
      })

      res.status(201).json({
        review,
        vendor: withScores(vendor),
        hygiene: { before, after, changed: before !== after },
      })
    }),
  )

  app.delete(
    '/api/reviews/:id',
    requireAuth({ admin: true }),
    asyncHandler((req, res) => {
      const check = validateId(req.params.id)
      if (!guard(res, check)) return
      const removed = deleteReview(check.value, db)
      if (!removed) {
        return res.status(404).json({ error: 'review_not_found', message: 'Review does not exist.' })
      }
      logger.info('review.deleted', { id: req.id, review: check.value })
      res.status(204).end()
    }),
  )

  /* ----------------------------------------------------- fssai (admin) */

  app.patch(
    '/api/vendors/:id/fssai',
    requireAuth({ admin: true }),
    asyncHandler((req, res) => {
      const check = validateId(req.params.id)
      if (!guard(res, check)) return
      if (typeof req.body?.verified !== 'boolean') {
        return res.status(422).json({
          error: 'validation_failed',
          errors: { verified: 'verified must be a boolean.' },
        })
      }
      const next = setFssai(check.value, req.body.verified, db)
      if (next === null) {
        return res.status(404).json({ error: 'vendor_not_found', message: 'Vendor does not exist.' })
      }
      logger.info('fssai.updated', { id: req.id, vendor: check.value, verified: next })
      res.json({ id: check.value, fssaiVerified: next })
    }),
  )

  /* ------------------------------------------------------- favorites */

  app.get('/api/favorites', (req, res) => {
    res.json({ favorites: listFavorites(db) })
  })

  app.post('/api/favorites/:id', (req, res) => {
    const check = validateId(req.params.id)
    if (!guard(res, check)) return
    if (!addFavorite(check.value, db)) {
      return res.status(404).json({ error: 'vendor_not_found', message: 'Vendor does not exist.' })
    }
    res.status(201).json({ favorites: listFavorites(db) })
  })

  app.delete('/api/favorites/:id', (req, res) => {
    const check = validateId(req.params.id)
    if (!guard(res, check)) return
    removeFavorite(check.value, db)
    res.json({ favorites: listFavorites(db) })
  })

  /* ------------------------------------------------------- optimizer */

  app.post(
    '/api/plan',
    asyncHandler((req, res) => {
      const check = validateTripPlan(req.body ?? {})
      if (!guard(res, check)) return

      const vendors = listVendors(db)
        .filter((v) => !check.value.startId || v.id !== check.value.startId)
        .map(withScores)

      const plan = planDay(vendors, check.value)

      res.json({
        ...check.value,
        ...plan,
        stops: plan.stops.map((s) => ({
          id: s.id,
          name: s.name,
          area: s.area,
          lat: s.lat,
          lng: s.lng,
          hygieneScore: s.hygieneScore,
          rating: s.rating,
          avgPrice: s.avgPrice,
        })),
      })
    }),
  )

  app.post(
    '/api/routes/optimize',
    asyncHandler((req, res) => {
      const stops = Array.isArray(req.body?.stops) ? req.body.stops : []
      const valid = stops.filter(
        (s) => Number.isFinite(Number(s?.lat)) && Number.isFinite(Number(s?.lng)),
      )
      if (valid.length < 2) {
        return res.status(422).json({
          error: 'validation_failed',
          errors: { stops: 'Provide at least two stops with numeric lat/lng.' },
        })
      }
      const route = optimizeRoute(valid, { startIndex: Number(req.body.startIndex) || 0 })
      res.json(route)
    }),
  )

  app.use('/api', notFound)
  app.use(errorHandler(logger))

  return app
}

/**
 * Start the server. Called by `npm run server` / CI, never by the client.
 * @returns {{app: import('express').Express, server: import('node:http').Server, port: number}}
 */
export function startServer({ port = process.env.PORT ?? 3001, db, logger } = {}) {
  const app = createApp({ db, logger })
  const log = logger ?? createLogger()
  return new Promise((resolve, reject) => {
    const server = app.listen(Number(port), () => {
      const actual = server.address().port
      log.info('server.listening', { port: actual })
      resolve({ app, server, port: actual })
    })
    server.on('error', reject)
  })
}
