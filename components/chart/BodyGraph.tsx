import React from 'react'
import { Center, HDChart } from '../../lib/hdCalculator'

interface BodyGraphProps {
  chart: HDChart
  size?: number   // controls SVG width; height auto-scales from viewBox aspect ratio
}

// ─── ViewBox ────────────────────────────────────────────────
// Extended left (-70) and right (+150) to accommodate planet columns
// Original bodygraph canvas: x 80–420, y 10–490
const VB = '-70 5 650 490'
const VB_W = 650
const VB_H = 490

// ─── Center geometry ────────────────────────────────────────
const CENTER_POSITIONS: Record<Center, {
  x: number; y: number; w: number; h: number
  shape: 'diamond' | 'square' | 'triangle-up' | 'triangle-down'
}> = {
  Head:        { x: 220, y: 20,  w: 60, h: 50,  shape: 'triangle-up'   },
  Ajna:        { x: 220, y: 100, w: 60, h: 50,  shape: 'triangle-down' },
  Throat:      { x: 220, y: 185, w: 60, h: 40,  shape: 'square'        },
  G:           { x: 220, y: 265, w: 60, h: 60,  shape: 'diamond'       },
  Heart:       { x: 310, y: 255, w: 50, h: 50,  shape: 'diamond'       },
  Sacral:      { x: 220, y: 360, w: 60, h: 40,  shape: 'square'        },
  SolarPlexus: { x: 310, y: 340, w: 50, h: 50,  shape: 'diamond'       },
  Spleen:      { x: 130, y: 255, w: 50, h: 50,  shape: 'diamond'       },
  Root:        { x: 220, y: 430, w: 60, h: 40,  shape: 'square'        },
}

const CENTER_COLORS: Record<Center, { defined: string; stroke: string }> = {
  Head:        { defined: '#9333EA', stroke: '#A78BFA' },
  Ajna:        { defined: '#7C3AED', stroke: '#A78BFA' },
  Throat:      { defined: '#2563EB', stroke: '#6366F1' },
  G:           { defined: '#D97706', stroke: '#F59E0B' },
  Heart:       { defined: '#DC2626', stroke: '#F87171' },
  Sacral:      { defined: '#B45309', stroke: '#D97706' },
  SolarPlexus: { defined: '#CA8A04', stroke: '#FCD34D' },
  Spleen:      { defined: '#059669', stroke: '#34D399' },
  Root:        { defined: '#6D28D9', stroke: '#8B5CF6' },
}

const CENTER_LABELS: Record<Center, string> = {
  Head: 'HEAD', Ajna: 'AJNA', Throat: 'THROAT', G: 'G',
  Heart: 'HEART', Sacral: 'SACRAL', SolarPlexus: 'S.PLEXUS',
  Spleen: 'SPLEEN', Root: 'ROOT',
}

// ─── Channel lines ───────────────────────────────────────────
// Each path is "M x1,y1 L x2,y2" — start point near centers[0], end near centers[1]
const CHANNEL_LINES: Array<{ centers: [Center, Center]; path: string }> = [
  { centers: ['Head',        'Ajna'],        path: 'M250,70 L250,100'    },
  { centers: ['Ajna',        'Throat'],      path: 'M250,150 L250,185'   },
  { centers: ['Throat',      'G'],           path: 'M250,225 L250,265'   },
  { centers: ['Throat',      'Heart'],       path: 'M280,205 L310,255'   },
  { centers: ['Throat',      'SolarPlexus'], path: 'M220,205 L310,340'   },
  { centers: ['G',           'Heart'],       path: 'M280,295 L310,280'   },
  { centers: ['G',           'Sacral'],      path: 'M250,325 L250,360'   },
  { centers: ['G',           'Spleen'],      path: 'M220,295 L180,280'   },
  { centers: ['Heart',       'Sacral'],      path: 'M320,305 L280,360'   },
  { centers: ['Heart',       'SolarPlexus'], path: 'M335,305 L335,340'   },
  { centers: ['Sacral',      'SolarPlexus'], path: 'M280,380 L310,365'   },
  { centers: ['Sacral',      'Spleen'],      path: 'M220,380 L180,305'   },
  { centers: ['Sacral',      'Root'],        path: 'M250,400 L250,430'   },
  { centers: ['SolarPlexus', 'Root'],        path: 'M320,390 L280,430'   },
  { centers: ['Spleen',      'Root'],        path: 'M155,305 L240,430'   },
]

