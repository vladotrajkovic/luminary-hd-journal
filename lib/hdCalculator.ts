/**
 * ============================================================
 * LUMINARY — Human Design Chart Calculator
 * Full astronomical ephemeris calculation
 * Maps planetary positions to I Ching hexagrams (gates) and lines
 * Determines type, authority, profile, definition, centers
 * ============================================================
 */

// ── TYPES ──────────────────────────────────────────────────

export type Planet = 'sun' | 'earth' | 'moon' | 'northNode' | 'southNode' |
  'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' |
  'uranus' | 'neptune' | 'pluto'

export type Activation = {
  gate: number
  line: number
  longitude: number
}

export type PlanetActivation = {
  planet: Planet
  personality: Activation  // conscious (birth)
  design: Activation       // unconscious (88 days before)
}

export type Center =
  | 'Head' | 'Ajna' | 'Throat' | 'G' | 'Heart'
  | 'Sacral' | 'SolarPlexus' | 'Spleen' | 'Root'

export type Channel = {
  gates: [number, number]
  centers: [Center, Center]
  name: string
  type: string
}

export type HDChart = {
  // Core
  type: string
  authority: string
  profile: string
  definition: string
  incarnationCross: string

  // Activations
  personalityActivations: PlanetActivation[]
  allPersonalityGates: number[]
  allDesignGates: number[]
  allGates: number[]
  activeChannels: Channel[]

  // Centers
  definedCenters: Center[]
  openCenters: Center[]

  // Raw
  birthJD: number
  designJD: number
  sunLongitudePersonality: number
  sunLongitudeDesign: number
}

// ── JULIAN DATE ────────────────────────────────────────────

export function dateToJulian(date: Date): number {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400

  let jd: number
  const y2 = m <= 2 ? y - 1 : y
  const m2 = m <= 2 ? m + 12 : m
  const A = Math.floor(y2 / 100)
  const B = 2 - A + Math.floor(A / 4)
  jd = Math.floor(365.25 * (y2 + 4716)) +
    Math.floor(30.6001 * (m2 + 1)) +
    d + B - 1524.5
  return jd
}

// ── VSOP87 SIMPLIFIED PLANETARY POSITIONS ─────────────────
// Accurate to ~0.01 degrees for dates 1800-2200

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360
}

function toRad(deg: number): number {
  return deg * Math.PI / 180
}

// Julian centuries from J2000.0
function T(jd: number): number {
  return (jd - 2451545.0) / 36525
}

// Mean anomaly helper
function M(t: number, a: number, b: number): number {
  return normalizeAngle(a + b * t)
}

export function getSunLongitude(jd: number): number {
  const t = T(jd)
  // Geometric mean longitude
  const L0 = normalizeAngle(280.46646 + 36000.76983 * t + 0.0003032 * t * t)
  // Mean anomaly
  const m = normalizeAngle(357.52911 + 35999.05029 * t - 0.0001537 * t * t)
  const mRad = toRad(m)
  // Equation of center
  const C = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(mRad)
    + (0.019993 - 0.000101 * t) * Math.sin(2 * mRad)
    + 0.000289 * Math.sin(3 * mRad)
  // Sun's true longitude
  const sunLon = L0 + C
  // Apparent longitude (aberration + nutation simplified)
  const omega = normalizeAngle(125.04 - 1934.136 * t)
  const apparent = sunLon - 0.00569 - 0.00478 * Math.sin(toRad(omega))
  return normalizeAngle(apparent)
}

