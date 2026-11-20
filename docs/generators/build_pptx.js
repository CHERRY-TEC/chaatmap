/* ChaatMap submission/evaluation deck — 12 slides, topic-informed warm palette. */
const pptxgen = require('pptxgenjs')

const BRAND = 'F45116'
const INK = '211B19'
const CREAM = 'FFF7EF'
const LINE = 'F2E2D6'
const GREEN = '18864B'
const MUTED = '7A6F6A'
const WHITE = 'FFFFFF'
const GOLD = 'E8A200'

const pres = new pptxgen()
pres.layout = 'LAYOUT_WIDE' // 13.3 x 7.5 inches
pres.author = 'ChaatMap Team'
pres.title = 'ChaatMap — Street Food Discovery with Transparent Hygiene Scores'
pres.subject = 'Project submission / evaluation'
pres.lang = 'en-US'
pres.theme = {
  headFontFace: 'Cambria',
  bodyFontFace: 'Calibri',
  lang: 'en-US',
}

const F = { head: 'Cambria', body: 'Calibri' }

/* ---------- shared helpers ---------- */

function titleSlide(pres, { kicker, title, subtitle, dark = true }) {
  const s = pres.addSlide()
  s.background = { color: dark ? INK : CREAM }
  if (kicker) {
    s.addText(kicker.toUpperCase(), {
      x: 0.85, y: 0.75, w: 8, h: 0.35, fontFace: F.body, fontSize: 13,
      bold: true, charSpacing: 3, color: dark ? BRAND : GREEN, margin: 0,
    })
  }
  s.addText(title, {
    x: 0.85, y: 1.3, w: 11.6, h: 2.4, fontFace: F.head, fontSize: 44,
    bold: true, color: dark ? WHITE : INK, margin: 0, valign: 'top',
  })
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.85, y: 3.9, w: 10.8, h: 1.1, fontFace: F.body, fontSize: 18,
      color: dark ? CREAM : INK, margin: 0, lineSpacingMultiple: 1.15,
    })
  }
  return s
}

function contentSlide(pres, title, opts = {}) {
  const s = pres.addSlide()
  s.background = { color: opts.dark ? INK : WHITE }
  s.addText(title, {
    x: 0.7, y: 0.45, w: 11.9, h: 0.7, fontFace: F.head, fontSize: 32,
    bold: true, color: opts.dark ? WHITE : INK, margin: 0,
  })
  if (opts.subtitle) {
    s.addText(opts.subtitle, {
      x: 0.72, y: 1.15, w: 11.6, h: 0.45, fontFace: F.body, fontSize: 14,
      color: opts.dark ? CREAM : MUTED, margin: 0,
    })
  }
  // page number
  s.addText(String(opts.page).padStart(2, '0'), {
    x: 12.25, y: 7.05, w: 0.5, h: 0.25, fontFace: F.body, fontSize: 10,
    color: opts.dark ? MUTED : MUTED, align: 'right', margin: 0,
  })
  return s
}

function iconCircle(slide, x, y, label, color, size = 0.62) {
  slide.addShape(pres.ShapeType.ellipse, {
    x, y, w: size, h: size, fill: { color }, line: { color },
  })
  slide.addText(label, {
    x, y, w: size, h: size, fontFace: F.body, fontSize: 18, bold: true,
    color: WHITE, align: 'center', valign: 'mid', margin: 0,
  })
}

function card(slide, x, y, w, h, fill = CREAM) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: fill }, line: { color: LINE, width: 1 },
  })
}

