/**
 * lib/swissEph.ts — Swiss Ephemeris via swisseph-v2
 *
 * Uses SE1 data files from ./ephe/ (copied from swisseph-v2 npm package
 * during build by scripts/download-ephe.js).
 *
 * ALL numeric constants are hardcoded — never trust swe.SEFLG_* exports.
 */

import path from 'path'
import fs from 'fs'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const swe = require('swisseph-v2')

// ── Hardcoded Swiss Ephemeris constants ────────────────────────────────────
const SE_SUN       = 0
const SE_MOON      = 1
const SE_MERCURY   = 2
const SE_VENUS     = 3
const SE_MARS      = 4
const SE_JUPITER   = 5
const SE_SATURN    = 6
const SE_URANUS    = 7
const SE_NEPTUNE   = 8
const SE_PLUTO     = 9
const SE_MEAN_NODE = 10
const SE_GREG_CAL  = 1
const SEFLG_SWIEPH = 2   // Full Swiss Ephemeris (SE1 data files)
const SEFLG_MOSEPH = 4   // Moshier fallback — no files, ~1 arcmin accuracy

// ── Find SE1 files and set ephemeris path ──────────────────────────────────
let FLAG = SEFLG_MOSEPH
let epheSource = 'Moshier (fallback)'

function hasRequiredFiles(dir: string): boolean {
  try {
    return (
      fs.existsSync(path.join(dir, 'sepl_18.se1')) &&
      fs.existsSync(path.join(dir, 'semo_18.se1'))
    )
  } catch { return false }
}

const candidatePaths = [
  path.join(process.cwd(), 'ephe'),                                       // copied at build time
  path.join(process.cwd(), 'node_modules', 'swisseph-v2', 'ephe'),        // npm bundle direct
  path.join(process.cwd(), 'node_modules', 'swisseph-v2', 'swisseph', 'ephe'),
  '/app/ephe',
]

for (const dir of candidatePaths) {
  if (hasRequiredFiles(dir)) {
    try {
      swe.swe_set_ephe_path(dir)
      FLAG = SEFLG_SWIEPH
      const pSz = fs.statSync(path.join(dir, 'sepl_18.se1')).size
      const mSz = fs.statSync(path.join(dir, 'semo_18.se1')).size
      epheSource = `SE1 files at ${dir} (${(pSz/1024).toFixed(0)}KB + ${(mSz/1024).toFixed(0)}KB)`
      break
    } catch (_) { /* try next path */ }
  }
}

console.log(`[swisseph] ${FLAG === SEFLG_SWIEPH ? '✅' : '⚠️ '} ${epheSource}`)

// ── Types ──────────────────────────────────────────────────────────────────
export interface PlanetPositions {
  sun: number; earth: number; moon: number
  northNode: number; southNode: number
  mercury: number; venus: number; mars: number
  jupiter: number; saturn: number; uranus: number
  neptune: number; pluto: number
}

function norm360(d: number): number {
  return ((d % 360) + 360) % 360
}

// ── Julian Day ─────────────────────────────────────────────────────────────
export function dateToJD(
  year: number, month: number, day: number,
  hour: number, minute: number
): number {
  try {
    const r = swe.swe_utc_to_jd(year, month, day, hour, minute, 0, SE_GREG_CAL)
    if (r?.julianDayUT > 0) return r.julianDayUT
  } catch (_) { /* fall through */ }

  try {
    const jd = swe.swe_julday(year, month, day, hour + minute / 60, SE_GREG_CAL)
    if (typeof jd === 'number' && jd > 0) return jd
  } catch (_) { /* fall through */ }

  // Manual JDN formula (always works)
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day
    + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)
    - 32045 - 0.5 + (hour + minute / 60) / 24
}

// ── Calculate one planet ───────────────────────────────────────────────────
function calcPlanet(jd: number, planetId: number, label: string): number {
  const tryFlag = (flag: number): number | null => {
    try {
      const r = swe.swe_calc_ut(jd, planetId, flag)
      if (r && typeof r.longitude === 'number' && r.longitude !== 0) return r.longitude
      if (Array.isArray(r) && typeof r[0] === 'number' && r[0] !== 0) return r[0]
      if (r?.data && typeof r.data[0] === 'number' && r.data[0] !== 0) return r.data[0]
    } catch (_) { /* ignore */ }
    return null
  }

  const result = tryFlag(FLAG) ?? tryFlag(SEFLG_MOSEPH)
  if (result !== null) return result

  console.warn(`[swisseph] ${label} (id=${planetId}): could not compute longitude`)
  return 0
}

// ── Compute just the sun (cheap — used for 88° arc design iteration) ───────
export function computeSunLongitude(jd: number): number {
  return calcPlanet(jd, SE_SUN, 'Sun')
}

// ── Compute all planets ────────────────────────────────────────────────────
export function computeAllPlanets(jd: number): PlanetPositions {
  const sun       = calcPlanet(jd, SE_SUN,       'Sun')
  const moon      = calcPlanet(jd, SE_MOON,      'Moon')
  const mercury   = calcPlanet(jd, SE_MERCURY,   'Mercury')
  const venus     = calcPlanet(jd, SE_VENUS,     'Venus')
  const mars      = calcPlanet(jd, SE_MARS,      'Mars')
  const jupiter   = calcPlanet(jd, SE_JUPITER,   'Jupiter')
  const saturn    = calcPlanet(jd, SE_SATURN,    'Saturn')
  const uranus    = calcPlanet(jd, SE_URANUS,    'Uranus')
  const neptune   = calcPlanet(jd, SE_NEPTUNE,   'Neptune')
  const pluto     = calcPlanet(jd, SE_PLUTO,     'Pluto')
  const northNode = calcPlanet(jd, SE_MEAN_NODE, 'NorthNode')

  const src = FLAG === SEFLG_SWIEPH ? 'SE1' : 'Moshier'
  console.log(`[swisseph] [${src}] jd=${jd.toFixed(4)} ☉=${sun.toFixed(4)} ☽=${moon.toFixed(4)} ♂=${mars.toFixed(4)} ♃=${jupiter.toFixed(4)} ☿=${mercury.toFixed(4)}`)

  return {
    sun,
    earth:     norm360(sun + 180),
    moon,
    northNode,
    southNode: norm360(northNode + 180),
    mercury,
    venus,
    mars,
    jupiter,
    saturn,
    uranus,
    neptune,
    pluto,
  }
}
