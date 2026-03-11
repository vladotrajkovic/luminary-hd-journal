/**
 * ============================================================
 * LUMINARY — Server-only chart calculation
 * This file imports swisseph-v2 (native Node binary) and must
 * NEVER be imported by client-side pages or components.
 * Use lib/hdCalculator.ts for types, ALL_CHANNELS, and helpers.
 * ============================================================
 */

import {
  dateToJulian,
  longitudeToGateAndLine,
  ALL_CHANNELS,
  getIncarnationCross,
} from './hdCalculator'

import type { Center, HDChart, PlanetActivation } from './hdCalculator'

// ── Internal helpers (duplicated here to avoid pulling them into the client) ──

function getDefinedCenters(activeGates: number[]): Center[] {
  const defined = new Set<Center>()
  for (const channel of ALL_CHANNELS) {
    const [g1, g2] = channel.gates
    if (activeGates.includes(g1) && activeGates.includes(g2)) {
      defined.add(channel.centers[0])
      defined.add(channel.centers[1])
    }
  }
  return Array.from(defined)
}

function determineType(definedCenters: Center[], activeChannels: typeof ALL_CHANNELS): string {
  if (definedCenters.length === 0) return 'Reflector'
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

function determineAuthority(definedCenters: Center[], type: string): string {
  if (type === 'Reflector') return 'Lunar'
  if (definedCenters.includes('SolarPlexus')) return 'Emotional/Solar Plexus'
  if (definedCenters.includes('Sacral')) return 'Sacral'
  if (definedCenters.includes('Spleen')) return 'Splenic'
  if (definedCenters.includes('Heart')) return 'Ego/Heart'
  if (definedCenters.includes('G')) return 'G Center/Self'
  return 'Mental/Environment'
}

function determineDefinition(activeChannels: typeof ALL_CHANNELS, definedCenters: Center[]): string {
  if (definedCenters.length === 0) return 'No Definition (Reflector)'
  const centerGraph: Record<string, Set<string>> = {}
  definedCenters.forEach(c => { centerGraph[c] = new Set() })
  activeChannels.forEach(ch => {
    const [c1, c2] = ch.centers
    if (definedCenters.includes(c1) && definedCenters.includes(c2)) {
      centerGraph[c1]?.add(c2)
      centerGraph[c2]?.add(c1)
    }
  })
  const visited = new Set<string>()
  let components = 0
  definedCenters.forEach(center => {
    if (!visited.has(center)) {
      components++
      const queue: Center[] = [center]
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

// ── MAIN CHART CALCULATION (server-only) ──────────────────
export async function calculateHDChart(
  birthDate: Date,
  _lat?: number,
  _lon?: number
): Promise<HDChart> {
  const birthJD = dateToJulian(birthDate)
  const designDate = new Date(birthDate.getTime() - 88.736 * 24 * 60 * 60 * 1000)
  const designJD = dateToJulian(designDate)

  // Dynamic import keeps swisseph-v2 out of the client bundle
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

  const personalityGates = pActivations.map(a => a.personality.gate)
  const designGates = pActivations.map(a => a.design.gate)
  const allGates = Array.from(new Set([...personalityGates, ...designGates]))

  const activeChannels = ALL_CHANNELS.filter(ch =>
    allGates.includes(ch.gates[0]) && allGates.includes(ch.gates[1])
  )

  const definedCenters = getDefinedCenters(allGates)
  const allCenters: Center[] = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'Sacral', 'SolarPlexus', 'Spleen', 'Root']
  const openCenters = allCenters.filter(c => !definedCenters.includes(c))

  const type = determineType(definedCenters, activeChannels)
  const authority = determineAuthority(definedCenters, type)

  const pSunActivation = pActivations.find(a => a.planet === 'sun')!
  const dSunActivation = pActivations.find(a => a.planet === 'sun')!
  const profile = `${pSunActivation.personality.line}/${dSunActivation.design.line}`
  const definition = determineDefinition(activeChannels, definedCenters)

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
