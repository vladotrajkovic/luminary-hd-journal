/**
 * lib/swissEph.ts
 * Planetary positions using the swisseph npm package — real Swiss Ephemeris.
 * Same engine used by Jovian Archive. Requires a real Node.js server (Railway).
 */

// swisseph is a native C extension — works on Railway, not on Vercel serverless
// eslint-disable-next-line @typescript-eslint/no-require-imports
const swe = require('swisseph')

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

function norm360(d: number): number {
  return ((d % 360) + 360) % 360
}

export function dateToJD(
  year: number, month: number, day: number,
  hour: number, minute: number
): number {
  // swe_julday returns a plain number
  return swe.swe_julday(year, month, day, hour + minute / 60, swe.SE_GREG_CAL)
}

function calcPlanet(jd: number, planetId: number): number {
  // SEFLG_SWIEPH (2) = use Swiss Ephemeris built-in data
  const result = swe.swe_calc_ut(jd, planetId, swe.SEFLG_SWIEPH)
  if (result.error) {
    // Fallback to Moshier — no ephemeris files needed, slightly less accurate
    const fallback = swe.swe_calc_ut(jd, planetId, swe.SEFLG_MOSEPH)
    return Array.isArray(fallback.data) ? fallback.data[0] : 0
  }
  return Array.isArray(result.data) ? result.data[0] : 0
}

export function computeAllPlanets(jd: number): PlanetPositions {
  const sun       = calcPlanet(jd, swe.SE_SUN)
  const moon      = calcPlanet(jd, swe.SE_MOON)
  const mercury   = calcPlanet(jd, swe.SE_MERCURY)
  const venus     = calcPlanet(jd, swe.SE_VENUS)
  const mars      = calcPlanet(jd, swe.SE_MARS)
  const jupiter   = calcPlanet(jd, swe.SE_JUPITER)
  const saturn    = calcPlanet(jd, swe.SE_SATURN)
  const uranus    = calcPlanet(jd, swe.SE_URANUS)
  const neptune   = calcPlanet(jd, swe.SE_NEPTUNE)
  const pluto     = calcPlanet(jd, swe.SE_PLUTO)
  const northNode = calcPlanet(jd, swe.SE_MEAN_NODE)

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
