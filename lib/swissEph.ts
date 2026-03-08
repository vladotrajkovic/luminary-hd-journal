/**
 * lib/swissEph.ts — Swiss Ephemeris via swisseph-v2
 *
 * KEY FIX: Use hardcoded numeric constants instead of named constants
 * because swisseph-v2 may not export all constant names.
 *
 * Swiss Ephemeris flag constants (numeric):
 *   SEFLG_JPLEPH  = 1
 *   SEFLG_SWIEPH  = 2
 *   SEFLG_MOSEPH  = 4  ← Moshier, no file dependencies, ~1 arcmin
 *   SEFLG_SPEED   = 256
 *
 * Planet IDs (numeric):
 *   SE_SUN=0, SE_MOON=1, SE_MERCURY=2, SE_VENUS=3, SE_MARS=4,
 *   SE_JUPITER=5, SE_SATURN=6, SE_URANUS=7, SE_NEPTUNE=8, SE_PLUTO=9,
 *   SE_MEAN_NODE=10
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const swe = require('swisseph-v2')

// Hardcoded constants — never rely on swe.SEFLG_* being defined
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
const SEFLG_MOSEPH = 4   // Moshier ephemeris — no data files needed

// Log available constants once on startup (visible in Railway logs)
const sweKeys = Object.keys(swe).filter(k => typeof swe[k] === 'number')
console.log('[swisseph-v2] Available numeric constants:', sweKeys.slice(0, 30).join(', '))
console.log('[swisseph-v2] SEFLG_MOSEPH from lib:', swe.SEFLG_MOSEPH, '(expected 4)')
console.log('[swisseph-v2] SE_SUN from lib:', swe.SE_SUN, '(expected 0)')

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

export function dateToJD(
  year: number, month: number, day: number,
  hour: number, minute: number
): number {
  const decHour = hour + minute / 60

  // Try swe_utc_to_jd first (returns { julianDayUT, julianDayET })
  try {
    const r = swe.swe_utc_to_jd(year, month, day, hour, minute, 0, SE_GREG_CAL)
    if (r && typeof r.julianDayUT === 'number' && r.julianDayUT > 0) return r.julianDayUT
  } catch (_) { /* fall through */ }

  // Fallback: swe_julday
  try {
    const jd = swe.swe_julday(year, month, day, decHour, SE_GREG_CAL)
    if (typeof jd === 'number' && jd > 0) return jd
  } catch (_) { /* fall through */ }

  // Manual Julian Day Number formula (always works)
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  return jdn - 0.5 + decHour / 24
}

function calcPlanet(jd: number, planetId: number, label: string): number {
  // Use ONLY SEFLG_MOSEPH = 4 (hardcoded). No SEFLG_SPEED.
  const flag = SEFLG_MOSEPH

  try {
    const result = swe.swe_calc_ut(jd, planetId, flag)

    // swisseph-v2 preferred: returns { longitude, latitude, distance, ... }
    if (result && typeof result.longitude === 'number' && result.longitude !== 0) {
      return result.longitude
    }

    // Array-like result (some builds)
    if (result && Array.isArray(result) && typeof result[0] === 'number' && result[0] !== 0) {
      return result[0]
    }

    // .data property (older builds)
    if (result && result.data && typeof result.data[0] === 'number' && result.data[0] !== 0) {
      return result.data[0]
    }

    // Log what we actually got to help debug
    console.warn(`[swisseph] ${label} (id=${planetId}) unexpected result:`, JSON.stringify(result))

    // Last resort: try with flag=0 (default ephemeris, files may exist)
    const r2 = swe.swe_calc_ut(jd, planetId, 0)
    if (r2 && typeof r2.longitude === 'number' && r2.longitude !== 0) return r2.longitude

  } catch (e) {
    console.error(`[swisseph] ${label} (id=${planetId}) threw:`, e)
  }

  return 0
}

export function computeAllPlanets(jd: number): PlanetPositions {
  const sun       = calcPlanet(jd, SE_SUN,       'Sun')
  const moon      = calcPlanet(jd, SE_MOON,      'Moon')
  const mercury   = calcPlanet(jd, SE_MERCURY,   'Mercury')
  const venus     = calcPlanet(jd, SE_VENUS,     'Venus')
  const mars      = calcPlanet(jd, SE_MARS,      'Mars')
  const jupiter   = calcPlanet(jd, SE_JUPITER,   'Jupiter')
  const saturn    = calcPlanet(jd, SE_SATURN,     'Saturn')
  const uranus    = calcPlanet(jd, SE_URANUS,    'Uranus')
  const neptune   = calcPlanet(jd, SE_NEPTUNE,   'Neptune')
  const pluto     = calcPlanet(jd, SE_PLUTO,     'Pluto')
  const northNode = calcPlanet(jd, SE_MEAN_NODE, 'NorthNode')

  // Log raw longitudes for Railway debugging
  console.log(`[swisseph] jd=${jd.toFixed(4)} Sun=${sun.toFixed(3)} Moon=${moon.toFixed(3)} Mars=${mars.toFixed(3)} Jup=${jupiter.toFixed(3)} Ura=${uranus.toFixed(3)}`)

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
