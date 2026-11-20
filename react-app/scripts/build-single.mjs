// Builds ONE self-contained chaatmap/index.html:
//   - inlines the JS bundle and CSS into the HTML
//   - embeds every image as a base64 data URI
// Run: npm run build:single   (vite build runs first)
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = process.cwd()
const dist = join(root, 'dist')
let html = readFileSync(join(dist, 'index.html'), 'utf8')

// 1. Inline JS bundles
let jsCount = 0
html = html.replace(/<script[^>]*src="[^"]*assets\/([^"]+\.js)"[^>]*><\/script>/g, (_, file) => {
  const js = readFileSync(join(dist, 'assets', file), 'utf8').replace(/<\/script/gi, '<\\/script')
  jsCount++
  return `<script type="module">${js}</script>`
})

// 2. Inline CSS
let cssCount = 0
html = html.replace(/<link[^>]*href="[^"]*assets\/([^"]+\.css)"[^>]*>/g, (_, file) => {
  const css = readFileSync(join(dist, 'assets', file), 'utf8').replace(/<\/style/gi, '<\\/style')
  cssCount++
  return `<style>${css}</style>`
})

// 3. Embed every image as base64 (correct MIME from magic bytes)
const imgDir = join(dist, 'images')
let imgCount = 0
if (existsSync(imgDir)) {
  for (const file of readdirSync(imgDir)) {
    const buf = readFileSync(join(imgDir, file))
    const mime = buf[0] === 0x89 && buf[1] === 0x50 ? 'image/png' : 'image/jpeg'
    const dataUri = `data:${mime};base64,${buf.toString('base64')}`
    html = html.split(`/images/${file}`).join(dataUri)
    imgCount++
  }
}

// Sanity checks
if (!jsCount) throw new Error('No JS bundle found to inline — check vite build output')
if (!cssCount) throw new Error('No CSS bundle found to inline')
const leftovers = html.match(/\/images\/[a-z0-9-]+\.jpg/g)
if (leftovers) throw new Error(`Unreplaced image refs: ${[...new Set(leftovers)].join(', ')}`)

const out = join(resolve(root, '..'), 'index.html')
writeFileSync(out, html)
const mb = (Buffer.byteLength(html) / 1024 / 1024).toFixed(1)
console.log(`✓ Wrote ${out}`)
console.log(`  inlined ${jsCount} JS + ${cssCount} CSS bundle(s), ${imgCount} images → ${mb} MB`)
