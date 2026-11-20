/**
 * Persistence layer — SQLite via Node's built-in `node:sqlite` module.
 *
 * No native compilation step (better-sqlite3 would need node-gyp), which
 * keeps `npm install` reliable on every platform and in CI.
 *
 * Schema is created idempotently on first use and seeded from the same
 * seed dataset the browser app ships with, so both data paths agree.
 *
 *   vendors  ──< reviews   (one-to-many)
 *   favorites               (client-side convenience, keyed by vendor id)
 */

import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { VENDORS } from '../src/data/vendors.js'

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS vendors (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  specialty       TEXT,
  area            TEXT,
  distance_km     REAL,
  price_min       INTEGER,
  price_max       INTEGER,
  image           TEXT,
  emoji           TEXT,
  description     TEXT,
  lat             REAL NOT NULL,
  lng             REAL NOT NULL,
  open_now        INTEGER NOT NULL DEFAULT 0,
  hours           TEXT,
  fssai_verified  INTEGER NOT NULL DEFAULT 0,
  dishes_json     TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id           TEXT PRIMARY KEY,
  vendor_id    TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  author       TEXT NOT NULL,
  stars        INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment      TEXT,
  water        INTEGER NOT NULL CHECK (water BETWEEN 0 AND 5),
  covered      INTEGER NOT NULL CHECK (covered BETWEEN 0 AND 5),
  gloves       INTEGER NOT NULL CHECK (gloves BETWEEN 0 AND 5),
  surroundings INTEGER NOT NULL CHECK (surroundings BETWEEN 0 AND 5),
  date         TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_vendor ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_area ON vendors(area);

CREATE TABLE IF NOT EXISTS favorites (
  vendor_id   TEXT PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`

let db = null
let dbPath = null

/** Row → domain shape for a vendor (camelCase, nested dishes, numeric flags). */
function mapVendor(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    specialty: row.specialty ?? '',
    area: row.area ?? '',
    distanceKm: row.distance_km ?? 0,
    priceMin: row.price_min ?? 0,
    priceMax: row.price_max ?? 0,
    image: row.image ?? '',
    emoji: row.emoji ?? '🍽️',
    description: row.description ?? '',
    lat: row.lat,
    lng: row.lng,
    openNow: Boolean(row.open_now),
    hours: row.hours ?? '',
    fssaiVerified: Boolean(row.fssai_verified),
    dishes: safeJson(row.dishes_json, []),
    reviews: [], // hydrated separately
  }
}

function mapReview(row) {
  if (!row) return null
  return {
    id: row.id,
    vendorId: row.vendor_id,
    author: row.author,
    stars: row.stars,
    comment: row.comment ?? '',
    water: row.water,
    covered: row.covered,
    gloves: row.gloves,
    surroundings: row.surroundings,
    date: row.date,
  }
}

function safeJson(text, fallback) {
  try {
    const v = JSON.parse(text)
    return v ?? fallback
  } catch {
    return fallback
  }
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Open (and create if needed) the SQLite database, applying the schema.
 * @param {string} [file=':memory:'] path to the db file, or ':memory:'
 * @returns {DatabaseSync} the open handle
 */
export function openDatabase(file = ':memory:') {
  if (file !== ':memory:') {
    mkdirSync(dirname(file), { recursive: true })
  }
  const handle = new DatabaseSync(file)
  handle.exec(SCHEMA)
  return handle
}

/**
 * Get the shared connection, lazily opening and seeding it.
 * @param {string} [file] override the on-disk location (tests use memory)
 */
export function getDb(file) {
  if (db) return db
  dbPath = file ?? process.env.CHAATMAP_DB ?? ':memory:'
  db = openDatabase(dbPath)
  if (countVendors(db) === 0) seed(db)
  return db
}

/** Reset the module-level handle (used between tests). */
export function closeDatabase() {
  if (db) {
    try {
      db.close()
    } catch {
      /* already closed */
    }
  }
  db = null
  dbPath = null
}

function countVendors(handle) {
  const row = handle.prepare('SELECT COUNT(*) AS n FROM vendors').get()
  return Number(row?.n ?? 0)
}

/* ------------------------------------------------------------------ seed */

/**
 * Insert the seed dataset. Existing rows are left untouched so re-seeding
 * never destroys user-submitted reviews.
 * @param {DatabaseSync} [handle]
 */
export function seed(handle = getDb()) {
  const insertVendor = handle.prepare(`
    INSERT OR IGNORE INTO vendors
      (id, name, category, specialty, area, distance_km, price_min, price_max,
       image, emoji, description, lat, lng, open_now, hours, fssai_verified, dishes_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertReview = handle.prepare(`
    INSERT OR IGNORE INTO reviews
      (id, vendor_id, author, stars, comment, water, covered, gloves, surroundings, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  handle.exec('BEGIN')
  try {
    for (const v of VENDORS) {
      insertVendor.run(
        v.id,
        v.name,
        v.category,
        v.specialty ?? '',
        v.area ?? '',
        v.distanceKm ?? 0,
        v.priceMin ?? 0,
        v.priceMax ?? 0,
        v.image ?? '',
        v.emoji ?? '🍽️',
        v.description ?? '',
        v.lat,
        v.lng,
        v.openNow ? 1 : 0,
        v.hours ?? '',
        v.fssaiVerified ? 1 : 0,
        JSON.stringify(v.dishes ?? []),
      )
      for (const r of v.reviews ?? []) {
        insertReview.run(
          r.id,
          v.id,
          r.author,
          r.stars,
          r.comment ?? '',
          r.water,
          r.covered,
          r.gloves,
          r.surroundings,
          r.date ?? today(),
        )
      }
    }
    handle.exec('COMMIT')
  } catch (err) {
    handle.exec('ROLLBACK')
    throw err
  }
  return { vendors: VENDORS.length }
}

/* --------------------------------------------------------------- queries */

/** All vendors, each with its reviews attached. */
export function listVendors(handle = getDb()) {
  const rows = handle.prepare('SELECT * FROM vendors ORDER BY name').all()
  const reviews = handle
    .prepare('SELECT * FROM reviews ORDER BY date DESC, created_at DESC')
    .all()
  const byVendor = new Map()
  for (const r of reviews) {
    const list = byVendor.get(r.vendor_id) ?? []
    list.push(mapReview(r))
    byVendor.set(r.vendor_id, list)
  }
  return rows.map((row) => {
    const v = mapVendor(row)
    v.reviews = byVendor.get(v.id) ?? []
    return v
  })
}

/** One vendor with reviews; null when unknown. */
export function getVendor(id, handle = getDb()) {
  const row = handle.prepare('SELECT * FROM vendors WHERE id = ?').get(id)
  if (!row) return null
  const v = mapVendor(row)
  v.reviews = handle
    .prepare('SELECT * FROM reviews WHERE vendor_id = ? ORDER BY date DESC, created_at DESC')
    .all(id)
    .map(mapReview)
  return v
}

/** True when a vendor id exists (foreign-key precondition for reviews). */
export function vendorExists(id, handle = getDb()) {
  const row = handle.prepare('SELECT 1 AS ok FROM vendors WHERE id = ?').get(id)
  return Boolean(row)
}

/** Insert a review; returns the persisted row. Throws when vendor is unknown. */
export function insertReview(vendorId, review, handle = getDb()) {
  if (!vendorExists(vendorId, handle)) {
    const err = new Error(`Unknown vendor: ${vendorId}`)
    err.code = 'VENDOR_NOT_FOUND'
    throw err
  }
  handle
    .prepare(
      `INSERT INTO reviews
         (id, vendor_id, author, stars, comment, water, covered, gloves, surroundings, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      review.id,
      vendorId,
      review.author,
      review.stars,
      review.comment ?? '',
      review.water,
      review.covered,
      review.gloves,
      review.surroundings,
      review.date ?? today(),
    )
  return getVendor(vendorId, handle)
}

/** Delete a review; returns true when a row was removed. */
export function deleteReview(reviewId, handle = getDb()) {
  const info = handle.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId)
  return Number(info.changes) > 0
}

/**
 * Toggle the FSSAI flag — the only code path that can ever set it.
 * @returns {boolean|null} new value, or null when the vendor is unknown
 */
export function setFssai(vendorId, verified, handle = getDb()) {
  const info = handle
    .prepare('UPDATE vendors SET fssai_verified = ? WHERE id = ?')
    .run(verified ? 1 : 0, vendorId)
  if (Number(info.changes) === 0) return null
  return Boolean(verified)
}

/** Favourite a vendor (idempotent upsert). */
export function addFavorite(vendorId, handle = getDb()) {
  if (!vendorExists(vendorId, handle)) return false
  handle
    .prepare(
      `INSERT INTO favorites (vendor_id, updated_at) VALUES (?, ?)
       ON CONFLICT(vendor_id) DO UPDATE SET updated_at = excluded.updated_at`,
    )
    .run(vendorId, today())
  return true
}

/** Remove a favourite; true when it existed. */
export function removeFavorite(vendorId, handle = getDb()) {
  const info = handle.prepare('DELETE FROM favorites WHERE vendor_id = ?').run(vendorId)
  return Number(info.changes) > 0
}

/** List favourited vendor ids. */
export function listFavorites(handle = getDb()) {
  return handle.prepare('SELECT vendor_id FROM favorites ORDER BY vendor_id').all().map((r) => r.vendor_id)
}

/** Aggregate counts for the dashboard. */
export function stats(handle = getDb()) {
  const vendors = Number(handle.prepare('SELECT COUNT(*) AS n FROM vendors').get().n)
  const reviews = Number(handle.prepare('SELECT COUNT(*) AS n FROM reviews').get().n)
  const verified = Number(
    handle.prepare('SELECT COUNT(*) AS n FROM vendors WHERE fssai_verified = 1').get().n,
  )
  const areas = Number(handle.prepare('SELECT COUNT(DISTINCT area) AS n FROM vendors').get().n)
  return { vendors, reviews, verified, areas, open: 0, path: dbPath ?? ':memory:' }
}

/** Delete every review (admin "reset reviews" action). */
export function clearReviews(handle = getDb()) {
  const info = handle.prepare('DELETE FROM reviews').run()
  return Number(info.changes)
}
