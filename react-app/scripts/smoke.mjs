// Headless smoke test: renders every route, captures console errors,
// screenshots pages, and submits a hygiene review end-to-end.
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5180'
const SHOTS = 'scripts/shots'
mkdirSync(SHOTS, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[console] ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function autoScroll() {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 100))
    }
    window.scrollTo(0, 0)
  })
  await sleep(400)
}

const routes = [
  ['/', 'home', true],
  ['/explore', 'explore', false],
  ['/categories', 'categories', false],
  ['/vendor/mahalaxmi-chaat-center', 'vendor', true],
  ['/review/mahalaxmi-chaat-center', 'review', false],
  ['/trails', 'trails', true],
  ['/map', 'map', false],
  ['/about', 'about', true],
  ['/auth', 'auth', false],
  ['/admin', 'admin', false],
  ['/no-such-page', '404', false],
]

for (const [path, name, full] of routes) {
  const url = path === '/' ? `${BASE}/#/` : `${BASE}/#${path}`
  await page.goto(url, { waitUntil: 'load', timeout: 45000 })
  await sleep(900) // AppContext simulated load delay is 350ms
  if (full) await autoScroll()
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full })
  console.log(`✓ shot ${name}`)
}

// --- End-to-end: submit a hygiene review ---
await page.goto(`${BASE}/#/review/sri-sai-dosa-corner`, { waitUntil: 'load' })
await sleep(900)
await page.type('input[placeholder="e.g. Aarav Reddy"]', 'Smoke Tester')
// overall experience = 5 stars (5th radio in the radiogroup)
const groups = await page.$$('[role="radiogroup"]')
if (groups[0]) {
  const btns = await groups[0].$$('button')
  await btns[4].click()
}
// four criteria: pick 4,5,4,4 via aria-labels
for (const label of [
  'Clean / RO Water Used: 4 of 5',
  'Covered Food Display: 5 of 5',
  'Gloves / Headgear Usage: 4 of 5',
  'Surroundings Cleanliness: 4 of 5',
]) {
  await page.click(`button[aria-label="${label}"]`)
}
await page.type('textarea', 'Counter was clean, staff used tongs.')
await page.click('button[type="submit"]')
await sleep(600)
const success = await page.evaluate(() => document.body.innerText.includes('Review submitted!'))
console.log(success ? '✓ review submitted end-to-end' : '✗ REVIEW SUBMIT FAILED')
await page.screenshot({ path: `${SHOTS}/review-success.png` })

// --- Explore filter interaction ---
await page.goto(`${BASE}/#/explore`, { waitUntil: 'load' })
await sleep(900)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Pani Puri'))
  btn?.click()
})
await sleep(500)
const filtered = await page.evaluate(() => document.body.innerText.includes('1 vendor found'))
console.log(filtered ? '✓ category filter works' : '✗ category filter check inconclusive')
await page.screenshot({ path: `${SHOTS}/explore-filtered.png` })

// --- Mobile viewport (390 × 844) ---
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
for (const [path, name] of [
  ['/', 'mobile-home'],
  ['/explore', 'mobile-explore'],
  ['/vendor/mahalaxmi-chaat-center', 'mobile-vendor'],
]) {
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 45000 })
  await sleep(900)
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: name === 'mobile-home' })
  console.log(`✓ shot ${name}`)
}
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
)
console.log(overflow <= 1 ? '✓ no horizontal overflow (mobile)' : `✗ horizontal overflow: ${overflow}px`)

await browser.close()

if (errors.length) {
  console.log('\nBROWSER ERRORS:')
  for (const e of [...new Set(errors)]) console.log('  ' + e)
  process.exit(1)
}
console.log('\nNo browser errors. SMOKE TEST PASSED')