/* ===================================================================== */
/* 1 — TITLE                                                              */
/* ===================================================================== */
{
  const s = titleSlide(pres, {
    kicker: 'Project Submission · 2026',
    title: 'ChaatMap',
    subtitle: 'Street food discovery with transparent, community-driven hygiene scores.\nDiscover the Best Chaat & Street Food Near You!',
    dark: true,
  })
  // decorative motif: concentric arcs / dots in brand orange
  ;[3.4, 2.5, 1.6].forEach((d, i) => {
    s.addShape(pres.ShapeType.ellipse, {
      x: 10.3 + i * 0.45, y: 1.0 + i * 0.45, w: d, h: d,
      fill: { color: INK }, line: { color: BRAND, width: 2 - i * 0.5 },
    })
  })
  s.addShape(pres.ShapeType.ellipse, {
    x: 10.3, y: 1.0, w: 0.55, h: 0.55,
    fill: { color: BRAND }, line: { color: BRAND },
  })
  s.addText('React · Express · SQLite · Leaflet   |   245 automated tests', {
    x: 0.85, y: 6.55, w: 11, h: 0.4, fontFace: F.body, fontSize: 13,
    color: BRAND, charSpacing: 1, margin: 0,
  })
  s.addNotes('ChaatMap is a full-stack street food discovery platform. The core differentiator is a transparent four-factor hygiene score derived from community reviews.')
}

/* ===================================================================== */
/* 2 — PROBLEM & SOLUTION                                                 */
/* ===================================================================== */
{
  const s = contentSlide(pres, 'The Problem & Our Solution', {
    subtitle: 'Ratings alone do not tell you whether a street food stall is hygienic.', page: 2,
  })
  // Left: problem card
  card(s, 0.7, 1.75, 5.75, 4.9, CREAM)
  s.addText('THE PROBLEM', {
    x: 1.0, y: 2.05, w: 5, h: 0.4, fontFace: F.body, fontSize: 13,
    bold: true, charSpacing: 2, color: BRAND, margin: 0,
  })
  const problems = [
    'Star ratings say nothing about water, gloves or food covering',
    'No comparable hygiene signal across vendors',
    'FSSAI / safety claims are opaque or unverifiable',
    'Diners cannot make an informed, quick choice',
  ]
  problems.forEach((p, i) => {
    s.addText(p, {
      x: 1.05, y: 2.7 + i * 0.86, w: 5.1, h: 0.72, fontFace: F.body,
      fontSize: 14, color: INK, margin: 0, valign: 'mid',
      bullet: { code: '2715' }, breakLine: false,
    })
  })
  // Right: solution card
  card(s, 6.85, 1.75, 5.75, 4.9, INK)
  s.addText('OUR SOLUTION', {
    x: 7.15, y: 2.05, w: 5, h: 0.4, fontFace: F.body, fontSize: 13,
    bold: true, charSpacing: 2, color: 'F9A37E', margin: 0,
  })
  const solutions = [
    'Four-factor hygiene score (0–5), weighted and transparent',
    'Community reviews update scores instantly',
    'Per-factor breakdown shown on every vendor page',
    'FSSAI badges only after explicit admin verification',
  ]
  solutions.forEach((p, i) => {
    s.addText(p, {
      x: 7.2, y: 2.7 + i * 0.86, w: 5.1, h: 0.72, fontFace: F.body,
      fontSize: 14, color: WHITE, margin: 0, valign: 'mid',
      bullet: { code: '2713' }, breakLine: false,
    })
  })
  s.addNotes('We identified that existing discovery apps rely on generic star ratings. ChaatMap adds an objective, four-factor hygiene signal that locals rate and the app computes transparently.')
}

/* ===================================================================== */
/* 3 — FEATURES OVERVIEW (icon grid)                                      */
/* ===================================================================== */
{
  const s = contentSlide(pres, 'What ChaatMap Does', {
    subtitle: 'Ten fully implemented routes, from discovery to admin.', page: 3,
  })
  const items = [
    ['01', 'Discover', 'Search, filters, area selector and interactive map', BRAND],
    ['02', 'Review', 'Four-factor hygiene form with instant recalculation', GREEN],
    ['03', 'Explore', 'Categories, curated trails, per-factor breakdowns', GOLD],
    ['04', 'Personalise', 'Favourites, demo auth, admin dashboard', BRAND],
  ]
  items.forEach((it, i) => {
    const x = 0.7 + (i % 2) * 6.15
    const y = 1.75 + Math.floor(i / 2) * 2.55
    card(s, x, y, 5.8, 2.25, WHITE)
    iconCircle(s, x + 0.3, y + 0.35, it[0], it[3], 0.7)
    s.addText(it[1], {
      x: x + 1.2, y: y + 0.28, w: 4.3, h: 0.45, fontFace: F.head,
      fontSize: 20, bold: true, color: INK, margin: 0,
    })
    s.addText(it[2], {
      x: x + 1.2, y: y + 0.85, w: 4.3, h: 1.1, fontFace: F.body,
      fontSize: 13, color: MUTED, margin: 0, valign: 'top',
    })
  })
  s.addNotes('The app has ten pages plus a styled 404: Home, Explore, Categories, Vendor Details, Map, Review, Trails, About, Auth and Admin.')
}