// ─── Planet columns ──────────────────────────────────────────
// Standard JA top-to-bottom order
const PLANET_ORDER = [
  'sun', 'earth', 'moon', 'northNode', 'southNode',
  'mercury', 'venus', 'mars', 'jupiter',
  'saturn', 'uranus', 'neptune', 'pluto',
] as const

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉', earth: '⊕', moon: '☽', northNode: '☊', southNode: '☋',
  mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃',
  saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
}

// 13 rows evenly spread across the bodygraph y-range (y ≈ 30 – 458)
const ROW_Y = PLANET_ORDER.map((_, i) => 30 + i * 33)

// Column x positions (left = Design/red, right = Personality/purple)
const COL = {
  leftSymbol:   -52,   // planet glyph, left column
  leftGate:     -10,   // gate.line number, left column (right-aligned near bodygraph)
  rightGate:    425,   // gate.line number, right column
  rightSymbol:  468,   // planet glyph, right column
  leftHeader:   -32,   // "DESIGN" header centre
  rightHeader:  448,   // "PERSONALITY" header centre
}

const COLOR = {
  design:      '#F87171',           // red  — unconscious / design
  personality: '#A78BFA',           // purple — conscious / personality
  both:        '#D4AF37',           // gold  — activated from both sides
  inactive:    'rgba(167,139,250,0.18)',
  headerText:  'rgba(167,139,250,0.45)',
  dimLine:     'rgba(167,139,250,0.12)',
  activeLineP: '#A78BFA',
  activeLineD: '#F87171',
}

// ─── Helpers ─────────────────────────────────────────────────

/** Parse "M x1,y1 L x2,y2" into endpoint coordinates */
function parsePathEndpoints(path: string) {
  const m = path.match(/M\s*([\d.-]+)[, ]([\d.-]+)\s*L\s*([\d.-]+)[, ]([\d.-]+)/)
  if (!m) return null
  return { x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] }
}

/** Interpolate along a line at fraction t */
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

/** Perpendicular unit vector (left of direction of travel) scaled by d */
function perp(x1: number, y1: number, x2: number, y2: number, d: number) {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  return { px: (-dy / len) * d, py: (dx / len) * d }
}

// ─── Center renderer ─────────────────────────────────────────
function renderCenter(
  center: Center,
  isDefined: boolean,
) {
  const pos = CENTER_POSITIONS[center]
  const { defined: fillColor, stroke: strokeColor } = CENTER_COLORS[center]
  const cx = pos.x + pos.w / 2
  const cy = pos.y + pos.h / 2
  const sharedProps = {
    fill:         isDefined ? fillColor : 'transparent',
    fillOpacity:  isDefined ? 0.85 : 0,
    stroke:       strokeColor,
    strokeOpacity: isDefined ? 1 : 0.3,
    strokeWidth:  isDefined ? 2 : 1,
  }
  const labelColor = isDefined ? '#fff' : `${strokeColor}66`

  let shape: React.ReactElement
  if (pos.shape === 'diamond') {
    const hw = pos.w / 2, hh = pos.h / 2
    shape = <polygon points={`${cx},${cy-hh} ${cx+hw},${cy} ${cx},${cy+hh} ${cx-hw},${cy}`} {...sharedProps} />
  } else if (pos.shape === 'triangle-up') {
    shape = <polygon points={`${cx},${pos.y} ${pos.x+pos.w},${pos.y+pos.h} ${pos.x},${pos.y+pos.h}`} {...sharedProps} />
  } else if (pos.shape === 'triangle-down') {
    shape = <polygon points={`${pos.x},${pos.y} ${pos.x+pos.w},${pos.y} ${cx},${pos.y+pos.h}`} {...sharedProps} />
  } else {
    shape = <rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={4} {...sharedProps} />
  }

  return (
    <g key={center}>
      {shape}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9}
        fontFamily="'Cinzel', serif" letterSpacing={0.5}
        fill={labelColor} style={{ pointerEvents: 'none' }}>
        {CENTER_LABELS[center]}
      </text>
    </g>
  )
}

