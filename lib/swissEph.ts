/**
 * lib/swissEph.ts
 * Planetary positions using swisseph-v2 — real Swiss Ephemeris.
 * swisseph-v2 is synchronous and returns { longitude, latitude, distance, ... }
 * Uses SEFLG_MOSEPH (Moshier) — no ephemeris files needed, accuracy ~1 arcmin.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const swe = require('swisseph-v2')

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
  // swe_utc_to_jd returns { julianDayUT, julianDayET } in swisseph-v2
  const result = swe.swe_utc_to_jd(year, month, day, hour, minute, 0, swe.SE_GREG_CAL)
  if (result && typeof result.julianDayUT === 'number') {
    return result.julianDayUT
  }
  // Fallback: swe_julday (may be synchronous in v2)
  const jd = swe.swe_julday(year, month, day, hour + minute / 60, swe.SE_GREG_CAL)
  return typeof jd === 'number' ? jd : 0
}

function calcPlanet(jd: number, planetId: number): number {
  // SEFLG_MOSEPH = Moshier ephemeris, no files needed, ~1 arcmin accuracy
  const flag = swe.SEFLG_SPEED | swe.SEFLG_MOSEPH
  const result = swe.swe_calc_ut(jd, planetId, flag)

  // swisseph-v2 returns { longitude, latitude, distance, longitudeSpeed, ... }
  if (result && typeof result.longitude === 'number') {
    return result.longitude
  }
  // Some builds return array-like
  if (result && Array.isArray(result) && typeof result[0] === 'number') {
    return result[0]
  }
  // Fallback: try .data property (older builds)
  if (result && result.data && typeof result.data[0] === 'number') {
    return result.data[0]
  }
  return 0
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
