import React from 'react'
import { Center, Channel, HDChart } from '../../lib/hdCalculator'

interface BodyGraphProps {
  chart: HDChart
  size?: number
}

// Center positions in the body graph (x, y, width, height)
const CENTER_POSITIONS: Record<Center, { x: number; y: number; w: number; h: number; shape: 'diamond' | 'square' | 'triangle-up' | 'triangle-down' }> = {
  Head:        { x: 220, y: 20,  w: 60, h: 50,  shape: 'triangle-up' },
  Ajna:        { x: 220, y: 100, w: 60, h: 50,  shape: 'triangle-down' },
  Throat:      { x: 220, y: 185, w: 60, h: 40,  shape: 'square' },
  G:           { x: 220, y: 265, w: 60, h: 60,  shape: 'diamond' },
  Heart:       { x: 310, y: 255, w: 50, h: 50,  shape: 'diamond' },
  Sacral:      { x: 220, y: 360, w: 60, h: 40,  shape: 'square' },
  SolarPlexus: { x: 310, y: 340, w: 50, h: 50,  shape: 'diamond' },
  Spleen:      { x: 130, y: 255, w: 50, h: 50,  shape: 'diamond' },
  Root:        { x: 220, y: 430, w: 60, h: 40,  shape: 'square' },
}

// Center colors when defined
const CENTER_COLORS: Record<Center, { defined: string; open: string; stroke: string }> = {
  Head:        { defined: '#9333EA', open: 'transparent', stroke: '#A78BFA' },
  Ajna:        { defined: '#7C3AED', open: 'transparent', stroke: '#A78BFA' },
  Throat:      { defined: '#2563EB', open: 'transparent', stroke: '#6366F1' },
  G:           { defined: '#D97706', open: 'transparent', stroke: '#F59E0B' },
  Heart:       { defined: '#DC2626', open: 'transparent', stroke: '#F87171' },
  Sacral:      { defined: '#B45309', open: 'transparent', stroke: '#D97706' },
  SolarPlexus: { defined: '#CA8A04', open: 'transparent', stroke: '#FCD34D' },
  Spleen:      { defined: '#059669', open: 'transparent', stroke: '#34D399' },
  Root:        { defined: '#6D28D9', open: 'transparent', stroke: '#8B5CF6' },
}

const CENTER_LABELS: Record<Center, string> = {
  Head:        'HEAD',
  Ajna:        'AJNA',
  Throat:      'THROAT',
  G:           'G',
  Heart:       'HEART',
  Sacral:      'SACRAL',
  SolarPlexus: 'S.PLEXUS',
  Spleen:      'SPLEEN',
  Root:        'ROOT',
}

// Channel connection lines between centers
const CHANNEL_LINES: Array<{ centers: [Center, Center]; path: string }> = [
  { centers: ['Head', 'Ajna'],        path: 'M250,70 L250,100' },
  { centers: ['Ajna', 'Throat'],      path: 'M250,150 L250,185' },
  { centers: ['Throat', 'G'],         path: 'M250,225 L250,265' },
  { centers: ['Throat', 'Heart'],     path: 'M280,205 L310,255' },
  { centers: ['Throat', 'SolarPlexus'], path: 'M220,205 L310,340' },
  { centers: ['G', 'Heart'],          path: 'M280,295 L310,280' },
  { centers: ['G', 'Sacral'],         path: 'M250,325 L250,360' },
  { centers: ['G', 'Spleen'],         path: 'M220,295 L180,280' },
  { centers: ['Heart', 'Sacral'],     path: 'M320,305 L280,360' },
  { centers: ['Heart', 'SolarPlexus'], path: 'M335,305 L335,340' },
  { centers: ['Sacral', 'SolarPlexus'], path: 'M280,380 L310,365' },
  { centers: ['Sacral', 'Spleen'],    path: 'M220,380 L180,305' },
  { centers: ['Sacral', 'Root'],      path: 'M250,400 L250,430' },
  { centers: ['SolarPlexus', 'Root'], path: 'M320,390 L280,430' },
  { centers: ['Spleen', 'Root'],      path: 'M155,305 L240,430' },
]

