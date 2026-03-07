import { MOON_PHASES } from './hdData'

/**
 * Calculates the accurate moon phase for a given date.
 * Uses the Full Moon on March 3, 2026 at 11:38 UTC as reference,
 * verified against astronomy.com and moongiant.com.
 */
export function getMoonPhase(date: Date = new Date()) {
  const LUNAR_CYCLE = 29.53058867 // days

  // Known Full Moon: March 3, 2026 at 11:38 UTC (verified)
  // Working back half a cycle gives the last New Moon
  const knownFullMoon = new Date('2026-03-03T11:38:00Z')
  const knownNewMoon = new Date(
    knownFullMoon.getTime() - (LUNAR_CYCLE / 2) * 24 * 60 * 60 * 1000
  )

  const daysSinceNewMoon =
    (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)

  // Normalize to current cycle (0 to 29.53)
  const cyclePosition =
    ((daysSinceNewMoon % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE

  // Map to 8 phases
  const phaseIndex = Math.floor((cyclePosition / LUNAR_CYCLE) * 8) % 8

  return {
    phase: MOON_PHASES[phaseIndex],
    phaseIndex,
    cyclePosition: Math.round(cyclePosition * 10) / 10,
    illumination: Math.round(
      ((1 - Math.cos((cyclePosition / LUNAR_CYCLE) * 2 * Math.PI)) / 2) * 100
    ),
  }
}
