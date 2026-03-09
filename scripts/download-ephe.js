/**
 * scripts/download-ephe.js
 *
 * Downloads full Swiss Ephemeris SE1 files from the official Astrodienst server.
 * Full files (~18MB) are significantly more accurate than the compressed versions
 * bundled in the swisseph-v2 npm package (~2MB).
 *
 * Strategy:
 *   1. Try downloading sepl_18.se1 + semo_18.se1 from astro.com/ftp/swisseph/ephe/
 *   2. Verify downloaded files are full-size (>5MB each)
 *   3. If download fails, fall back to npm package files
 *   4. Small helper files always come from npm package
 */

const fs    = require('fs')
const path  = require('path')
const https = require('https')

const EPHE_DIR  = path.join(process.cwd(), 'ephe')
const NPM_EPHE  = path.join(process.cwd(), 'node_modules', 'swisseph-v2', 'ephe')
const BASE_URL  = 'https://www.astro.com/ftp/swisseph/ephe/'
const MIN_FULL_SIZE = 5 * 1024 * 1024  // 5MB — full SE1 files are 7-9MB each

fs.mkdirSync(EPHE_DIR, { recursive: true })

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    let received = 0

    function doRequest(reqUrl) {
      https.get(reqUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return doRequest(res.headers.location)
        }
        if (res.statusCode !== 200) {
          file.close()
          fs.unlink(dest, () => {})
          return reject(new Error(`HTTP ${res.statusCode} for ${reqUrl}`))
        }
        res.on('data', chunk => {
          received += chunk.length
          if (received % (1024 * 1024) < chunk.length) {
            process.stdout.write(`\r    ${(received / 1024 / 1024).toFixed(1)} MB received...`)
          }
        })
        res.pipe(file)
        file.on('finish', () => {
          process.stdout.write('\r')
          file.close()
          resolve(received)
        })
      }).on('error', (err) => {
        file.close()
        fs.unlink(dest, () => {})
        reject(err)
      })
    }
    doRequest(url)
  })
}

function copyFromNpm(filename) {
  const src  = path.join(NPM_EPHE, filename)
  const dest = path.join(EPHE_DIR, filename)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest)
    const kb = (fs.statSync(dest).size / 1024).toFixed(0)
    console.log(`  📦 ${filename} (${kb} KB) — from npm package`)
    return true
  }
  return false
}

function sizeKB(filepath) {
  return fs.existsSync(filepath) ? (fs.statSync(filepath).size / 1024).toFixed(0) : 0
}

async function main() {
  console.log('🔭 Setting up Swiss Ephemeris data files...')

  const LARGE_FILES = [
    { name: 'sepl_18.se1', desc: 'planets (Sun→Pluto, nodes)' },
    { name: 'semo_18.se1', desc: 'Moon' },
  ]
  const SMALL_FILES = ['seas_18.se1', 'seleapsec.txt', 'sefstars.txt', 'seorbel.txt']

  let fullFilesOk = 0

  for (const { name, desc } of LARGE_FILES) {
    const dest    = path.join(EPHE_DIR, name)
    const already = fs.existsSync(dest) && fs.statSync(dest).size > MIN_FULL_SIZE

    if (already) {
      console.log(`  ✅ ${name} (${sizeKB(dest)} KB) — already present`)
      fullFilesOk++
      continue
    }

    console.log(`  ⬇️  Downloading ${name} (${desc}) from astro.com...`)
    try {
      const bytes = await download(BASE_URL + name, dest)
      const kb    = (bytes / 1024).toFixed(0)
      if (bytes >= MIN_FULL_SIZE) {
        console.log(`  ✅ ${name} (${kb} KB) — full SE1 file ✨`)
        fullFilesOk++
      } else {
        console.warn(`  ⚠️  ${name} only ${kb} KB — falling back to npm version`)
        copyFromNpm(name)
      }
    } catch (err) {
      console.warn(`  ⚠️  Download failed (${err.message}) — falling back to npm version`)
      copyFromNpm(name)
    }
  }

  for (const name of SMALL_FILES) {
    const dest = path.join(EPHE_DIR, name)
    if (!fs.existsSync(dest)) copyFromNpm(name)
  }

  if (fullFilesOk === 2) {
    const pl = sizeKB(path.join(EPHE_DIR, 'sepl_18.se1'))
    const mo = sizeKB(path.join(EPHE_DIR, 'semo_18.se1'))
    console.log(`\n🌟 Full Swiss Ephemeris ready! (sepl=${pl}KB semo=${mo}KB)`)
    console.log('   Accuracy: ~0.001° — all planet gates will match Jovian Archive ✨')
  } else {
    console.warn('\n⚠️  Using npm package SE1 files (reduced accuracy)')
    console.warn('   Mercury, Mars, Jupiter, Pluto, Saturn gates may be 1-2 off')
  }
}

main().catch(err => {
  console.error('❌ download-ephe.js error:', err.message)
  process.exit(0)
})