/* ===================================================================== */
/* 4 — HYGIENE FORMULA (hero visual)                                      */
/* ===================================================================== */
{
  const s = contentSlide(pres, 'The Hygiene Score — Transparent by Design', {
    subtitle: 'Every number is derived from reviews at runtime — never hardcoded.', page: 4,
    dark: true,
  })
  // Big formula banner
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.7, y: 1.75, w: 11.9, h: 1.35, rectRadius: 0.08,
    fill: { color: INK }, line: { color: BRAND, width: 2 },
  })
  s.addText('SCORE  =  0.40 × Water  +  0.25 × Covered  +  0.20 × Gloves  +  0.15 × Surroundings', {
    x: 0.95, y: 1.9, w: 11.4, h: 1.0, fontFace: F.body, fontSize: 20,
    bold: true, color: WHITE, align: 'center', valign: 'mid', margin: 0,
  })
  // Four weight cards
  const weights = [
    ['40%', 'Clean / RO Water', BRAND],
    ['25%', 'Covered Display', GOLD],
    ['20%', 'Gloves / Headgear', 'E07A3F'],
    ['15%', 'Surroundings', GREEN],
  ]
  weights.forEach((w, i) => {
    const x = 0.7 + i * 3.02
    card(s, x, 3.45, 2.8, 1.7, INK)
    s.addText(w[0], {
      x: x, y: 3.6, w: 2.8, h: 0.7, fontFace: F.head, fontSize: 34,
      bold: true, color: w[2], align: 'center', margin: 0,
    })
    s.addText(w[1], {
      x: x + 0.1, y: 4.35, w: 2.6, h: 0.6, fontFace: F.body, fontSize: 12,
      color: CREAM, align: 'center', margin: 0,
    })
  })
  s.addText([
    { text: '0 is a valid rating (rated as poor), not “unset”. ', options: { color: CREAM } },
    { text: 'No reviews → score shows “—”. ', options: { color: 'F9A37E', bold: true } },
    { text: 'Adding / deleting a review recomputes instantly.', options: { color: CREAM } },
  ], {
    x: 0.8, y: 5.6, w: 11.7, h: 0.8, fontFace: F.body, fontSize: 14,
    align: 'center', margin: 0,
  })
  s.addNotes('The formula weights four criteria (40/25/20/15). Each is rated 0-5. Vendor score averages each criterion across reviews, applies weights, and rounds to one decimal. Missing fields are skipped, never counted as zero.')
}

