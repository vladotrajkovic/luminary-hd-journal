/**
 * /api/chart-calculate — Swiss Ephemeris via swisseph-v2 (synchronous API)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { computeAllPlanets, dateToJD, PlanetPositions } from '../../lib/swissEph'

const GATE_WHEEL: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60
]

const HD_WHEEL_START = 302.25

function longitudeToGateLine(lon: number): { gate: number; line: number } {
  const adjusted = ((lon - HD_WHEEL_START) + 360) % 360
  const pos = (adjusted / 360) * 384
  const gateIndex = Math.floor(pos / 6) % 64
  const line = Math.floor(pos) % 6 + 1
  return { gate: GATE_WHEEL[gateIndex], line }
}

function getUTCOffset(date: Date, tz: string): number {
  const fmt = (timeZone: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(date)
  const utcDate   = new Date(fmt('UTC').replace(', ', 'T') + ':00Z')
  const localDate = new Date(fmt(tz).replace(', ', 'T') + ':00Z')
  return (localDate.getTime() - utcDate.getTime()) / 60000
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { birthDate, birthTime, latitude, longitude, timezone } = req.body
    if (!birthDate || !latitude || !longitude || !timezone)
      return res.status(400).json({ error: 'Missing required fields' })

    const [year, month, day] = (birthDate as string).split('-').map(Number)
    const [hour, minute] = birthTime ? (birthTime as string).split(':').map(Number) : [12, 0]

    // Convert local birth time → UTC
    const birthLocalMs   = Date.UTC(year, month - 1, day, hour, minute)
    const birthOffsetMin = getUTCOffset(new Date(birthLocalMs), timezone)
    const birthUTC       = new Date(birthLocalMs - birthOffsetMin * 60000)

    // Design = 91 calendar days before birth
    const designUTC = new Date(birthUTC.getTime() - 91 * 24 * 60 * 60 * 1000)

    const pJD = dateToJD(
      birthUTC.getUTCFullYear(), birthUTC.getUTCMonth() + 1, birthUTC.getUTCDate(),
      birthUTC.getUTCHours(), birthUTC.getUTCMinutes()
    )
    const dJD = dateToJD(
      designUTC.getUTCFullYear(), designUTC.getUTCMonth() + 1, designUTC.getUTCDate(),
      designUTC.getUTCHours(), designUTC.getUTCMinutes()
    )

    console.log(`📡 pJD=${pJD.toFixed(4)} dJD=${dJD.toFixed(4)}`)

    const pPos = computeAllPlanets(pJD)
    const dPos = computeAllPlanets(dJD)

    console.log(`☉ P.Sun=${pPos.sun.toFixed(4)}° D.Sun=${dPos.sun.toFixed(4)}°`)

    const planets: (keyof PlanetPositions)[] = [
      'sun', 'earth', 'moon', 'northNode', 'southNode',
      'mercury', 'venus', 'mars', 'jupiter', 'saturn',
      'uranus', 'neptune', 'pluto',
    ]

    const activations = planets.map(planet => ({
      planet,
      personality: { ...longitudeToGateLine(pPos[planet]), longitude: pPos[planet] },
      design:      { ...longitudeToGateLine(dPos[planet]),  longitude: dPos[planet]  },
    }))

    return res.status(200).json({
      activations,
      personalityPositions: pPos,
      designPositions: dPos,
      designDate: designUTC.toISOString(),
      engine: 'swisseph-v2',
      debug: {
        birthUTC:    birthUTC.toISOString(),
        designUTC:   designUTC.toISOString(),
        personalityJD: pJD,
        designJD:      dJD,
        sunLongitudes:    { personality: pPos.sun,      design: dPos.sun      },
        moonLongitudes:   { personality: pPos.moon,     design: dPos.moon     },
        nodePositions: {
          personalityNorthNode: pPos.northNode, personalitySouthNode: pPos.southNode,
          designNorthNode:      dPos.northNode, designSouthNode:      dPos.southNode,
        },
        mercuryPositions: { personality: pPos.mercury, design: dPos.mercury },
        saturnPositions:  { personality: pPos.saturn,  design: dPos.saturn  },
      },
    })

  } catch (err: any) {
    console.error('Chart calculation error:', err)
    return res.status(500).json({ error: err.message || 'Calculation failed' })
  }
}
