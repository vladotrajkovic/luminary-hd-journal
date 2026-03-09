/**
 * scripts/download-ephe.js
 * Downloads Swiss Ephemeris data files for full-accuracy planetary calculations.
 *
 * Strategy:
 *  1. Check if swisseph-v2 npm package bundled SE1 files (free, no download needed)
 *  2. Try downloading from multiple sources
 *  3. Validate files are real SE1 format (magic bytes check) and sufficiently large
 */
const https = require('https')
const http  = require('http')
const fs    = require('fs')
const path  = require('path')

const EPHE_DIR = path.join(process.cwd(), 'ephe')
fs.mkdirSync(EPHE_DIR, { recursive: true })

const FILES = ['sepl_18.se1', 'semo_18.se1']

// SE1 files must be at least 5MB to contain real 1900-2000 data
const MIN_VALID_SIZE = 5 * 1024 * 1024

// Multiple sources to try, in order
const SOURCES = [
  // Primary: Swiss Ephemeris official FTP mirror via raw.githubusercontent.com
  // The moshier/ephemeris repo has the full SE files
  (f) => `https://raw.githubusercontent.com/moshier/ephemeris/master/ephe/${f}`,
  // Fallback 1: Direct GitHub raw (aloistr = official SE author)
  (f) => `https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/${f}`,
  // Fallback 2: via github.com/raw redirect  
  (f) => `https://github.com/aloistr/swisseph/raw/master/ephe/${f}`,
]

function isSE1File(filePath) {
  // SE1 binary files start with specific magic bytes: the file format identifier
  // SE1 files begin with a number like "2" followed by specific binary data
  // HTML files start with "<" (0x3C), JSON with "{" (0x7B)
  try {
    const buf = Buffer.alloc(4)
    const fd = fs.openSync(filePath, 'r')
    fs.readSync(fd, buf, 0, 4, 0)
    fs.closeSync(fd)
    // HTML page starts with < or space; SE1 binary starts with non-text bytes
    const firstByte = buf[0]
    if (firstByte === 0x3C || firstByte === 0x7B || firstByte === 0x7b) {
      return false // HTML or JSON
    }
    // SE1 files have a recognizable binary header, not plain ASCII
    return true
  } catch {
    return false
  }
}

function downloadFrom(url, dest) {
  return new Promise((resolve, reject) => {
    const tmp = dest + '.tmp'
    // Clean up any previous partial download
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp) } catch {}
    const file = fs.createWriteStream(tmp)

    function get(reqUrl, hops = 0) {
      if (hops > 10) return reject(new Error('Too many redirects'))
      const mod = reqUrl.startsWith('https://') ? https : http
      const req = mod.get(reqUrl, {
        timeout: 180_000,
        headers: {
          'User-Agent': 'Mozilla/5.0 swisseph-downloader',
          'Accept': 'application/octet-stream,*/*',
        }
      }, res => {
        if ([301, 302, 307, 308].includes(res.statusCode)) {
          res.resume()
          return get(res.headers.location, hops + 1)
        }
        if (res.statusCode !== 200) {
          file.close()
          try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp) } catch {}
          return reject(new Error(`HTTP ${res.statusCode} from ${reqUrl}`))
        }
        res.pipe(file)
        file.on('finish', () => {
          file.close(() => {
            const size = fs.statSync(tmp).size
            if (size < MIN_VALID_SIZE) {
              fs.unlinkSync(tmp)
              return reject(new Error(`File too small: ${(size/1e6).toFixed(2)}MB (need ≥5MB) — got HTML or stub file`))
            }
            if (!isSE1File(tmp)) {
              fs.unlinkSync(tmp)
              return reject(new Error('File is not valid SE1 binary (likely got HTML page)'))
            }
            fs.renameSync(tmp, dest)
            console.log(`  ✅ ${path.basename(dest)}: ${(size/1e6).toFixed(1)}MB`)
            resolve()
          })
        })
        file.on('error', err => { reject(err) })
      })
      req.on('error', err => { file.close(); reject(err) })
      req.on('timeout', () => { req.destroy(); reject(new Error('Download timeout')) })
    }

    get(url)
  })
}

async function ensureFile(filename) {
  const dest = path.join(EPHE_DIR, filename)

  // 1. Check swisseph-v2 npm package for bundled SE1 files
  const npmPaths = [
    path.join(process.cwd(), 'node_modules', 'swisseph-v2', 'ephe', filename),
    path.join(process.cwd(), 'node_modules', 'swisseph-v2', 'swisseph', 'ephe', filename),
    path.join(process.cwd(), 'node_modules', 'swisseph-v2', 'src', 'ephe', filename),
  ]
  for (const npmPath of npmPaths) {
    if (fs.existsSync(npmPath) && fs.statSync(npmPath).size >= MIN_VALID_SIZE) {
      console.log(`  ✅ ${filename}: found in swisseph-v2 package (${(fs.statSync(npmPath).size/1e6).toFixed(1)}MB)`)
      // Symlink or copy to our ephe dir
      try {
        fs.copyFileSync(npmPath, dest)
      } catch {
        fs.symlinkSync(npmPath, dest)
      }
      return true
    }
  }

  // 2. Check if we already have a valid file
  if (fs.existsSync(dest) && fs.statSync(dest).size >= MIN_VALID_SIZE && isSE1File(dest)) {
    console.log(`  ✅ ${filename}: already downloaded (${(fs.statSync(dest).size/1e6).toFixed(1)}MB)`)
    return true
  }

  // 3. Try each download source
  console.log(`  📥 ${filename}: downloading...`)
  for (let i = 0; i < SOURCES.length; i++) {
    const url = SOURCES[i](filename)
    try {
      await downloadFrom(url, dest)
      return true
    } catch (e) {
      console.log(`     Source ${i+1} failed: ${e.message}`)
    }
  }

  console.warn(`  ⚠️  ${filename}: all sources failed — using Moshier fallback`)
  return false
}

;(async () => {
  console.log('🔍 Checking Swiss Ephemeris data files...')

  // List swisseph-v2 package contents to help debug
  const pkgBase = path.join(process.cwd(), 'node_modules', 'swisseph-v2')
  if (fs.existsSync(pkgBase)) {
    const dirs = fs.readdirSync(pkgBase)
    console.log('   swisseph-v2 package dirs:', dirs.filter(d => !d.startsWith('.')).join(', '))
    const epheDir = path.join(pkgBase, 'ephe')
    if (fs.existsSync(epheDir)) {
      console.log('   swisseph-v2/ephe files:', fs.readdirSync(epheDir).join(', '))
    }
  }

  let allOk = true
  for (const f of FILES) {
    const ok = await ensureFile(f)
    if (!ok) allOk = false
  }

  if (allOk) {
    console.log('🌟 Swiss Ephemeris files ready — full accuracy mode enabled')
  } else {
    console.warn('⚠️  Some SE1 files missing — app will use Moshier fallback for affected planets')
  }
})()
