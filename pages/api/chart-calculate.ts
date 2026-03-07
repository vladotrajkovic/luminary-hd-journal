/**
 * /api/chart-calculate
 * Server-side API route that calls the Astrologer API (Swiss Ephemeris)
 * for precise planetary positions, then applies HD gate mapping.
 */

import type { NextApiRequest, NextApiResponse } from 'next'

const GATE_WHEEL: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60
]

// HD wheel starts at 0° Aquarius = 300° ecliptic longitude
const HD_WHEEL_START = 300.0

function longitudeToGateLine(lon: number): { gate: number; line: number } {
  const adjusted = ((lon - HD_WHEEL_START) + 360) % 360
  const pos = (adjusted / 360) * 384
  const gateIndex = Math.floor(pos / 6) % 64
  const line = Math.floor(pos) % 6 + 1
  return { gate: GATE_WHEEL[gateIndex], line }
}

// Planet name mapping: our names → Astrologer API names
const PLANET_MAP: Record<string, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
  northNode: 'Mean_Node',
}

async function getPlanetaryPositions(
  year: number, month: number, day: number,
  hour: number, minute: number,
  latitude: number, longitude: number, timezone: string
): Promise<Record<string, number>> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) throw new Error('RAPIDAPI_KEY not configured')

  const body = {
    subject: {
      name: 'Chart',
      year, month, day, hour, minute,
      longitude,
      latitude,
      timezone,
      city: city || 'Unknown',
    }
  }

  const res = await fetch('https://astrologer.p.rapidapi.com/api/v5/chart-data/birth-chart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Host': 'astrologer.p.rapidapi.com',
      'X-RapidAPI-Key': apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Astrologer API error ${res.status}: ${text}`)
  }

  const data = await res.json()

  // Extract planet longitudes from response
  // Response format: data.chart_data.subject.planets_degrees_ut
  const planets: Record<string, number> = {}

  // The API returns planets in data.chart_data.subject
  const subject = data?.chart_data?.subject || data?.subject
  if (!subject) throw new Error('Unexpected API response format')

  // Map each planet
  for (const [ourName, apiName] of Object.entries(PLANET_MAP)) {
    // Planets are in subject as lowercase keys
    const key = apiName.toLowerCase()
    const planetData = subject[key]
    if (planetData && typeof planetData.abs_pos === 'number') {
      planets[ourName] = planetData.abs_pos
    }
  }

  // Earth = opposite of Sun
  if (planets.sun !== undefined) {
    planets.earth = (planets.sun + 180) % 360
  }

  // South Node = opposite of North Node
  if (planets.northNode !== undefined) {
    planets.southNode = (planets.northNode + 180) % 360
  }

  return planets
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { birthDate, birthTime, latitude, longitude, timezone, city } = req.body

    if (!birthDate || !latitude || !longitude || !timezone) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const [year, month, day] = birthDate.split('-').map(Number)
    const [hour, minute] = birthTime ? birthTime.split(':').map(Number) : [12, 0]

    // Calculate design date: 88 days + 88 minutes before birth
    const birthMs = new Date(`${birthDate}T${birthTime || '12:00'}:00`).getTime()
    const designMs = birthMs - (88 * 24 * 60 * 60 * 1000) - (88 * 60 * 1000)
    const designDate = new Date(designMs)
    const dYear = designDate.getUTCFullYear()
    const dMonth = designDate.getUTCMonth() + 1
    const dDay = designDate.getUTCDate()
    const dHour = designDate.getUTCHours()
    const dMinute = designDate.getUTCMinutes()

    // Fetch sequentially with delay to respect free tier rate limit (1 req/sec)
    const personalityPositions = await getPlanetaryPositions(year, month, day, hour, minute, latitude, longitude, timezone)
    await new Promise(resolve => setTimeout(resolve, 1100))
    const designPositions = await getPlanetaryPositions(dYear, dMonth, dDay, dHour, dMinute, latitude, longitude, timezone)

    // Map to gates and lines
    const planets = ['sun', 'earth', 'moon', 'northNode', 'southNode', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']

    const activations = planets.map(planet => ({
      planet,
      personality: {
        ...longitudeToGateLine(personalityPositions[planet] ?? 0),
        longitude: personalityPositions[planet] ?? 0,
      },
      design: {
        ...longitudeToGateLine(designPositions[planet] ?? 0),
        longitude: designPositions[planet] ?? 0,
      },
    }))

    return res.status(200).json({
      activations,
      personalityPositions,
      designPositions,
      designDate: designDate.toISOString(),
    })

  } catch (err: any) {
    console.error('Chart calculation error:', err)
    return res.status(500).json({ error: err.message || 'Calculation failed' })
  }
}