/* ===================================================================== */
/* 5 — ARCHITECTURE                                                       */
/* ===================================================================== */
{
  const s = contentSlide(pres, 'System Architecture — Three Tiers', {
    subtitle: 'Automatic client-side fallback keeps the single-file build working.', page: 5,
  })
  const tiers = [
    ['React Client', 'HashRouter · Context API\napi.js with localStorage fallback', BRAND],
    ['Express REST API', 'Validation · server-derived auth\nstructured JSON logging · CORS', GREEN],
    ['SQLite Database', 'node:sqlite · vendors / reviews\nfavorites · seeded from src/data', INK],
  ]
  tiers.forEach((t, i) => {
    const x = 0.7 + i * 4.2
    card(s, x, 2.0, 3.8, 2.7, i === 2 ? INK : CREAM)
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.25, y: 2.25, w: 3.3, h: 0.6, rectRadius: 0.06,
      fill: { color: t[2] }, line: { color: t[2] },
    })
    s.addText(t[0], {
      x: x + 0.25, y: 2.25, w: 3.3, h: 0.6, fontFace: F.head, fontSize: 16,
      bold: true, color: WHITE, align: 'center', valign: 'mid', margin: 0,
    })
    s.addText(t[1], {
      x: x + 0.3, y: 3.05, w: 3.2, h: 1.4, fontFace: F.body, fontSize: 13,
      color: i === 2 ? CREAM : INK, align: 'center', valign: 'top', margin: 0,
    })
    if (i < 2) {
      s.addText('→', {
        x: x + 3.82, y: 2.95, w: 0.4, h: 0.6, fontFace: F.body, fontSize: 26,
        bold: true, color: BRAND, align: 'center', margin: 0,
      })
    }
  })
  s.addText([
    { text: 'Shared code: ', options: { bold: true, color: INK } },
    { text: 'validation.js, hygiene.js and optimizer.js run identically in the browser and on the API — no calculation drift.', options: { color: MUTED } },
  ], {
    x: 0.8, y: 5.2, w: 11.7, h: 0.7, fontFace: F.body, fontSize: 14,
    align: 'center', margin: 0,
  })
  s.addShape(pres.ShapeType.roundRect, {
    x: 2.2, y: 6.15, w: 8.9, h: 0.65, rectRadius: 0.06,
    fill: { color: CREAM }, line: { color: LINE },
  })
  s.addText('Boot: probe /api/health → API answers? use SQLite  ·  no answer? use localStorage', {
    x: 2.3, y: 6.15, w: 8.7, h: 0.65, fontFace: F.body, fontSize: 12.5,
    color: INK, align: 'center', valign: 'mid', margin: 0,
  })
  s.addNotes('The browser probes health on boot. If the API is up, reads and writes go to SQLite. Otherwise it falls back to localStorage. This single build works as a file, a static site and a full stack app.')
}

/* ===================================================================== */
/* 6 — ALGORITHMS                                                         */
/* ===================================================================== */
{
  const s = contentSlide(pres, 'Algorithmic Depth', {
    subtitle: 'Real optimisation, not decorative code — exposed through the API.', page: 6,
  })
  const algos = [
    ['Nearest Neighbour', 'Greedy construction of a short walking route through selected stops.', BRAND],
    ['2-opt Local Search', 'Repeated segment reversal removes crossings until no improving swap remains.', GREEN],
    ['Budget Planner', 'Greedy value-per-rupee fill + randomized swaps (knapsack variant).', GOLD],
  ]
  algos.forEach((a, i) => {
    const y = 1.8 + i * 1.35
    card(s, 0.7, y, 7.4, 1.15, WHITE)
    iconCircle(s, 0.95, y + 0.26, String(i + 1), a[2], 0.6)
    s.addText(a[0], {
      x: 1.75, y: y + 0.12, w: 6.1, h: 0.4, fontFace: F.head, fontSize: 17,
      bold: true, color: INK, margin: 0,
    })
    s.addText(a[1], {
      x: 1.75, y: y + 0.55, w: 6.1, h: 0.5, fontFace: F.body, fontSize: 12.5,
      color: MUTED, margin: 0,
    })
  })
  // right stat panel
  card(s, 8.4, 1.8, 4.2, 4.85, INK)
  s.addText('API ENDPOINTS', {
    x: 8.7, y: 2.1, w: 3.6, h: 0.4, fontFace: F.body, fontSize: 12,
    bold: true, charSpacing: 2, color: 'F9A37E', margin: 0,
  })
  s.addText('POST /api/plan', {
    x: 8.7, y: 2.75, w: 3.6, h: 0.5, fontFace: F.body, fontSize: 16,
    bold: true, color: WHITE, margin: 0,
  })
  s.addText('Budget-aware day plan: picks stops under ₹ budget, then orders them by geography.', {
    x: 8.7, y: 3.25, w: 3.6, h: 1.0, fontFace: F.body, fontSize: 12,
    color: CREAM, margin: 0,
  })
  s.addText('POST /api/routes/optimize', {
    x: 8.7, y: 4.45, w: 3.6, h: 0.5, fontFace: F.body, fontSize: 15,
    bold: true, color: WHITE, margin: 0,
  })
  s.addText('Shortest walking order for a curated food trail.', {
    x: 8.7, y: 4.95, w: 3.6, h: 0.8, fontFace: F.body, fontSize: 12,
    color: CREAM, margin: 0,
  })
  s.addText('Deterministic · tested · injectable RNG', {
    x: 8.7, y: 6.05, w: 3.6, h: 0.4, fontFace: F.body, fontSize: 11,
    italic: true, color: BRAND, margin: 0,
  })
  s.addNotes('The router uses nearest-neighbour construction plus 2-opt refinement. The planner is a knapsack variant with greedy value-per-rupee selection and randomized local search. Both are deterministic and heavily unit-tested.')
}

