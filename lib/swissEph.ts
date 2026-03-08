/**
 * lib/swissEph.ts
 * Planetary positions using the sweph npm package (real Swiss Ephemeris).
 * Same engine used by Jovian Archive. No external API needed.
 */

import * as sweph from 'sweph'

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
  return sweph.julday(year, month, day, hour + minute / 60, sweph.constants.SE_GREG_CAL)
}

// ── COMPUTE ALL PLANETS ───────────────────────────────────────────────────────

function norm360(d: number): number {
  return ((d % 360) + 360) % 360
}

function calcPlanet(jd: number, planetId: number): number {
  const result = sweph.calc_ut(jd, planetId, sweph.constants.SEFLG_SWIEPH)
  if ('error' in result) {
    // fallback to Moshier (no ephemeris files needed)
    const fallback = sweph.calc_ut(jd, planetId, sweph.constants.SEFLG_MOSEPH)
    return 'longitude' in fallback ? fallback.longitude : 0
  }
  return result.longitude
}

export function computeAllPlanets(jd: number): PlanetPositions {
  const SE = sweph.constants

  const sun       = calcPlanet(jd, SE.SE_SUN)
  const moon      = calcPlanet(jd, SE.SE_MOON)
  const mercury   = calcPlanet(jd, SE.SE_MERCURY)
  const venus     = calcPlanet(jd, SE.SE_VENUS)
  const mars      = calcPlanet(jd, SE.SE_MARS)
  const jupiter   = calcPlanet(jd, SE.SE_JUPITER)
  const saturn    = calcPlanet(jd, SE.SE_SATURN)
  const uranus    = calcPlanet(jd, SE.SE_URANUS)
  const neptune   = calcPlanet(jd, SE.SE_NEPTUNE)
  const pluto     = calcPlanet(jd, SE.SE_PLUTO)
  const northNode = calcPlanet(jd, SE.SE_MEAN_NODE)

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
