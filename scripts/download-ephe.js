/**
 * scripts/download-ephe.js
 *
 * Sets up Swiss Ephemeris SE1 files for runtime use.
 *
 * The swisseph-v2 npm package bundles the complete, full-accuracy SE1 files:
 *   sepl_18.se1 (~473KB) — all planets (Sun through Pluto + nodes)
 *   semo_18.se1 (~1274KB) — Moon
 *
 * Note: 500KB/1300KB IS the correct size for SE1 format files per official
 * Swiss Ephemeris documentation. There is no larger version.
 */

const fs   = require('fs')
const path = require('path')

const DEST_DIR = path.join(process.cwd(), 'ephe')
const NPM_EPHE = path.join(process.cwd(), 'node_modules', 'swisseph-v2', 'ephe')
const FILES    = ['sepl_18.se1', 'semo_18.se1', 'seas_18.se1', 'seleapsec.txt', 'sefstars.txt', 'seorbel.txt']

fs.mkdirSync(DEST_DIR, { recursive: true })

console.log('🔭 Setting up Swiss Ephemeris data files...')

if (!fs.existsSync(NPM_EPHE)) {
  console.error('❌ swisseph-v2/ephe not found — Moshier fallback will be used')
  process.exit(0)
}

let copied = 0
for (const f of FILES) {
  const src  = path.join(NPM_EPHE, f)
  const dest = path.join(DEST_DIR, f)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest)
    const kb = (fs.statSync(dest).size / 1024).toFixed(0)
    console.log(`  ✅ ${f} (${kb} KB)`)
    copied++
  } else {
    console.log(`  ⏭️  ${f} not in package (optional)`)
  }
}

if (copied >= 2) {
  const pl = (fs.statSync(path.join(DEST_DIR, 'sepl_18.se1')).size / 1024).toFixed(0)
  const mo = (fs.statSync(path.join(DEST_DIR, 'semo_18.se1')).size / 1024).toFixed(0)
  console.log(`\n🌟 Swiss Ephemeris ready (sepl=${pl}KB semo=${mo}KB)`)
} else {
  console.warn('⚠️  SE1 files not found — Moshier fallback will be used')
}