/* ===================================================================== */
/* 7 — API & SECURITY                                                     */
/* ===================================================================== */
{
  const s = contentSlide(pres, 'REST API & Security', {
    subtitle: 'Documented with OpenAPI 3.1; validated on both sides of the wire.', page: 7,
  })
  // API endpoints list
  card(s, 0.7, 1.75, 6.0, 4.95, CREAM)
  s.addText('KEY ENDPOINTS', {
    x: 1.0, y: 2.0, w: 5.4, h: 0.4, fontFace: F.body, fontSize: 12,
    bold: true, charSpacing: 2, color: BRAND, margin: 0,
  })
  const eps = [
    'GET  /vendors  ·  list + filters',
    'GET  /vendors/:id  ·  detail',
    'POST /vendors/:id/reviews  ·  review',
    'PATCH /vendors/:id/fssai  ·  admin',
    'GET/POST/DELETE /favorites',
    'POST /plan  ·  POST /routes/optimize',
  ]
  eps.forEach((e, i) => {
    s.addText(e, {
      x: 1.0, y: 2.6 + i * 0.62, w: 5.4, h: 0.5, fontFace: 'Consolas',
      fontSize: 12, color: INK, margin: 0, valign: 'mid',
    })
  })
  // Security panel
  card(s, 7.0, 1.75, 5.6, 4.95, WHITE)
  s.addText('SECURITY POSTURE', {
    x: 7.3, y: 2.0, w: 5, h: 0.4, fontFace: F.body, fontSize: 12,
    bold: true, charSpacing: 2, color: GREEN, margin: 0,
  })
  const sec = [
    'Role derived server-side — body role ignored',
    'Shared validators, field-level 422 errors',
    'CORS allow-list, 32 KB body cap',
    'Prepared SQL statements, no stack leaks',
    'Request IDs + structured event logs',
  ]
  sec.forEach((t, i) => {
    s.addText(t, {
      x: 7.35, y: 2.65 + i * 0.72, w: 4.95, h: 0.6, fontFace: F.body,
      fontSize: 13, color: INK, margin: 0, valign: 'mid',
      bullet: { code: '2713' },
    })
  })
  s.addText('docs/API.md  ·  docs/openapi.yaml', {
    x: 0.8, y: 6.9, w: 11, h: 0.3, fontFace: F.body, fontSize: 11,
    italic: true, color: MUTED, margin: 0,
  })
  s.addNotes('Full API docs and an OpenAPI 3.1 spec ship with the repo. Security: roles derived from the x-chaatmap-user email prefix, only admin can set FSSAI, CORS allow-list, body cap, no stack traces.')
}