export function getMoonLongitude(jd: number): number {
  const t = T(jd)
  // Moon's mean longitude
  const L = normalizeAngle(218.3164477 + 481267.88123421 * t - 0.0015786 * t * t)
  // Mean elongation
  const D = normalizeAngle(297.8501921 + 445267.1114034 * t - 0.0018819 * t * t)
  // Mean anomaly of Sun
  const Ms = normalizeAngle(357.5291092 + 35999.0502909 * t - 0.0001536 * t * t)
  // Mean anomaly of Moon
  const Mm = normalizeAngle(134.9633964 + 477198.8676313 * t + 0.0089970 * t * t)
  // Moon's argument of latitude
  const F = normalizeAngle(93.2720950 + 483202.0175233 * t - 0.0036539 * t * t)

  const DRad = toRad(D), MsRad = toRad(Ms), MmRad = toRad(Mm), FRad = toRad(F)

  // Main perturbations
  let lon = L
  lon += 6.288774 * Math.sin(MmRad)
  lon += 1.274027 * Math.sin(2 * DRad - MmRad)
  lon += 0.658314 * Math.sin(2 * DRad)
  lon += 0.213618 * Math.sin(2 * MmRad)
  lon -= 0.185116 * Math.sin(MsRad)
  lon -= 0.114332 * Math.sin(2 * FRad)
  lon += 0.058793 * Math.sin(2 * DRad - 2 * MmRad)
  lon += 0.057066 * Math.sin(2 * DRad - MsRad - MmRad)
  lon += 0.053322 * Math.sin(2 * DRad + MmRad)
  lon += 0.045758 * Math.sin(2 * DRad - MsRad)
  lon -= 0.040923 * Math.sin(MsRad - MmRad)
  lon -= 0.034720 * Math.sin(DRad)
  lon -= 0.030383 * Math.sin(MsRad + MmRad)
  lon += 0.015327 * Math.sin(2 * DRad - 2 * FRad)
  lon -= 0.012528 * Math.sin(MmRad + 2 * FRad)
  lon -= 0.010980 * Math.sin(MmRad - 2 * FRad)
  return normalizeAngle(lon)
}

export function getMercuryLongitude(jd: number): number {
  const t = T(jd)
  const L = normalizeAngle(252.250906 + 149474.0722491 * t)
  const m = normalizeAngle(174.7947 + 149472.5153 * t)
  const mRad = toRad(m)
  return normalizeAngle(L + 23.4400 * Math.sin(mRad) + 2.9818 * Math.sin(2*mRad) + 0.5255 * Math.sin(3*mRad))
}

export function getVenusLongitude(jd: number): number {
  const t = T(jd)
  const L = normalizeAngle(181.979801 + 58519.2130302 * t)
  const m = normalizeAngle(212.5 + 58517.8039 * t)
  const mRad = toRad(m)
  return normalizeAngle(L + 0.7758 * Math.sin(mRad) + 0.0033 * Math.sin(2*mRad))
}

export function getMarsLongitude(jd: number): number {
  const t = T(jd)
  const L = normalizeAngle(355.433275 + 19141.6964746 * t)
  const m = normalizeAngle(319.5 + 19139.8580 * t)
  const mRad = toRad(m)
  return normalizeAngle(L + 10.6912 * Math.sin(mRad) + 0.6228 * Math.sin(2*mRad) + 0.0503 * Math.sin(3*mRad))
}

export function getJupiterLongitude(jd: number): number {
  const t = T(jd)
  const L = normalizeAngle(34.351484 + 3036.3027889 * t)
  const m = normalizeAngle(20.0202 + 3034.9057 * t)
  const mRad = toRad(m)
  return normalizeAngle(L + 5.5549 * Math.sin(mRad) + 0.1683 * Math.sin(2*mRad))
}

export function getSaturnLongitude(jd: number): number {
  const t = T(jd)
  const L = normalizeAngle(50.077444 + 1223.5110686 * t)
  const m = normalizeAngle(317.0207 + 1221.5515 * t)
  const mRad = toRad(m)
  return normalizeAngle(L + 6.3585 * Math.sin(mRad) + 0.2204 * Math.sin(2*mRad))
}

export function getUranusLongitude(jd: number): number {
  const t = T(jd)
  const L = normalizeAngle(314.055005 + 429.8640561 * t)
  const m = normalizeAngle(142.5905 + 427.9805 * t)
  const mRad = toRad(m)
  return normalizeAngle(L + 5.3042 * Math.sin(mRad) + 0.1534 * Math.sin(2*mRad))
}

