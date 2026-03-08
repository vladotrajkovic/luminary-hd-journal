/**
 * lib/swissEph.ts — Swiss Ephemeris via swisseph-v2
 *
 * Uses full Swiss Ephemeris accuracy (SE1 data files) when available,
 * falling back to Moshier if files not yet downloaded.
 *
 * SE1 files are downloaded to ./ephe/ during Railway build by
 * scripts/download-ephe.js. With SE1 files, accuracy = 0.001 arcsec.
 * With Moshier fallback, accuracy = ~1 arcmin (may have gate-boundary errors).
 *
 * Hardcoded numeric constants — never rely on swe.SEFLG_* names.
 */

import path from 'path'
import fs from 'fs'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const swe = require('swisseph-v2')

// ── Numeric constants (never trust named exports from swisseph-v2) ────────────
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

const SEFLG_SWIEPH = 2   // Full Swiss Ephemeris (requires SE1 data files)
const SEFLG_MOSEPH = 4   // Moshier – no files needed but ~1 arcmin accuracy
// No SEFLG_SPEED – we don't use speed, it may cause issues

// ── Choose ephemeris based on file availability ───────────────────────────────
let FLAG = SEFLG_MOSEPH  // default fallback

try {
  const epheDir = path.join(process.cwd(), 'ephe')
  const hasFiles =
    fs.existsSync(path.join(epheDir, 'sepl_18.se1')) &&
    fs.existsSync(path.join(epheDir, 'semo_18.se1'))

  if (hasFiles) {
    swe.swe_set_ephe_path(epheDir)
    FLAG = SEFLG_SWIEPH
    console.log('[swisseph] ✅ Using full Swiss Ephemeris (SE1 files found at', epheDir, ')')
  } else {
    console.warn('[swisseph] ⚠️  SE1 files not found at', epheDir)
    console.warn('[swisseph]    Using Moshier fallback (lower accuracy)')
    console.warn('[swisseph]    Run: node scripts/download-ephe.js')
  }
} catch (e) {
  console.error('[swisseph] Error setting ephe path:', e)
}

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Julian Day conversion ─────────────────────────────────────────────────────
export function dateToJD(
  year: number, month: number, day: number,
  hour: number, minute: number
): number {
  // Try swe_utc_to_jd first
  try {
    const r = swe.swe_utc_to_jd(year, month, day, hour, minute, 0, SE_GREG_CAL)
    if (r && typeof r.julianDayUT === 'number' && r.julianDayUT > 0) return r.julianDayUT
  } catch (_) { /* fall through */ }

  // Fallback: swe_julday
  try {
    const jd = swe.swe_julday(year, month, day, hour + minute / 60, SE_GREG_CAL)
    if (typeof jd === 'number' && jd > 0) return jd
  } catch (_) { /* fall through */ }

  // Manual formula (always works)
  const decHour = hour + minute / 60
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day
    + Math.floor((153 * m + 2) / 5)
    + 365 * y
    + Math.floor(y / 4)
    - Math.floor(y / 100)
    + Math.floor(y / 400)
    - 32045
    - 0.5
    + decHour / 24
}

// ── Single planet calculation ─────────────────────────────────────────────────
function calcPlanet(jd: number, planetId: number, label: string): number {
  try {
    const result = swe.swe_calc_ut(jd, planetId, FLAG)

    // swisseph-v2 preferred return shape: { longitude, latitude, distance, ... }
    if (result && typeof result.longitude === 'number' && result.longitude !== 0) {
      return result.longitude
    }
    // Array-like (some builds)
    if (Array.isArray(result) && typeof result[0] === 'number' && result[0] !== 0) {
      return result[0]
    }
    // .data property (older builds)
    if (result?.data && typeof result.data[0] === 'number' && result.data[0] !== 0) {
      return result.data[0]
    }

    // If SE1 flag failed, try Moshier as fallback
    if (FLAG === SEFLG_SWIEPH) {
      console.warn(`[swisseph] ${label} SE1 result empty, trying Moshier fallback`)
      const r2 = swe.swe_calc_ut(jd, planetId, SEFLG_MOSEPH)
      if (r2 && typeof r2.longitude === 'number' && r2.longitude !== 0) return r2.longitude
      if (Array.isArray(r2) && typeof r2[0] === 'number' && r2[0] !== 0) return r2[0]
    }

    console.warn(`[swisseph] ${label} (id=${planetId}) unexpected result:`, JSON.stringify(result))
  } catch (e) {
    console.error(`[swisseph] ${label} (id=${planetId}) threw:`, e)
  }
  return 0
}

// ── Compute all planets for a Julian Day ─────────────────────────────────────
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

  const ephType = FLAG === SEFLG_SWIEPH ? 'SE1' : 'Moshier'
  console.log(`[swisseph] [${ephType}] jd=${jd.toFixed(4)} Sun=${sun.toFixed(4)} Moon=${moon.toFixed(4)} Mars=${mars.toFixed(4)} Jup=${jupiter.toFixed(4)} Mer=${mercury.toFixed(4)}`)

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