/* ===================================================================== */
/* 8 — TESTING                                                            */
/* ===================================================================== */
{
  const s = contentSlide(pres, 'Quality Assurance — 245 Tests', {
    subtitle: 'Every layer is covered, including the API over real HTTP.', page: 8,
    dark: true,
  })
  // big stat
  s.addText('245', {
    x: 0.8, y: 1.7, w: 3.2, h: 1.4, fontFace: F.head, fontSize: 76,
    bold: true, color: BRAND, margin: 0,
  })
  s.addText('tests passing', {
    x: 0.85, y: 3.05, w: 3, h: 0.4, fontFace: F.body, fontSize: 16,
    color: CREAM, margin: 0,
  })
  s.addText('8 test files · 84% line coverage', {
    x: 0.85, y: 3.5, w: 3.2, h: 0.6, fontFace: F.body, fontSize: 12,
    color: MUTED, margin: 0,
  })
  // test suites table
  const rows = [
    ['hygiene.test.js', '40', 'Formula, rounding, seed integrity'],
    ['validation.test.js', '50', 'Input & injection guards'],
    ['optimizer.test.js', '54', 'Geometry, 2-opt, budget invariants'],
    ['server/api.test.js', '53', 'Auth, FSSAI, errors, CORS'],
    ['components + context + page', '48', 'UI, store, form E2E'],
  ]
  const tblData = [
    ['SUITE', '#', 'FOCUS'],
    ...rows,
  ]
  const t = s.addTable(tblData, {
    x: 4.35, y: 1.8, w: 8.25, h: 4.6,
    fontFace: F.body, fontSize: 11.5, color: INK,
    border: { type: 'solid', color: LINE, pt: 0.5 },
    fill: { color: WHITE },
    colW: [3.4, 0.8, 4.05],
    rowH: 0.72,
  })
  // Also verify other QA
  s.addText('Also: ESLint clean · production + single-file builds · browser smoke tests at 360–1440 px with zero console errors', {
    x: 0.8, y: 6.25, w: 11.7, h: 0.7, fontFace: F.body, fontSize: 13,
    color: CREAM, align: 'center', margin: 0,
  })
  s.addNotes('245 tests across 8 files. The API suite runs against real HTTP with in-memory SQLite. Coverage is 84% of lines. ESLint is clean and smoke tests verify desktop and mobile with no console errors.')
}

/* ===================================================================== */
/* 9 — CI/CD                                                              */
/* ===================================================================== */
{
  const s = contentSlide(pres, 'CI/CD Pipeline', {
    subtitle: 'Every push and pull request is validated automatically.', page: 9,
  })
  const steps = [
    ['1', 'Checkout + Node 24', 'npm ci with cache'],
    ['2', 'Lint', 'ESLint must pass clean'],
    ['3', 'Test', 'All 245 Vitest tests'],
    ['4', 'Coverage', 'Report uploaded as artifact'],
    ['5', 'Build', 'Bundle + single-file HTML'],
    ['6', 'API boot', 'Start server, assert log'],
  ]
  steps.forEach((st, i) => {
    const x = 0.7 + (i % 3) * 4.2
    const y = 1.9 + Math.floor(i / 3) * 2.3
    card(s, x, y, 3.85, 1.95, i === 5 ? CREAM : WHITE)
    iconCircle(s, x + 0.3, y + 0.3, st[0], i === 5 ? GREEN : BRAND, 0.6)
    s.addText(st[1], {
      x: x + 1.05, y: y + 0.25, w: 2.6, h: 0.5, fontFace: F.head,
      fontSize: 16, bold: true, color: INK, margin: 0,
    })
    s.addText(st[2], {
      x: x + 0.35, y: y + 1.05, w: 3.2, h: 0.6, fontFace: F.body,
      fontSize: 12.5, color: MUTED, margin: 0,
    })
    if (i < 5 && i !== 2) {
      s.addText('→', {
        x: x + 3.85, y: y + 0.6, w: 0.35, h: 0.6, fontFace: F.body,
        fontSize: 22, bold: true, color: BRAND, align: 'center', margin: 0,
      })
    }
  })
  s.addShape(pres.ShapeType.roundRect, {
    x: 3.2, y: 6.65, w: 6.9, h: 0.55, rectRadius: 0.06,
    fill: { color: GREEN }, line: { color: GREEN },
  })
  s.addText('LATEST RUN: SUCCESS  ·  Pages deployment: HTTP 200', {
    x: 3.2, y: 6.65, w: 6.9, h: 0.55, fontFace: F.body, fontSize: 13,
    bold: true, color: WHITE, align: 'center', valign: 'mid', margin: 0,
  })
  s.addNotes('GitHub Actions runs lint, tests, coverage, both builds and an API boot check on every push. The latest run passed all steps.')
}