function getCenterCenter(center: Center): { cx: number; cy: number } {
  const pos = CENTER_POSITIONS[center]
  return { cx: pos.x + pos.w / 2, cy: pos.y + pos.h / 2 }
}

function renderCenter(
  center: Center,
  isDefined: boolean,
  activeGates: number[],
  allPersonalityGates: number[],
  allDesignGates: number[]
) {
  const pos = CENTER_POSITIONS[center]
  const colors = CENTER_COLORS[center]
  const cx = pos.x + pos.w / 2
  const cy = pos.y + pos.h / 2
  const fillColor = isDefined ? colors.defined : 'transparent'
  const strokeColor = colors.stroke
  const strokeOpacity = isDefined ? 1 : 0.3
  const fillOpacity = isDefined ? 0.85 : 0

  let shape: React.ReactElement

  if (pos.shape === 'diamond') {
    const hw = pos.w / 2
    const hh = pos.h / 2
    const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`
    shape = (
      <polygon
        points={points}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeOpacity={strokeOpacity}
        strokeWidth={isDefined ? 2 : 1}
      />
    )
  } else if (pos.shape === 'triangle-up') {
    const points = `${cx},${pos.y} ${pos.x + pos.w},${pos.y + pos.h} ${pos.x},${pos.y + pos.h}`
    shape = (
      <polygon
        points={points}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeOpacity={strokeOpacity}
        strokeWidth={isDefined ? 2 : 1}
      />
    )
  } else if (pos.shape === 'triangle-down') {
    const points = `${pos.x},${pos.y} ${pos.x + pos.w},${pos.y} ${cx},${pos.y + pos.h}`
    shape = (
      <polygon
        points={points}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeOpacity={strokeOpacity}
        strokeWidth={isDefined ? 2 : 1}
      />
    )
  } else {
    // Square/rectangle
    shape = (
      <rect
        x={pos.x}
        y={pos.y}
        width={pos.w}
        height={pos.h}
        rx={4}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeOpacity={strokeOpacity}
        strokeWidth={isDefined ? 2 : 1}
      />
    )
  }

  const labelColor = isDefined ? '#fff' : `${strokeColor}66`

  return (
    <g key={center}>
      {shape}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={9}
        fontFamily="'Cinzel', serif"
        letterSpacing={0.5}
        fill={labelColor}
        style={{ pointerEvents: 'none' }}
      >
        {CENTER_LABELS[center]}
      </text>
    </g>
  )
}

export default function BodyGraph({ chart, size = 500 }: BodyGraphProps) {
  const viewBox = '80 10 340 480'
  const { definedCenters, allPersonalityGates, allDesignGates, allGates, activeChannels } = chart

  // Determine which channel connections are active
  const activeChannelCenterPairs = new Set(
    activeChannels.map(ch => `${ch.centers[0]}-${ch.centers[1]}`)
  )

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      style={{ maxWidth: '100%', display: 'block' }}
    >
      {/* Background */}
      <rect x="80" y="10" width="340" height="480" fill="rgba(15,10,46,0.0)" />

      {/* Channel connection lines */}
      {CHANNEL_LINES.map(({ centers, path }) => {
        const key = `${centers[0]}-${centers[1]}`
        const reverseKey = `${centers[1]}-${centers[0]}`
        const isActive = activeChannelCenterPairs.has(key) || activeChannelCenterPairs.has(reverseKey)
        const c1Defined = definedCenters.includes(centers[0])
        const c2Defined = definedCenters.includes(centers[1])
        const bothDefined = c1Defined && c2Defined

        return (
          <path
            key={key}
            d={path}
            stroke={isActive ? '#A78BFA' : 'rgba(167,139,250,0.15)'}
            strokeWidth={isActive ? 8 : 4}
            fill="none"
            strokeLinecap="round"
          />
        )
      })}

      {/* Centers */}
      {(Object.keys(CENTER_POSITIONS) as Center[]).map(center =>
        renderCenter(
          center,
          definedCenters.includes(center),
          allGates,
          allPersonalityGates,
          allDesignGates
        )
      )}

      {/* Gate numbers along channels - personality (black/white) */}
      {/* We show key gate numbers near centers */}
    </svg>
  )
}