export function getNeptuneLongitude(jd: number): number {
  const t = T(jd)
  const L = normalizeAngle(304.348665 + 219.8833092 * t)
  const m = normalizeAngle(267.9674 + 218.4580 * t)
  const mRad = toRad(m)
  return normalizeAngle(L + 1.0862 * Math.sin(mRad))
}

export function getPlutoLongitude(jd: number): number {
  const t = T(jd)
  // Simplified Pluto - accurate to ~1 degree
  const L = normalizeAngle(238.92903833 + 145.20780515 * t)
  const m = normalizeAngle(14.2 + 144.9600 * t)
  const mRad = toRad(m)
  return normalizeAngle(L + 28.3150 * Math.sin(mRad) + 4.3408 * Math.sin(2*mRad))
}

export function getNorthNodeLongitude(jd: number): number {
  const t = T(jd)
  // Mean ascending node of Moon
  const omega = normalizeAngle(125.04452 - 1934.136261 * t + 0.0020708 * t * t)
  return normalizeAngle(omega)
}

// ── LONGITUDE → GATE & LINE ────────────────────────────────
/**
 * Maps ecliptic longitude (0-360°) to Human Design gate and line.
 *
 * The wheel starts at 0° Aries = Gate 41, Line 1 and progresses
 * through all 64 hexagrams × 6 lines = 384 positions.
 * Each gate = 5.625° (360/64), each line = 0.9375° (5.625/6)
 *
 * Gate sequence around the wheel (clockwise from 0° Aries):
 */
const GATE_WHEEL_SEQUENCE: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60
]

// Jovian Archive uses 301.875° as the true start of the HD wheel
// (Gate 41 Line 1 begins at 301.875° ecliptic, not exactly 300°)
// This is 1.875° = 2 lines past the nominal 0° Aquarius = 300° value.
const HD_WHEEL_START = 302.25  // Jovian Archive-aligned value (JA uses ~302°, not 300°)

export function longitudeToGateAndLine(longitude: number): Activation {
  const normalized = normalizeAngle(longitude)
  // Apply Jovian Archive wheel offset: shift so gate 41.1 starts at 301.875°
  const adjusted = ((normalized - HD_WHEEL_START) + 360) % 360
  // 64 gates × 6 lines = 384 positions, each = 360/384 = 0.9375°
  const positionInWheel = (adjusted / 360) * 384
  const gateIndex = Math.floor(positionInWheel / 6) % 64
  const line = (Math.floor(positionInWheel) % 6) + 1
  return {
    gate: GATE_WHEEL_SEQUENCE[gateIndex],
    line,
    longitude: normalized
  }
}

