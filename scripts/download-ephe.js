/**
 * scripts/download-ephe.js
 *
 * Downloads full Swiss Ephemeris SE1 files from the official Astrodienst GitHub repo.
 * (github.com/aloistr/swisseph) — the authoritative source.
 *
 * Full files: sepl_18.se1 ~8MB, semo_18.se1 ~7MB
 * These give ~0.001° accuracy vs ~2-5° errors from the compressed npm package files.
 *
 * Download order (most reliable → least):
 *   1. GitHub raw (raw.githubusercontent.com) — CDN, very reliable
 *   2. Astrodienst FTP (astro.com/ftp/swisseph/ephe/) — official source
 *   3. npm package fallback — always works, lower accuracy
 */

const fs    = require('fs')
const path  = require('path')
const https = require('https')

const EPHE_DIR       = path.join(process.cwd(), 'ephe')
const NPM_EPHE       = path.join(process.cwd(), 'node_modules', 'swisseph-v2', 'ephe')
const MIN_FULL_SIZE  = 5 * 1024 * 1024  // 5MB minimum for a full SE1 file

// Official GitHub repo raw URLs
const GITHUB_BASE = 'https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/'
// FTP fallback
const FTP_BASE    = 'https://www.astro.com/ftp/swisseph/ephe/'

fs.mkdirSync(EPHE_DIR, { recursive: true })

// ── helpers ────────────────────────────────────────────────────────────────

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    let received = 0

    function doRequest(reqUrl) {
      https.get(reqUrl, { timeout: 60000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return doRequest(res.headers.location)
        }
        if (res.statusCode !== 200) {
          file.close()
          try { fs.unlinkSync(dest) } catch {}
          return reject(new Error(`HTTP ${res.statusCode}`))
        }
        res.on('data', chunk => {
          received += chunk.length
          if (received % (1024 * 1024) < chunk.length) {
            process.stdout.write(`\r    ${(received / 1024 / 1024).toFixed(1)} MB...`)
          }
        })
        res.pipe(file)
        file.on('finish', () => {
          process.stdout.write('\r                          \r')
          file.close()
          resolve(received)
        })
      }).on('error', err => {
        file.close()
        try { fs.unlinkSync(dest) } catch {}
        reject(err)
      })
    }
    doRequest(url)
  })
}

async function tryDownload(name) {
  const dest = path.join(EPHE_DIR, name)

  // Already have a full-size file?
  if (fs.existsSync(dest) && fs.statSync(dest).size >= MIN_FULL_SIZE) {
    const kb = (fs.statSync(dest).size / 1024).toFixed(0)
    console.log(`  ✅ ${name} (${kb} KB) — already present`)
    return true
  }

  // Try GitHub first
  for (const [label, base] of [['GitHub', GITHUB_BASE], ['astro.com FTP', FTP_BASE]]) {
    console.log(`  ⬇️  ${name} — trying ${label}...`)
    try {
      const bytes = await download(base + name, dest)
      const kb = (bytes / 1024).toFixed(0)
      if (bytes >= MIN_FULL_SIZE) {
        console.log(`  ✅ ${name} (${kb} KB) — full file from ${label} ✨`)
        return true
      } else {
        console.warn(`  ⚠️  Only ${kb} KB from ${label} — trying next source...`)
        try { fs.unlinkSync(dest) } catch {}
      }
    } catch (err) {
      console.warn(`  ⚠️  ${label} failed: ${err.message}`)
    }
  }
  return false
}

function copyFromNpm(filename) {
  const src  = path.join(NPM_EPHE, filename)
  const dest = path.join(EPHE_DIR, filename)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest)
    const kb = (fs.statSync(dest).size / 1024).toFixed(0)
    console.log(`  📦 ${filename} (${kb} KB) — npm package fallback`)
    return true
  }
  console.warn(`  ❌ ${filename} — not found in npm package either`)
  return false
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔭 Swiss Ephemeris setup — fetching full accuracy files...')
  console.log('   Source: github.com/aloistr/swisseph (official Astrodienst repo)\n')

  const LARGE = ['sepl_18.se1', 'semo_18.se1']
  const SMALL  = ['seas_18.se1', 'seleapsec.txt', 'sefstars.txt', 'seorbel.txt']

  let fullCount = 0

  for (const name of LARGE) {
    const ok = await tryDownload(name)
    if (ok) {
      fullCount++
    } else {
      console.log(`  📦 Falling back to npm package for ${name}`)
      copyFromNpm(name)
    }
  }

  for (const name of SMALL) {
    const dest = path.join(EPHE_DIR, name)
    if (!fs.existsSync(dest)) copyFromNpm(name)
  }

  console.log('')
  if (fullCount === 2) {
    const pl = (fs.statSync(path.join(EPHE_DIR, 'sepl_18.se1')).size / 1024).toFixed(0)
    const mo = (fs.statSync(path.join(EPHE_DIR, 'semo_18.se1')).size / 1024).toFixed(0)
    console.log(`🌟 Full Swiss Ephemeris ready! sepl=${pl}KB  semo=${mo}KB`)
    console.log('   All planet gates will match Jovian Archive ✨')
  } else if (fullCount === 1) {
    console.warn('⚠️  Only one full SE1 file — partial accuracy improvement')
  } else {
    console.warn('⚠️  Using npm package files — limited accuracy (some gates may differ)')
  }
}

main().catch(err => {
  console.error('❌ download-ephe.js crashed:', err.message)
  process.exit(0) // non-fatal — Moshier fallback will still work
})
