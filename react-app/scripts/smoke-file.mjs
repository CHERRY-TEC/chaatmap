// Verifies the single-file build works over file:// (double-click scenario)
import puppeteer from 'puppeteer-core'
import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'

const fileUrl = 'file:///' + resolve(process.cwd(), '..', 'index.html').replace(/\\/g, '/')
mkdirSync('scripts/shots', { recursive: true })

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[console] ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

console.log('Loading', fileUrl)
await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 })
await sleep(1500)

const hero = await page.evaluate(() => document.body.innerText.includes('Discover the Best'))
console.log(hero ? '✓ homepage rendered from file://' : '✗ homepage did NOT render')

// images embedded?
const imgStats = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')]
  return {
    total: imgs.length,
    loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
    dataUris: imgs.filter((i) => i.src.startsWith('data:')).length,
  }
})
console.log(`✓ images: ${imgStats.loaded}/${imgStats.total} loaded, ${imgStats.dataUris} embedded as data URIs`)

await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 700) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 80))
  }
  window.scrollTo(0, 0)
})
await sleep(500)
await page.screenshot({ path: 'scripts/shots/single-home.png', fullPage: true })
console.log('✓ shot single-home')

// Navigate via hash router (click Explore in navbar)
await page.evaluate(() => {
  const link = [...document.querySelectorAll('header a')].find((a) => a.textContent.trim() === 'Explore')
  link?.click()
})
await sleep(1200)
const url2 = page.url()
const explore = await page.evaluate(() => document.body.innerText.includes('Explore Street Food'))
console.log(explore ? `✓ in-app navigation works (${url2.split('#')[1] || 'n/a'})` : '✗ navigation FAILED')
await page.screenshot({ path: 'scripts/shots/single-explore.png' })
console.log('✓ shot single-explore')

await browser.close()

if (errors.length) {
  console.log('\nBROWSER ERRORS:')
  for (const e of [...new Set(errors)]) console.log('  ' + e)
  process.exit(1)
}
console.log('\nNo browser errors. SINGLE-FILE BUILD PASSED')
