import { MOON_PHASES } from './hdData'

/**
 * Calculates the accurate moon phase for a given date
 * using a known new moon reference date and the lunar cycle length.
 * Reference new moon: January 29, 2025 at 12:36 UTC
 */
export function getMoonPhase(date: Date = new Date()) {
  const LUNAR_CYCLE = 29.53058867 // days

  // Known new moon reference: Jan 29, 2025 12:36 UTC
  const knownNewMoon = new Date('2025-01-29T12:36:00Z')

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
    daysInCycle: Math.round(LUNAR_CYCLE * 10) / 10,
  }
}