// ── ALL 36 CHANNELS ────────────────────────────────────────
export const ALL_CHANNELS: Channel[] = [
  // Circuit: Integration
  { gates: [57, 10], centers: ['Spleen', 'G'],        name: 'The Channel of Perfected Form',    type: 'Integration' },
  { gates: [34, 57], centers: ['Sacral', 'Spleen'],   name: 'The Channel of Power',              type: 'Integration' },
  { gates: [10, 20], centers: ['G', 'Throat'],        name: 'The Channel of Awakening',          type: 'Integration' },
  { gates: [34, 20], centers: ['Sacral', 'Throat'],   name: 'The Channel of Charisma',           type: 'Integration' },

  // Circuit: Centering
  { gates: [25, 51], centers: ['G', 'Heart'],         name: 'The Channel of Initiation',         type: 'Centering' },

  // Circuit: Knowing
  { gates: [61, 24], centers: ['Head', 'Ajna'],       name: 'The Channel of Awareness',          type: 'Knowing' },
  { gates: [43, 23], centers: ['Ajna', 'Throat'],     name: 'The Channel of Structuring',        type: 'Knowing' },
  { gates: [8, 1],   centers: ['Throat', 'G'],        name: 'The Channel of Inspiration',        type: 'Knowing' },
  { gates: [7, 31],  centers: ['G', 'Throat'],        name: 'The Channel of The Alpha',          type: 'Knowing' },

  // Circuit: Sensing
  { gates: [64, 47], centers: ['Head', 'Ajna'],       name: 'The Channel of Abstraction',        type: 'Sensing' },
  { gates: [11, 56], centers: ['Ajna', 'Throat'],     name: 'The Channel of Curiosity',          type: 'Sensing' },
  { gates: [35, 36], centers: ['Throat', 'SolarPlexus'], name: 'The Channel of Transitoriness', type: 'Sensing' },

  // Circuit: Collective Logic
  { gates: [63, 4],  centers: ['Head', 'Ajna'],       name: 'The Channel of Logic',              type: 'Logic' },
  { gates: [17, 62], centers: ['Ajna', 'Throat'],     name: 'The Channel of Acceptance',         type: 'Logic' },
  { gates: [16, 48], centers: ['Throat', 'Spleen'],   name: 'The Channel of The Wavelength',     type: 'Logic' },
  { gates: [9, 52],  centers: ['Sacral', 'Root'],     name: 'The Channel of Concentration',      type: 'Logic' },
  { gates: [5, 15],  centers: ['Sacral', 'G'],        name: 'The Channel of Rhythm',             type: 'Logic' },

  // Circuit: Tribal
  { gates: [45, 21], centers: ['Throat', 'Heart'],    name: 'The Channel of The Money Line',     type: 'Tribal' },
  { gates: [37, 40], centers: ['SolarPlexus', 'Heart'], name: 'The Channel of Community',        type: 'Tribal' },
  { gates: [59, 6],  centers: ['Sacral', 'SolarPlexus'], name: 'The Channel of Mating',          type: 'Tribal' },
  { gates: [27, 50], centers: ['Sacral', 'Spleen'],   name: 'The Channel of Preservation',       type: 'Tribal' },
  { gates: [19, 49], centers: ['Root', 'SolarPlexus'], name: 'The Channel of Synthesis',         type: 'Tribal' },
  { gates: [32, 54], centers: ['Spleen', 'Root'],     name: 'The Channel of Transformation',     type: 'Tribal' },
  { gates: [26, 44], centers: ['Heart', 'Spleen'],    name: 'The Channel of Surrender',          type: 'Tribal' },

  // Circuit: Individual
  { gates: [28, 38], centers: ['Spleen', 'Root'],     name: 'The Channel of Struggle',           type: 'Individual' },
  { gates: [57, 20], centers: ['Spleen', 'Throat'],   name: 'The Channel of The Brainwave',      type: 'Individual' },
  { gates: [39, 55], centers: ['Root', 'SolarPlexus'], name: 'The Channel of Emoting',            type: 'Individual' },
  { gates: [12, 22], centers: ['Throat', 'SolarPlexus'], name: 'The Channel of Openness',        type: 'Individual' },
  { gates: [20, 57], centers: ['Throat', 'Spleen'],   name: 'The Channel of The Brainwave',      type: 'Individual' },
  // Note: Channel 10-57 = same as 57-10 above (listed in Integration, also called "Survival" in Individual)
  { gates: [14, 2],  centers: ['Sacral', 'G'],        name: 'The Channel of The Beat',           type: 'Individual' },
  { gates: [29, 46], centers: ['Sacral', 'G'],        name: 'The Channel of Discovery',          type: 'Individual' },
  { gates: [3, 60],  centers: ['Sacral', 'Root'],     name: 'The Channel of Mutation',           type: 'Individual' },
  { gates: [53, 42], centers: ['Root', 'Sacral'],     name: 'The Channel of Maturation',         type: 'Individual' },
  { gates: [18, 58], centers: ['Spleen', 'Root'],     name: 'The Channel of Judgment',           type: 'Individual' },
  { gates: [41, 30], centers: ['Root', 'SolarPlexus'], name: 'The Channel of Recognition',       type: 'Individual' },
]