/* ===================================================================== */
/* 10 — DELIVERABLES                                                      */
/* ===================================================================== */
{
  const s = contentSlide(pres, 'Deliverables', {
    subtitle: 'Three ways to run it — one codebase.', page: 10,
  })
  const items = [
    ['Single-file build', 'index.html · 12.7 MB', 'All CSS, JS and 22 images inlined. Double-click to run offline.', BRAND],
    ['Static site', 'GitHub Pages', 'cherry-tec.github.io/chaatmap — works with no backend.', GREEN],
    ['Full stack', 'React + API + SQLite', 'npm run server + npm run dev for persistence and algorithms.', GOLD],
  ]
  items.forEach((it, i) => {
    const y = 1.8 + i * 1.55
    card(s, 0.7, y, 11.9, 1.35, i === 2 ? INK : CREAM)
    iconCircle(s, 0.95, y + 0.35, String(i + 1), it[3], 0.65)
    s.addText(it[0], {
      x: 1.85, y: y + 0.15, w: 3.5, h: 0.5, fontFace: F.head,
      fontSize: 18, bold: true, color: i === 2 ? WHITE : INK, margin: 0,
    })
    s.addText(it[1], {
      x: 1.85, y: y + 0.68, w: 3.5, h: 0.4, fontFace: 'Consolas',
      fontSize: 12, color: it[3], margin: 0,
    })
    s.addText(it[2], {
      x: 5.5, y: y + 0.25, w: 6.7, h: 0.9, fontFace: F.body, fontSize: 13,
      color: i === 2 ? CREAM : INK, margin: 0, valign: 'mid',
    })
  })
  s.addNotes('The deliverables are a single offline HTML file, a GitHub Pages deployment and a full-stack runnable source tree. The submission zip mirrors the git repo exactly: 83 files, no node_modules or build artifacts.')
}

/* ===================================================================== */
/* 11 — RUBRIC ALIGNMENT                                                  */
/* ===================================================================== */
{
  const s = contentSlide(pres, 'Rubric Alignment', {
    subtitle: 'Coverage of every evaluation dimension.', page: 11,
  })
  const data = [
    ['DIMENSION', 'EVIDENCE'],
    ['Requirements', '10 pages + 404, all interactions, responsive 360–1440 px'],
    ['Code quality', 'Modular shared libs, ESLint clean, prepared SQL, structured logs'],
    ['Functionality', '245 passing tests, smoke tests, instant recomputation'],
    ['System design', '3 tiers, graceful fallback, deterministic algorithms'],
    ['Security', 'Server-derived roles, CORS, validation, admin-only FSSAI'],
    ['Innovation', 'Real NN + 2-opt routing and randomized budget planner'],
  ]
  s.addTable(data, {
    x: 0.7, y: 1.75, w: 11.9, h: 4.9,
    fontFace: F.body, fontSize: 12.5, color: INK,
    border: { type: 'solid', color: LINE, pt: 0.5 },
    fill: { color: WHITE },
    colW: [3.2, 8.7], rowH: 0.68,
  })
  s.addNotes('This maps the work directly to the generic evaluation rubric: requirements fulfilment, code quality, functionality, system design, security and innovation.')
}

/* ===================================================================== */
/* 12 — CLOSING                                                           */
/* ===================================================================== */
{
  const s = titleSlide(pres, {
    kicker: 'Thank You',
    title: 'ChaatMap',
    subtitle: 'Discover better street food — with hygiene you can see, trust and verify.',
    dark: true,
  })
  s.addText('github.com/CHERRY-TEC/chaatmap', {
    x: 0.85, y: 5.5, w: 8, h: 0.5, fontFace: F.body, fontSize: 16,
    color: BRAND, margin: 0,
  })
  s.addText('cherry-tec.github.io/chaatmap', {
    x: 0.85, y: 6.0, w: 8, h: 0.5, fontFace: F.body, fontSize: 16,
    color: CREAM, margin: 0,
  })
  ;[2.8, 1.9, 1.0].forEach((d, i) => {
    s.addShape(pres.ShapeType.ellipse, {
      x: 9.9 + i * 0.45, y: 4.8 + i * 0.45, w: d, h: d,
      fill: { color: INK }, line: { color: i === 1 ? GREEN : BRAND, width: 2 },
    })
  })
  s.addNotes('ChaatMap is complete and verified: 245 tests passing, CI green, site live, zip ready for submission.')
}

pres.writeFile({ fileName: 'docs/ChaatMap-Presentation.pptx' }).then(() => {
  console.log('PPTX written: docs/ChaatMap-Presentation.pptx')
})
