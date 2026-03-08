/**
 * lib/swissEph.ts
 * Planetary positions using sweph-wasm (Swiss Ephemeris via WebAssembly).
 * No C compilation needed — works on Vercel out of the box.
 */

import SwissEPH from 'sweph-wasm'

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

// Singleton — initialise once per cold start
let sweInstance: Awaited<ReturnType<typeof SwissEPH.init>> | null = null
async function getSwe() {
  if (!sweInstance) sweInstance = await SwissEPH.init()
  return sweInstance
}

function norm360(d: number): number {
  return ((d % 360) + 360) % 360
}

export function dateToJD(
  year: number, month: number, day: number,
  hour: number, minute: number
): number {
  // Julian Day calculation (pure math, no library needed)
  if (month <= 2) { year -= 1; month += 12 }
  const A = Math.floor(year / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (year + 4716))
       + Math.floor(30.6001 * (month + 1))
       + day + (hour + minute / 60) / 24
       + B - 1524.5
}

export async function computeAllPlanets(jd: number): Promise<PlanetPositions> {
  const swe = await getSwe()

  // Planet IDs: 0=Sun, 1=Moon, 2=Mercury, 3=Venus, 4=Mars,
  //             5=Jupiter, 6=Saturn, 7=Uranus, 8=Neptune, 9=Pluto, 10=MeanNode
  function calc(planetId: number): number {
    const result = swe.swe_calc_ut(jd, planetId, 0)
    return result[0] // longitude in degrees
  }

  const sun       = calc(0)
  const moon      = calc(1)
  const mercury   = calc(2)
  const venus     = calc(3)
  const mars      = calc(4)
  const jupiter   = calc(5)
  const saturn    = calc(6)
  const uranus    = calc(7)
  const neptune   = calc(8)
  const pluto     = calc(9)
  const northNode = calc(10)

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
