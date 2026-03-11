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
  tooltip?: string
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

// ── GATE WHEEL SEQUENCE (Jovian Archive) ──────────────────
export const GATE_WHEEL_SEQUENCE: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
]

function normalizeAngle(lon: number): number {
  return ((lon % 360) + 360) % 360
}

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
  {
    gates: [57, 10], centers: ['Spleen', 'G'],
    name: 'The Channel of Survival', type: 'Integration',
    tooltip: 'You are gifted with a razor-sharp intuitive instinct for what is safe and right for you in any moment. This channel asks you to trust the whispers of your body over the noise of the mind.',
  },
  {
    gates: [34, 57], centers: ['Sacral', 'Spleen'],
    name: 'The Channel of Power', type: 'Integration',
    tooltip: 'You carry a potent, instinctive power that surges through the body — raw, responsive, and deeply attuned to the present. When you act from this gut-level knowing, your energy becomes an effortless force of nature.',
  },
  {
    gates: [10, 20], centers: ['G', 'Throat'],
    name: 'The Channel of Awakening', type: 'Integration',
    tooltip: 'You are here to embody your own truth so completely that your very presence becomes an awakening for others. The way you live — not what you preach — is your most powerful teaching.',
  },
  {
    gates: [34, 20], centers: ['Sacral', 'Throat'],
    name: 'The Channel of Charisma', type: 'Integration',
    tooltip: 'You possess a magnetic, in-the-moment charisma that draws people naturally into your orbit. Your power lives in pure action — doing what you love, now, without hesitation.',
  },

  // Circuit: Centering
  {
    gates: [25, 51], centers: ['G', 'Heart'],
    name: 'The Channel of Initiation', type: 'Centering',
    tooltip: 'You are here to be initiated — through shocks, challenges, and unexpected disruptions that crack you open to something greater. Each trial is an invitation to discover the love and spirit at your core.',
  },

  // Circuit: Knowing
  {
    gates: [61, 24], centers: ['Head', 'Ajna'],
    name: 'The Channel of Awareness', type: 'Knowing',
    tooltip: 'Your mind is a vessel for deep, universal knowing — insights that arrive not from logic but from inner pressure and mystery. You are here to sit with questions until truth emerges in its own time.',
  },
  {
    gates: [43, 23], centers: ['Ajna', 'Throat'],
    name: 'The Channel of Structuring', type: 'Knowing',
    tooltip: 'You receive genius-level insights that can be difficult for others to understand until the timing is right. Your gift is learning to wait for the moment your unique knowing can land and be heard.',
  },
  {
    gates: [8, 1], centers: ['Throat', 'G'],
    name: 'The Channel of Inspiration', type: 'Knowing',
    tooltip: 'You are a vehicle for creative inspiration — your authentic self-expression has the power to make a unique and lasting contribution to the world. Living as yourself, unapologetically, is the whole point.',
  },
  {
    gates: [7, 31], centers: ['G', 'Throat'],
    name: 'The Channel of The Alpha', type: 'Knowing',
    tooltip: 'You carry a natural leadership frequency — not through force, but through your ability to see the direction that serves the collective future. People sense your capacity to guide, often before you do.',
  },

  // Circuit: Sensing
  {
    gates: [64, 47], centers: ['Head', 'Ajna'],
    name: 'The Channel of Abstraction', type: 'Sensing',
    tooltip: 'Your mind is a repository of rich, jumbled past experiences that you are slowly making sense of. The meaning you extract from confusion becomes wisdom others can use.',
  },
  {
    gates: [11, 56], centers: ['Ajna', 'Throat'],
    name: 'The Channel of Curiosity', type: 'Sensing',
    tooltip: 'You are a natural storyteller and idea explorer, here to stimulate others through the ideas and experiences you have gathered. Your curiosity about life is itself a gift to the world.',
  },
  {
    gates: [35, 36], centers: ['Throat', 'SolarPlexus'],
    name: 'The Channel of Transitoriness', type: 'Sensing',
    tooltip: 'You are driven by an emotional hunger for new experiences and the wisdom they bring. You are here to collect the full spectrum of human feeling — not to stay, but to grow through every encounter.',
  },

  // Circuit: Collective Logic
  {
    gates: [63, 4], centers: ['Head', 'Ajna'],
    name: 'The Channel of Logic', type: 'Logic',
    tooltip: 'Your mind is built to doubt, question, and seek proof — you are never satisfied with "because I said so." This channel gifts you with the ability to spot patterns and test ideas until they hold up to scrutiny.',
  },
  {
    gates: [17, 62], centers: ['Ajna', 'Throat'],
    name: 'The Channel of Acceptance', type: 'Logic',
    tooltip: 'You are gifted with the ability to organise complex ideas into clear, communicable detail that others can actually use. Your power lies in translating logical insight into practical, shareable knowledge.',
  },
  {
    gates: [16, 48], centers: ['Throat', 'Spleen'],
    name: 'The Channel of The Wavelength', type: 'Logic',
    tooltip: 'You have an intuitive mastery of skills that deepens through repetition and devotion. Your enthusiasm for what you love is infectious, and your depth of knowledge is a genuine resource for others.',
  },
  {
    gates: [9, 52], centers: ['Sacral', 'Root'],
    name: 'The Channel of Concentration', type: 'Logic',
    tooltip: 'You have the rare capacity to focus deeply and steadily on what matters, bringing quiet determination to any detail that serves the bigger picture. Stillness and patience are your superpowers.',
  },
  {
    gates: [5, 15], centers: ['Sacral', 'G'],
    name: 'The Channel of Rhythm', type: 'Logic',
    tooltip: 'You are attuned to the natural rhythms of life — in your body, your routines, and the world around you. When you honour your own timing rather than forcing it, everything flows with surprising ease.',
  },

  // Circuit: Tribal
  {
    gates: [45, 21], centers: ['Throat', 'Heart'],
    name: 'The Channel of The Money Line', type: 'Tribal',
    tooltip: 'You are built to manage and distribute material resources for the people in your care. When you lead with clear authority and honest ownership, you create genuine security for yourself and your community.',
  },
  {
    gates: [37, 40], centers: ['SolarPlexus', 'Heart'],
    name: 'The Channel of Community', type: 'Tribal',
    tooltip: 'You thrive through clear agreements and the warmth of belonging — you give your best when the bargain is fair and the people around you feel like family. Boundaries and loyalty are two sides of the same coin for you.',
  },
  {
    gates: [59, 6], centers: ['Sacral', 'SolarPlexus'],
    name: 'The Channel of Mating', type: 'Tribal',
    tooltip: 'You carry a powerful drive toward intimacy and the creation of new life — whether that is children, projects, or deep bonds. Emotional clarity over time is what allows your connections to become truly sacred.',
  },
  {
    gates: [27, 50], centers: ['Sacral', 'Spleen'],
    name: 'The Channel of Preservation', type: 'Tribal',
    tooltip: 'You are deeply instinctive about nourishing and protecting those in your care, upholding the values that keep a community healthy and whole. Your nurturing is not just warmth — it is a force of survival.',
  },
  {
    gates: [19, 49], centers: ['Root', 'SolarPlexus'],
    name: 'The Channel of Synthesis', type: 'Tribal',
    tooltip: 'You are exquisitely sensitive to whether your needs — and the needs of those around you — are being genuinely met. When the conditions are right, you can catalyse powerful transformation in your relationships and community.',
  },
  {
    gates: [32, 54], centers: ['Spleen', 'Root'],
    name: 'The Channel of Transformation', type: 'Tribal',
    tooltip: 'You carry an instinctive drive to rise and transform — not just for yourself, but for the material security of those you love. Your ambition, when grounded in service, becomes a channel for collective evolution.',
  },
  {
    gates: [26, 44], centers: ['Heart', 'Spleen'],
    name: 'The Channel of Enterprise', type: 'Tribal',
    tooltip: 'You have a natural gift for recognising what works and selling it with conviction — your memory for what has succeeded in the past makes you a powerful force in any enterprise. Integrity is the key that unlocks your full potential.',
  },

  // Circuit: Individual
  {
    gates: [28, 38], centers: ['Spleen', 'Root'],
    name: 'The Channel of Struggle', type: 'Individual',
    tooltip: 'You are here to wrestle with life in search of what makes it truly worth living. Your willingness to engage in the struggle — not to win, but to find meaning — is a profound gift to a world that often avoids depth.',
  },
  {
    gates: [57, 20], centers: ['Spleen', 'Throat'],
    name: 'The Channel of The Brainwave', type: 'Individual',
    tooltip: 'You receive sudden, penetrating intuitive insights that arrive without warning and must be expressed immediately or they are lost. Your gift is not logic — it is the lightning strike of knowing in the now.',
  },
  {
    gates: [39, 55], centers: ['Root', 'SolarPlexus'],
    name: 'The Channel of Emoting', type: 'Individual',
    tooltip: 'You carry a deep and sometimes turbulent emotional life that is the source of your greatest creativity and spiritual depth. Your feelings are not problems to be solved — they are the fuel for your unique contribution.',
  },
  {
    gates: [12, 22], centers: ['Throat', 'SolarPlexus'],
    name: 'The Channel of Openness', type: 'Individual',
    tooltip: 'You have the gift of moving others through your emotional expression — grace, artistry, and the timing of when to speak are everything for you. When the moment is right, your voice carries a rare and transformative beauty.',
  },
  {
    gates: [14, 2], centers: ['Sacral', 'G'],
    name: 'The Channel of The Beat', type: 'Individual',
    tooltip: 'You are a keeper of direction and resources — your Sacral energy is most alive when devoted to work that genuinely lights you up from within. When you love what you do, abundance flows as a natural consequence.',
  },
  {
    gates: [29, 46], centers: ['Sacral', 'G'],
    name: 'The Channel of Discovery', type: 'Individual',
    tooltip: 'You are here to say yes to the experiences that call to your body — and through deep, committed engagement with life, to discover who you truly are. Your devotion to what you love becomes a blessing for everyone watching.',
  },
  {
    gates: [3, 60], centers: ['Sacral', 'Root'],
    name: 'The Channel of Mutation', type: 'Individual',
    tooltip: 'You carry the energy of mutation — the capacity to initiate change that transforms not just your own life but the lives of those around you. The key is accepting the stillness between pulses, trusting that the next wave will come.',
  },
  {
    gates: [53, 42], centers: ['Root', 'Sacral'],
    name: 'The Channel of Maturation', type: 'Individual',
    tooltip: 'You have a powerful drive to begin and complete cycles — to start things, see them through, and extract the full wisdom from each experience. Finishing what you start is how you mature and how you serve.',
  },
  {
    gates: [18, 58], centers: ['Spleen', 'Root'],
    name: 'The Channel of Judgment', type: 'Individual',
    tooltip: 'You are gifted with a deep love of life and an instinctive eye for what could be better. Your drive to correct and improve is not criticism — it is an expression of your profound care for excellence and aliveness.',
  },
  {
    gates: [41, 30], centers: ['Root', 'SolarPlexus'],
    name: 'The Channel of Recognition', type: 'Individual',
    tooltip: 'You carry a burning desire for experience and the emotional depth that comes from living fully. Your dreams and longings are not fantasies — they are the compass pointing you toward your most meaningful life.',
  },
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
// "Motor connected to Throat" means they are in the SAME connected component.
// Simply checking if both centers are defined is WRONG for Split Definitions.
function determineType(definedCenters: Center[], activeChannels: Channel[]): string {
  if (definedCenters.length === 0) return 'Reflector'

  // Build connected component map
  const graph: Record<string, Set<string>> = {}
  definedCenters.forEach(c => { graph[c] = new Set() })
  activeChannels.forEach(ch => {
    const [c1, c2] = ch.centers
    if (definedCenters.includes(c1) && definedCenters.includes(c2)) {
      graph[c1].add(c2); graph[c2].add(c1)
    }
  })
  const compId: Record<string, number> = {}
  let comp = 0
  definedCenters.forEach(c => {
    if (!(c in compId)) {
      const q = [c]
      while (q.length) {
        const n = q.shift()!
        if (n in compId) continue
        compId[n] = comp
        graph[n]?.forEach(nb => { if (!(nb in compId)) q.push(nb as Center) })
      }
      comp++
    }
  })

  const hasSacral = definedCenters.includes('Sacral')
  const hasThroat = definedCenters.includes('Throat')
  const throatComp = compId['Throat'] ?? -1
  const MOTORS: Center[] = ['Sacral', 'Heart', 'SolarPlexus', 'Root']
  const motorToThroat = hasThroat && MOTORS.some(m =>
    definedCenters.includes(m) && compId[m] === throatComp
  )

  if (hasSacral && motorToThroat) return 'Manifesting Generator'
  if (hasSacral) return 'Generator'
  if (!hasSacral && motorToThroat) return 'Manifestor'
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
        centerGraph[node]?.forEach(nb => { if (!visited.has(nb)) queue.push(nb as Center) })
      }
    }
  })
  if (components === 1) return 'Single Definition'
  if (components === 2) return 'Split Definition'
  if (components === 3) return 'Triple Split'
  return 'Quadruple Split'
}

