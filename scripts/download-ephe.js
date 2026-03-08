/**
 * scripts/download-ephe.js
 * Downloads Swiss Ephemeris data files for full-accuracy planetary calculations.
 * Called automatically before `next build` on Railway.
 *
 * Files: sepl_18.se1 (planets 1800-2400, ~22MB)
 *        semo_18.se1 (moon 1800-2400, ~22MB)
 */
const https = require('https')
const http  = require('http')
const fs    = require('fs')
const path  = require('path')

const EPHE_DIR = path.join(process.cwd(), 'ephe')
fs.mkdirSync(EPHE_DIR, { recursive: true })

const FILES = ['sepl_18.se1', 'semo_18.se1']
// Use raw GitHub URL — redirects to objects.githubusercontent.com
const BASE  = 'https://github.com/aloistr/swisseph/raw/master/ephe/'

function download(filename) {
  return new Promise((resolve, reject) => {
    const dest = path.join(EPHE_DIR, filename)

    // Skip if already downloaded and non-empty
    if (fs.existsSync(dest)) {
      const size = fs.statSync(dest).size
      if (size > 1_000_000) {
        console.log(`✅ ${filename} already present (${(size / 1e6).toFixed(1)} MB)`)
        return resolve()
      }
      fs.unlinkSync(dest) // Remove corrupt/partial file
    }

    console.log(`📥 Downloading ${filename}...`)
    const tmp = dest + '.tmp'
    const file = fs.createWriteStream(tmp)

    function get(url, hops = 0) {
      if (hops > 10) return reject(new Error('Too many redirects'))
      const mod = url.startsWith('https://') ? https : http
      const req = mod.get(url, { timeout: 120_000 }, res => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
          res.resume()
          return get(res.headers.location, hops + 1)
        }
        if (res.statusCode !== 200) {
          file.close()
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        }
        res.pipe(file)
        file.on('finish', () => {
          file.close(() => {
            fs.renameSync(tmp, dest)
            const size = fs.statSync(dest).size
            console.log(`✅ ${filename} done (${(size / 1e6).toFixed(1)} MB)`)
            resolve()
          })
        })
      })
      req.on('error', err => { file.close(); reject(err) })
      req.on('timeout', () => { req.destroy(); reject(new Error('Download timeout')) })
    }

    get(BASE + filename)
  })
}

;(async () => {
  let anyFailed = false
  for (const f of FILES) {
    try {
      await download(f)
    } catch (e) {
      console.warn(`⚠️  Could not download ${f}: ${e.message}`)
      console.warn('   App will use Moshier fallback (lower accuracy for some planets)')
      anyFailed = true
    }
  }
  if (!anyFailed) {
    console.log('🌟 Swiss Ephemeris files ready — full accuracy mode enabled')
  }
})()
