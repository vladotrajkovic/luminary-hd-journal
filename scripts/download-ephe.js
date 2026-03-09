/**
 * scripts/download-ephe.js
 * Sets up Swiss Ephemeris data files from the swisseph-v2 npm package.
 *
 * The swisseph-v2 package bundles SE1 files in node_modules/swisseph-v2/ephe/
 * We just copy them to ./ephe/ so swe_set_ephe_path can find them.
 * No external download needed.
 */
const fs   = require('fs')
const path = require('path')

const EPHE_DIR = path.join(process.cwd(), 'ephe')
fs.mkdirSync(EPHE_DIR, { recursive: true })

const FILES = ['sepl_18.se1', 'semo_18.se1', 'seas_18.se1', 'seleapsec.txt', 'sefstars.txt', 'seorbel.txt']

const NPM_EPHE = path.join(process.cwd(), 'node_modules', 'swisseph-v2', 'ephe')

console.log('🔍 Setting up Swiss Ephemeris data files...')

if (!fs.existsSync(NPM_EPHE)) {
  console.error('❌ swisseph-v2/ephe not found — ephemeris files unavailable')
  process.exit(0) // non-fatal, Moshier fallback will be used
}

let copied = 0
for (const f of FILES) {
  const src  = path.join(NPM_EPHE, f)
  const dest = path.join(EPHE_DIR, f)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest)
    const size = fs.statSync(dest).size
    console.log(`  ✅ ${f} (${(size/1024).toFixed(0)} KB)`)
    copied++
  } else {
    console.log(`  ⏭️  ${f} not in package (optional)`)
  }
}

if (copied >= 2) {
  console.log(`🌟 Swiss Ephemeris ready (${copied} files copied from swisseph-v2 package)`)
} else {
  console.warn('⚠️  SE1 files not found in package — Moshier fallback will be used')
}