// ── INCARNATION CROSS ──────────────────────────────────────
export function getIncarnationCross(
  pSunGate: number, pEarthGate: number,
  dSunGate: number, dEarthGate: number
): string {
  return `Cross of ${pSunGate}/${pEarthGate} | ${dSunGate}/${dEarthGate}`
}

// ── MAIN CHART CALCULATION ─────────────────────────────────
export async function calculateHDChart(
  birthDate: Date,
  _lat?: number,
  _lon?: number
): Promise<HDChart> {
  const birthJD = dateToJulian(birthDate)
  // Design date: ~88 days (88.736 days) before birth
  const designDate = new Date(birthDate.getTime() - 88.736 * 24 * 60 * 60 * 1000)
  const designJD = dateToJulian(designDate)

  // Import swisseph calculation
  const { computeAllPlanets } = await import('./swissEph')

  const [pPositions, dPositions] = await Promise.all([
    computeAllPlanets(birthJD),
    computeAllPlanets(designJD),
  ])

  const pSunLon   = pPositions.sun
  const pEarthLon = (pPositions.sun + 180) % 360
  const pMoonLon  = pPositions.moon
  const pNNLon    = pPositions.northNode
  const pSNLon    = (pPositions.northNode + 180) % 360
  const pMerLon   = pPositions.mercury
  const pVenLon   = pPositions.venus
  const pMarLon   = pPositions.mars
  const pJupLon   = pPositions.jupiter
  const pSatLon   = pPositions.saturn
  const pUranLon  = pPositions.uranus
  const pNepLon   = pPositions.neptune
  const pPlutLon  = pPositions.pluto

  const dSunLon   = dPositions.sun
  const dEarthLon = (dPositions.sun + 180) % 360
  const dMoonLon  = dPositions.moon
  const dNNLon    = dPositions.northNode
  const dSNLon    = (dPositions.northNode + 180) % 360
  const dMerLon   = dPositions.mercury
  const dVenLon   = dPositions.venus
  const dMarLon   = dPositions.mars
  const dJupLon   = dPositions.jupiter
  const dSatLon   = dPositions.saturn
  const dUranLon  = dPositions.uranus
  const dNepLon   = dPositions.neptune
  const dPlutLon  = dPositions.pluto

  const pActivations: PlanetActivation[] = [
    { planet: 'sun',       personality: longitudeToGateAndLine(pSunLon),   design: longitudeToGateAndLine(dSunLon) },
    { planet: 'earth',     personality: longitudeToGateAndLine(pEarthLon), design: longitudeToGateAndLine(dEarthLon) },
    { planet: 'moon',      personality: longitudeToGateAndLine(pMoonLon),  design: longitudeToGateAndLine(dMoonLon) },
    { planet: 'northNode', personality: longitudeToGateAndLine(pNNLon),    design: longitudeToGateAndLine(dNNLon) },
    { planet: 'southNode', personality: longitudeToGateAndLine(pSNLon),    design: longitudeToGateAndLine(dSNLon) },
    { planet: 'mercury',   personality: longitudeToGateAndLine(pMerLon),   design: longitudeToGateAndLine(dMerLon) },
    { planet: 'venus',     personality: longitudeToGateAndLine(pVenLon),   design: longitudeToGateAndLine(dVenLon) },
    { planet: 'mars',      personality: longitudeToGateAndLine(pMarLon),   design: longitudeToGateAndLine(dMarLon) },
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
  const type = determineType(definedCenters, activeChannels)
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