// ─── Main component ──────────────────────────────────────────
export default function BodyGraph({ chart, size = 500 }: BodyGraphProps) {
  const {
    definedCenters,
    activeChannels,
    allPersonalityGates,
    allDesignGates,
    personalityActivations,
  } = chart

  const personalitySet = new Set(allPersonalityGates)
  const designSet      = new Set(allDesignGates)

  /** Gate colour: gold if both sides, purple if personality, red if design */
  function gateColor(gate: number): string {
    const isP = personalitySet.has(gate)
    const isD = designSet.has(gate)
    if (isP && isD) return COLOR.both
    if (isP) return COLOR.personality
    if (isD) return COLOR.design
    return COLOR.inactive
  }

  // Build center-pair → active channel list lookup
  const pairToChannels = new Map<string, typeof activeChannels>()
  for (const ch of activeChannels) {
    const k = `${ch.centers[0]}-${ch.centers[1]}`
    if (!pairToChannels.has(k)) pairToChannels.set(k, [])
    pairToChannels.get(k)!.push(ch)
  }
  function getChannelsForPair(c1: Center, c2: Center) {
    return pairToChannels.get(`${c1}-${c2}`)
      ?? pairToChannels.get(`${c2}-${c1}`)
      ?? []
  }

  // Active center pairs (for channel line colouring)
  const activeChannelCenterPairs = new Set(
    activeChannels.flatMap(ch => [
      `${ch.centers[0]}-${ch.centers[1]}`,
      `${ch.centers[1]}-${ch.centers[0]}`,
    ])
  )

  const svgWidth  = size
  const svgHeight = Math.round(size * VB_H / VB_W)

  return (
    <svg
      viewBox={VB}
      width={svgWidth}
      height={svgHeight}
      style={{ maxWidth: '100%', display: 'block' }}
    >
      {/* ── Column headers ── */}
      <text x={COL.leftHeader}  y={16} textAnchor="middle" fontSize={7}
        fontFamily="Helvetica, sans-serif" fontWeight="bold"
        letterSpacing={1.5} fill={COLOR.design} opacity={0.8}>
        DESIGN
      </text>
      <text x={COL.rightHeader} y={16} textAnchor="middle" fontSize={7}
        fontFamily="Helvetica, sans-serif" fontWeight="bold"
        letterSpacing={1.5} fill={COLOR.personality} opacity={0.8}>
        PERSONALITY
      </text>

      {/* ── Column header underlines ── */}
      <line x1={-65} y1={20} x2={-2}  y2={20} stroke={COLOR.design}      strokeWidth={0.5} opacity={0.4} />
      <line x1={423} y1={20} x2={480} y2={20} stroke={COLOR.personality} strokeWidth={0.5} opacity={0.4} />

      {/* ── Planet rows ── */}
      {PLANET_ORDER.map((planet, i) => {
        const act = personalityActivations.find(a => a.planet === planet)
        if (!act) return null
        const y   = ROW_Y[i]
        const sym = PLANET_SYMBOLS[planet] ?? '?'
        const pGL = `${act.personality.gate}.${act.personality.line}`
        const dGL = `${act.design.gate}.${act.design.line}`

        return (
          <g key={planet}>
            {/* Left (Design) */}
            <text x={COL.leftSymbol} y={y} textAnchor="middle"
              fontSize={10} fontFamily="serif" fill={COLOR.design} opacity={0.85}>
              {sym}
            </text>
            <text x={COL.leftGate} y={y} textAnchor="end"
              fontSize={8} fontFamily="'Cinzel', serif" fill={COLOR.design} opacity={0.9}>
              {dGL}
            </text>

            {/* Right (Personality) */}
            <text x={COL.rightGate} y={y} textAnchor="start"
              fontSize={8} fontFamily="'Cinzel', serif" fill={COLOR.personality} opacity={0.9}>
              {pGL}
            </text>
            <text x={COL.rightSymbol} y={y} textAnchor="middle"
              fontSize={10} fontFamily="serif" fill={COLOR.personality} opacity={0.85}>
              {sym}
            </text>

            {/* Subtle row tick marks at the bodygraph edges */}
            <line x1={-3}  y1={y - 3} x2={-3}  y2={y + 1} stroke={COLOR.design}      strokeWidth={0.5} opacity={0.3} />
            <line x1={421} y1={y - 3} x2={421} y2={y + 1} stroke={COLOR.personality} strokeWidth={0.5} opacity={0.3} />
          </g>
        )
      })}

      {/* ── Channel lines ── */}
      {CHANNEL_LINES.map(({ centers, path }) => {
        const [c1, c2] = centers
        const key = `${c1}-${c2}`
        const revKey = `${c2}-${c1}`
        const isActive = activeChannelCenterPairs.has(key) || activeChannelCenterPairs.has(revKey)
        const matchedChannels = getChannelsForPair(c1, c2)

        // Determine line colour: if both personality and design gates active → gold,
        // else personality → purple, else design → red, else dim
        let lineColor = COLOR.dimLine
        if (isActive && matchedChannels.length > 0) {
          const ch = matchedChannels[0]
          const g1isP = personalitySet.has(ch.gates[0])
          const g1isD = designSet.has(ch.gates[0])
          const g2isP = personalitySet.has(ch.gates[1])
          const g2isD = designSet.has(ch.gates[1])
          if ((g1isP || g2isP) && (g1isD || g2isD)) lineColor = COLOR.both
          else if (g1isP || g2isP) lineColor = COLOR.activeLineP
          else lineColor = COLOR.activeLineD
        }

        return (
          <path key={key} d={path}
            stroke={lineColor}
            strokeWidth={isActive ? 8 : 4}
            fill="none"
            strokeLinecap="round"
            opacity={isActive ? 1 : 0.25}
          />
        )
      })}

      {/* ── Gate numbers on active channels ── */}
      {CHANNEL_LINES.map(({ centers, path }) => {
        const [c1, c2] = centers
        const matched = getChannelsForPair(c1, c2)
        if (matched.length === 0) return null

        const pts = parsePathEndpoints(path)
        if (!pts) return null
        const { x1, y1, x2, y2 } = pts

        // Perpendicular offset: push labels 7px to the left of direction of travel
        const { px, py } = perp(x1, y1, x2, y2, 7)

        return matched.map((ch, ci) => {
          // When multiple channels share a path, stagger along the path
          const tA = 0.22 + ci * 0.04   // position of gate belonging to c1
          const tB = 0.78 - ci * 0.04   // position of gate belonging to c2

          // Determine which gate belongs to which center endpoint
          // ch.centers = [centerA, centerB]; gates = [gateA, gateB]
          // c1 is the "start" of the path, c2 is the "end"
          const [chC1, chC2] = ch.centers
          let gateAtStart: number, gateAtEnd: number
          if (chC1 === c1) {
            gateAtStart = ch.gates[0]
            gateAtEnd   = ch.gates[1]
          } else {
            gateAtStart = ch.gates[1]
            gateAtEnd   = ch.gates[0]
          }

          const ax = lerp(x1, x2, tA) + px
          const ay = lerp(y1, y2, tA) + py
          const bx = lerp(x1, x2, tB) + px
          const by = lerp(y1, y2, tB) + py

          return (
            <g key={`${ch.gates[0]}-${ch.gates[1]}-${ci}`}>
              {/* Gate at c1 (start) end */}
              <text x={ax} y={ay} textAnchor="middle"
                fontSize={7} fontFamily="'Cinzel', serif" fontWeight="bold"
                fill={gateColor(gateAtStart)}
                style={{ pointerEvents: 'none' }}>
                {gateAtStart}
              </text>
              {/* Gate at c2 (end) end */}
              <text x={bx} y={by} textAnchor="middle"
                fontSize={7} fontFamily="'Cinzel', serif" fontWeight="bold"
                fill={gateColor(gateAtEnd)}
                style={{ pointerEvents: 'none' }}>
                {gateAtEnd}
              </text>
            </g>
          )
        })
      })}

      {/* ── Centers (rendered last so they sit on top of channel lines) ── */}
      {(Object.keys(CENTER_POSITIONS) as Center[]).map(center =>
        renderCenter(center, definedCenters.includes(center))
      )}
    </svg>
  )
}
