/**
 * /api/chart-calculate
 * Server-side API route that calls the Astrologer API (RapidAPI)
 * for planetary positions, then applies HD gate mapping.
 */

import type { NextApiRequest, NextApiResponse } from 'next'

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

const PLANET_MAP: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus',
  neptune: 'Neptune', pluto: 'Pluto', northNode: 'Mean_Node',
}

async function getPlanetaryPositions(
  year: number, month: number, day: number,
  hour: number, minute: number,
  latitude: number, longitude: number, timezone: string, city: string = 'Unknown'
): Promise<Record<string, number>> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) throw new Error('RAPIDAPI_KEY not configured')

  const res = await fetch('https://astrologer.p.rapidapi.com/api/v5/chart-data/birth-chart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Host': 'astrologer.p.rapidapi.com',
      'X-RapidAPI-Key': apiKey,
    },
    body: JSON.stringify({
      subject: { name: 'Chart', year, month, day, hour, minute, longitude, latitude, timezone, city }
    }),
  })

  if (!res.ok) throw new Error(`Astrologer API error ${res.status}: ${await res.text()}`)

  const data = await res.json()
  const subject = data?.chart_data?.subject || data?.subject
  if (!subject) throw new Error('Unexpected API response format')

  const planets: Record<string, number> = {}
  for (const [ourName, apiName] of Object.entries(PLANET_MAP)) {
    const keysToTry = ourName === 'northNode'
      ? ['mean_node', 'true_node', 'north_node', 'meannode', 'node']
      : [apiName.toLowerCase()]
    for (const key of keysToTry) {
      const pd = subject[key]
      if (pd && typeof pd.abs_pos === 'number') { planets[ourName] = pd.abs_pos; break }
    }
  }

  if (planets.sun !== undefined) planets.earth = (planets.sun + 180) % 360
  if (planets.northNode !== undefined) planets.southNode = (planets.northNode + 180) % 360

  return planets
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { birthDate, birthTime, latitude, longitude, timezone, city } = req.body
    if (!birthDate || !latitude || !longitude || !timezone)
      return res.status(400).json({ error: 'Missing required fields' })

    const [year, month, day] = birthDate.split('-').map(Number)
    const [hour, minute] = birthTime ? birthTime.split(':').map(Number) : [12, 0]

    const birthLocalMs   = Date.UTC(year, month - 1, day, hour, minute)
    const birthOffsetMin = getUTCOffset(new Date(birthLocalMs), timezone)
    const birthUTC       = new Date(birthLocalMs - birthOffsetMin * 60000)

    const designUTC = new Date(birthUTC.getTime() - 91 * 24 * 60 * 60 * 1000)
    const designOffsetMin = getUTCOffset(designUTC, timezone)
    const designLocal = new Date(designUTC.getTime() + designOffsetMin * 60000)

    const personalityPositions = await getPlanetaryPositions(
      year, month, day, hour, minute, latitude, longitude, timezone, city || 'Unknown'
    )
    await new Promise(resolve => setTimeout(resolve, 1100))
    const designPositions = await getPlanetaryPositions(
      designLocal.getUTCFullYear(), designLocal.getUTCMonth() + 1, designLocal.getUTCDate(),
      designLocal.getUTCHours(), designLocal.getUTCMinutes(),
      latitude, longitude, timezone, city || 'Unknown'
    )

    const planets = ['sun','earth','moon','northNode','southNode','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']
    const activations = planets.map(planet => ({
      planet,
      personality: { ...longitudeToGateLine(personalityPositions[planet] ?? 0), longitude: personalityPositions[planet] ?? 0 },
      design:      { ...longitudeToGateLine(designPositions[planet] ?? 0),       longitude: designPositions[planet] ?? 0 },
    }))

    return res.status(200).json({
      activations,
      personalityPositions,
      designPositions,
      designDate: designUTC.toISOString(),
      engine: 'astrologer-api',
      debug: {
        birthUTC: birthUTC.toISOString(),
        designUTC: designUTC.toISOString(),
        sunLongitudes: { personality: personalityPositions.sun, design: designPositions.sun },
        nodePositions: {
          personalityNorthNode: personalityPositions.northNode, personalitySouthNode: personalityPositions.southNode,
          designNorthNode: designPositions.northNode, designSouthNode: designPositions.southNode,
        },
        mercuryPositions: { personality: personalityPositions.mercury, design: designPositions.mercury },
        saturnPositions:  { personality: personalityPositions.saturn,  design: designPositions.saturn  },
      },
    })
  } catch (err: any) {
    console.error('Chart calculation error:', err)
    return res.status(500).json({ error: err.message || 'Calculation failed' })
  }
}
