/**
 * lib/swissEph.ts
 * Planetary positions using the swisseph npm package (real Swiss Ephemeris).
 * Same engine used by Jovian Archive. No external API needed.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const swe = require('swisseph')

// ── PLANET CONSTANTS ──────────────────────────────────────────────────────────
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
const SE_MEAN_NODE = 10   // Mean Lunar Node (North Node)

// Use Swiss Ephemeris built-in data (no external ephe files needed)
const SEFLG_SWIEPH = 2

// ── TYPES ─────────────────────────────────────────────────────────────────────

export interface PlanetPositions {
  sun:       number
  earth:     number
  moon:      number
  northNode: number
  southNode: number
  mercury:   number
  venus:     number
  mars:      number
  jupiter:   number
  saturn:    number
  uranus:    number
  neptune:   number
  pluto:     number
}

// ── JULIAN DAY ────────────────────────────────────────────────────────────────

export function dateToJD(
  year: number, month: number, day: number,
  hour: number, minute: number
): number {
  const result = swe.swe_julday(year, month, day, hour + minute / 60, swe.SE_GREG_CAL)
  return result
}

// ── COMPUTE ALL PLANETS ───────────────────────────────────────────────────────

function calcPlanet(jd: number, planetId: number): number {
  const result = swe.swe_calc_ut(jd, planetId, SEFLG_SWIEPH)
  if (result.error) {
    // Fallback: try with Moshier ephemeris
    const fallback = swe.swe_calc_ut(jd, planetId, 4)
    return fallback.longitude ?? 0
  }
  return result.longitude
}

function norm360(d: number): number {
  return ((d % 360) + 360) % 360
}

export function computeAllPlanets(jd: number): PlanetPositions {
  const sun       = calcPlanet(jd, SE_SUN)
  const moon      = calcPlanet(jd, SE_MOON)
  const mercury   = calcPlanet(jd, SE_MERCURY)
  const venus     = calcPlanet(jd, SE_VENUS)
  const mars      = calcPlanet(jd, SE_MARS)
  const jupiter   = calcPlanet(jd, SE_JUPITER)
  const saturn    = calcPlanet(jd, SE_SATURN)
  const uranus    = calcPlanet(jd, SE_URANUS)
  const neptune   = calcPlanet(jd, SE_NEPTUNE)
  const pluto     = calcPlanet(jd, SE_PLUTO)
  const northNode = calcPlanet(jd, SE_MEAN_NODE)

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