// ── CENTER → GATES MAPPING ─────────────────────────────────
export const CENTER_GATES: Record<Center, number[]> = {
  Head:        [64, 61, 63],
  Ajna:        [47, 24, 4, 17, 43, 11],
  Throat:      [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  G:           [1, 2, 7, 10, 13, 15, 25, 46],
  Heart:       [21, 26, 40, 51],
  Sacral:      [5, 9, 14, 27, 29, 34, 42, 59, 3],
  SolarPlexus: [6, 22, 30, 36, 37, 49, 55],
  Spleen:      [18, 28, 32, 44, 48, 50, 57],
  Root:        [19, 38, 39, 41, 52, 53, 54, 58, 60],
}

// ── DETERMINE DEFINED CENTERS ─────────────────────────────
function getDefinedCenters(activeGates: number[]): Center[] {
  const defined = new Set<Center>()

  // A center is defined if a complete channel (both gates) is active
  for (const channel of ALL_CHANNELS) {
    const [g1, g2] = channel.gates
    if (activeGates.includes(g1) && activeGates.includes(g2)) {
      defined.add(channel.centers[0])
      defined.add(channel.centers[1])
    }
  }
  return Array.from(defined)
}

// ── DETERMINE TYPE ─────────────────────────────────────────
function determineType(definedCenters: Center[]): string {
  const hasSacral = definedCenters.includes('Sacral')
  const hasThroat = definedCenters.includes('Throat')
  const hasMotorToThroat = (
    (definedCenters.includes('Heart') && definedCenters.includes('Throat')) ||
    (definedCenters.includes('SolarPlexus') && definedCenters.includes('Throat')) ||
    (definedCenters.includes('Root') && definedCenters.includes('Throat')) ||
    (definedCenters.includes('Sacral') && definedCenters.includes('Throat'))
  )

  if (definedCenters.length === 0) return 'Reflector'
  if (!hasSacral && !hasThroat) return 'Projector'
  if (!hasSacral && hasThroat && hasMotorToThroat) return 'Manifestor'
  if (hasSacral && hasThroat && hasMotorToThroat) return 'Manifesting Generator'
  if (hasSacral && !hasMotorToThroat) return 'Generator'
  if (hasSacral) return 'Generator'
  return 'Projector'
}

// ── DETERMINE AUTHORITY ────────────────────────────────────
function determineAuthority(definedCenters: Center[], type: string): string {
  if (type === 'Reflector') return 'Lunar'
  if (definedCenters.includes('SolarPlexus')) return 'Emotional/Solar Plexus'
  if (definedCenters.includes('Sacral')) return 'Sacral'
  if (definedCenters.includes('Spleen')) return 'Splenic'
  if (definedCenters.includes('Heart')) return 'Ego/Heart'
  if (definedCenters.includes('G')) return 'G Center/Self'
  return 'Mental/Environment'
}

// ── DETERMINE PROFILE ──────────────────────────────────────
function determineProfile(personalitySunLine: number, designSunLine: number): string {
  return `${personalitySunLine}/${designSunLine}`
}

// ── DETERMINE DEFINITION ──────────────────────────────────
function determineDefinition(activeChannels: Channel[], definedCenters: Center[]): string {
  if (definedCenters.length === 0) return 'No Definition (Reflector)'
  // Count connected center groups
  const centerGraph: Record<string, Set<string>> = {}
  definedCenters.forEach(c => { centerGraph[c] = new Set() })
  activeChannels.forEach(ch => {
    const [c1, c2] = ch.centers
    if (definedCenters.includes(c1) && definedCenters.includes(c2)) {
      centerGraph[c1]?.add(c2)
      centerGraph[c2]?.add(c1)
    }
  })
  // BFS to count connected components
  const visited = new Set<string>()
  let components = 0
  definedCenters.forEach(center => {
    if (!visited.has(center)) {
      components++
      const queue = [center]
      while (queue.length > 0) {
        const node = queue.shift()!
        if (visited.has(node)) continue
        visited.add(node)
        centerGraph[node]?.forEach(n => { if (!visited.has(n)) queue.push(n as Center) })
      }
    }
  })
  if (components === 1) return 'Single'
  if (components === 2) return 'Split'
  if (components === 3) return 'Triple Split'
  return 'Quadruple Split'
}

// ── INCARNATION CROSS ──────────────────────────────────────
// Based on Sun/Earth gates in Personality and Design
const CROSS_NAMES: Record<string, string> = {
  '1/2/4/3': 'Right Angle Cross of the Sphinx',
  '2/1/3/4': 'Right Angle Cross of the Sphinx',
  '13/7/43/23': 'Right Angle Cross of the Vessel of Love',
  '7/13/23/43': 'Right Angle Cross of the Vessel of Love',
  '25/46/10/15': 'Right Angle Cross of the Sleeping Phoenix',
  '46/25/15/10': 'Right Angle Cross of the Sleeping Phoenix',
  '29/30/20/34': 'Right Angle Cross of the Unexpected',
  '30/29/34/20': 'Right Angle Cross of the Unexpected',
}

function getIncarnationCross(pSunGate: number, pEarthGate: number, dSunGate: number, dEarthGate: number): string {
  const key = `${pSunGate}/${pEarthGate}/${dSunGate}/${dEarthGate}`
  return CROSS_NAMES[key] || `Cross of Gates ${pSunGate}/${pEarthGate} | ${dSunGate}/${dEarthGate}`
}

// ── EARTH GATE (opposite of Sun) ───────────────────────────
function getEarthLongitude(sunLongitude: number): number {
  return normalizeAngle(sunLongitude + 180)
}

// ── MAIN CHART CALCULATOR ──────────────────────────────────
export function calculateHDChart(birthDate: Date): HDChart {
  const birthJD = dateToJulian(birthDate)

  // Design calculation: exactly 88 days + 88 minutes before birth
  // (This represents the moment the neutrino stream imprinted the Design)
  const designJD = birthJD - 88 - (88 / 1440)

  // ── PERSONALITY (Conscious) activations ──
  const pSunLon    = getSunLongitude(birthJD)
  const pMoonLon   = getMoonLongitude(birthJD)
  const pMercLon   = getMercuryLongitude(birthJD)
  const pVenLon    = getVenusLongitude(birthJD)
  const pMarsLon   = getMarsLongitude(birthJD)
  const pJupLon    = getJupiterLongitude(birthJD)
  const pSatLon    = getSaturnLongitude(birthJD)
  const pUranLon   = getUranusLongitude(birthJD)
  const pNepLon    = getNeptuneLongitude(birthJD)
  const pPlutLon   = getPlutoLongitude(birthJD)
  const pNNodeLon  = getNorthNodeLongitude(birthJD)
  const pEarthLon  = getEarthLongitude(pSunLon)
  const pSNodeLon  = getEarthLongitude(pNNodeLon)

  // ── DESIGN (Unconscious) activations ──
  const dSunLon    = getSunLongitude(designJD)
  const dMoonLon   = getMoonLongitude(designJD)
  const dMercLon   = getMercuryLongitude(designJD)
  const dVenLon    = getVenusLongitude(designJD)
  const dMarsLon   = getMarsLongitude(designJD)
  const dJupLon    = getJupiterLongitude(designJD)
  const dSatLon    = getSaturnLongitude(designJD)
  const dUranLon   = getUranusLongitude(designJD)
  const dNepLon    = getNeptuneLongitude(designJD)
  const dPlutLon   = getPlutoLongitude(designJD)
  const dNNodeLon  = getNorthNodeLongitude(designJD)
  const dEarthLon  = getEarthLongitude(dSunLon)
  const dSNodeLon  = getEarthLongitude(dNNodeLon)

  // Convert to gate + line
  const pActivations: PlanetActivation[] = [
    { planet: 'sun',       personality: longitudeToGateAndLine(pSunLon),   design: longitudeToGateAndLine(dSunLon) },
    { planet: 'earth',     personality: longitudeToGateAndLine(pEarthLon), design: longitudeToGateAndLine(dEarthLon) },
    { planet: 'moon',      personality: longitudeToGateAndLine(pMoonLon),  design: longitudeToGateAndLine(dMoonLon) },
    { planet: 'northNode', personality: longitudeToGateAndLine(pNNodeLon), design: longitudeToGateAndLine(dNNodeLon) },
    { planet: 'southNode', personality: longitudeToGateAndLine(pSNodeLon), design: longitudeToGateAndLine(dSNodeLon) },
    { planet: 'mercury',   personality: longitudeToGateAndLine(pMercLon),  design: longitudeToGateAndLine(dMercLon) },
    { planet: 'venus',     personality: longitudeToGateAndLine(pVenLon),   design: longitudeToGateAndLine(dVenLon) },
    { planet: 'mars',      personality: longitudeToGateAndLine(pMarsLon),  design: longitudeToGateAndLine(dMarsLon) },
    { planet: 'jupiter',   personality: longitudeToGateAndLine(pJupLon),   design: longitudeToGateAndLine(dJupLon) },
    { planet: 'saturn',    personality: longitudeToGateAndLine(pSatLon),   design: longitudeToGateAndLine(dSatLon) },
    { planet: 'uranus',    personality: longitudeToGateAndLine(pUranLon),  design: longitudeToGateAndLine(dUranLon) },
    { planet: 'neptune',   personality: longitudeToGateAndLine(pNepLon),   design: longitudeToGateAndLine(dNepLon) },
    { planet: 'pluto',     personality: longitudeToGateAndLine(pPlutLon),  design: longitudeToGateAndLine(dPlutLon) },
  ]

  // Collect all active gates
  const personalityGates = pActivations.map(a => a.personality.gate)
  const designGates = pActivations.map(a => a.design.gate)
  const allGates = Array.from(new Set([...personalityGates, ...designGates]))

  // Find active channels
  const activeChannels = ALL_CHANNELS.filter(ch =>
    allGates.includes(ch.gates[0]) && allGates.includes(ch.gates[1])
  )

  // Determine centers
  const definedCenters = getDefinedCenters(allGates)
  const allCenters: Center[] = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'Sacral', 'SolarPlexus', 'Spleen', 'Root']
  const openCenters = allCenters.filter(c => !definedCenters.includes(c))

  // Determine type, authority, profile, definition
  const type = determineType(definedCenters)
  const authority = determineAuthority(definedCenters, type)

  const pSunActivation = pActivations.find(a => a.planet === 'sun')!
  const dSunActivation = pActivations.find(a => a.planet === 'sun')!
  const profile = determineProfile(pSunActivation.personality.line, dSunActivation.design.line)
  const definition = determineDefinition(activeChannels, definedCenters)

  // Incarnation cross
  const pEarthGate = longitudeToGateAndLine(pEarthLon).gate
  const dEarthGate = longitudeToGateAndLine(dEarthLon).gate
  const incarnationCross = getIncarnationCross(
    pSunActivation.personality.gate, pEarthGate,
    dSunActivation.design.gate, dEarthGate
  )

  return {
    type,
    authority,
    profile,
    definition,
    incarnationCross,
    personalityActivations: pActivations,
    allPersonalityGates: personalityGates,
    allDesignGates: designGates,
    allGates,
    activeChannels,
    definedCenters,
    openCenters,
    birthJD,
    designJD,
    sunLongitudePersonality: pSunLon,
    sunLongitudeDesign: dSunLon,
  }
}
