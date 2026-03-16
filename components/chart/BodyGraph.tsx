import React, { useState } from 'react'
import { Center, HDChart, ALL_CHANNELS } from '../../lib/hdCalculator'

interface BodyGraphProps {
  chart: HDChart
  size?: number
}

// ── CENTER GEOMETRY ────────────────────────────────────────────────────────────
const CP: Record<Center, {
  x: number; y: number; w: number; h: number
  shape: 'diamond' | 'square' | 'tri-up' | 'tri-down' | 'half-top' | 'half-left' | 'half-right'
}> = {
  Head:        { x: 214, y: -72, w: 72,  h: 65,  shape: 'tri-up'    },
  Ajna:        { x: 209, y: 4,   w: 82,  h: 68,  shape: 'tri-down'  },
  Throat:      { x: 216, y: 80,  w: 68,  h: 68,  shape: 'square'    },
  G:           { x: 201, y: 157, w: 98,  h: 98,  shape: 'diamond'   },
  Heart:       { x: 330, y: 203, w: 104, h: 86,  shape: 'half-top'  },
  Sacral:      { x: 216, y: 382, w: 68,  h: 68,  shape: 'square'    },
  SolarPlexus: { x: 343, y: 360, w: 99,  h: 88,  shape: 'half-left' },
  Spleen:      { x: 59,  y: 360, w: 99,  h: 88,  shape: 'half-right'},
  Root:        { x: 207, y: 474, w: 86,  h: 55,  shape: 'square'    },
}

const CENTER_LABELS: Record<Center, string> = {
  Head: 'HEAD', Ajna: 'AJNA', Throat: 'THROAT', G: 'G',
  Heart: 'HEART', Sacral: 'SACRAL', SolarPlexus: 'SP', Spleen: 'SPLEEN', Root: 'ROOT',
}

// ── GATE → CENTER MAP (fixed HD knowledge) ────────────────────────────────────
const CENTER_GATES: Record<Center, number[]> = {
  Head:        [64, 61, 63],
  Ajna:        [47, 24, 4, 17, 43, 11],
  Throat:      [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  G:           [1, 13, 25, 46, 2, 15, 10, 7],
  Heart:       [21, 40, 26, 51],
  Sacral:      [5, 14, 29, 59, 9, 3, 42, 27, 34],
  SolarPlexus: [36, 22, 37, 6, 49, 55, 30],
  Spleen:      [48, 57, 44, 50, 32, 28, 18],
  Root:        [53, 60, 52, 19, 39, 41, 58, 38, 54],
}

const LEFT_CENTERS:  Center[] = ['Head', 'Ajna', 'Throat', 'G', 'Spleen']
const RIGHT_CENTERS: Center[] = ['Heart', 'SolarPlexus', 'Sacral', 'Root']

// ── CORRIDORS ──────────────────────────────────────────────────────────────────
interface Corridor {
  id: string
  centers: [Center, Center]
  path: string
  labelA: [number, number]
  labelB: [number, number]
  perpSign: 1 | -1
}

const CORRIDORS: Corridor[] = [
  { id: 'Head-Ajna',          centers: ['Head', 'Ajna'],          path: 'M250,-7 L250,4',     labelA: [250,-7],  labelB: [250,4],   perpSign: 1  },
  { id: 'Ajna-Throat',        centers: ['Ajna', 'Throat'],        path: 'M250,72 L250,80',    labelA: [250,72],  labelB: [250,80],  perpSign: 1  },
  { id: 'Throat-G',           centers: ['Throat', 'G'],           path: 'M250,148 L250,157',  labelA: [250,148], labelB: [250,157], perpSign: 1  },
  { id: 'G-Sacral',           centers: ['G', 'Sacral'],           path: 'M250,255 L250,382',  labelA: [250,255], labelB: [250,382], perpSign: 1  },
  { id: 'Sacral-Root',        centers: ['Sacral', 'Root'],        path: 'M250,450 L250,474',  labelA: [250,450], labelB: [250,474], perpSign: 1  },
  { id: 'Throat-Heart',       centers: ['Throat', 'Heart'],       path: 'M284,114 L382,203',  labelA: [284,114], labelB: [382,203], perpSign: 1  },
  { id: 'Heart-SolarPlexus',  centers: ['Heart', 'SolarPlexus'],  path: 'M434,289 L442,360',  labelA: [434,289], labelB: [442,360], perpSign: 1  },
  { id: 'Sacral-SolarPlexus', centers: ['Sacral', 'SolarPlexus'], path: 'M284,416 L343,404',  labelA: [284,416], labelB: [343,404], perpSign: 1  },
  { id: 'SolarPlexus-Root',   centers: ['SolarPlexus', 'Root'],   path: 'M442,448 L293,501',  labelA: [442,448], labelB: [293,501], perpSign: 1  },
  { id: 'Throat-SolarPlexus', centers: ['Throat', 'SolarPlexus'], path: 'M284,148 L442,360',  labelA: [284,148], labelB: [442,360], perpSign: -1 },
  { id: 'Sacral-Throat',      centers: ['Sacral', 'Throat'],      path: 'M284,382 L284,148',  labelA: [284,382], labelB: [284,148], perpSign: 1  },
  { id: 'G-Spleen',           centers: ['G', 'Spleen'],           path: 'M201,206 L158,404',  labelA: [201,206], labelB: [158,404], perpSign: -1 },
  { id: 'Sacral-Spleen',      centers: ['Sacral', 'Spleen'],      path: 'M216,416 L158,404',  labelA: [216,416], labelB: [158,404], perpSign: 1  },
  { id: 'Spleen-Root',        centers: ['Spleen', 'Root'],        path: 'M59,448 L207,501',   labelA: [59,448],  labelB: [207,501], perpSign: -1 },
  { id: 'Throat-Spleen',      centers: ['Throat', 'Spleen'],      path: 'M216,114 L59,360',   labelA: [216,114], labelB: [59,360],  perpSign: 1  },
  { id: 'G-Heart',            centers: ['G', 'Heart'],            path: 'M299,206 L330,289',                    labelA: [299,206], labelB: [330,289], perpSign: 1  },
  { id: 'Heart-Spleen',       centers: ['Heart', 'Spleen'],       path: 'M330,289 C280,330 210,375 158,404',    labelA: [330,289], labelB: [158,404], perpSign: -1 },
]

const corridorByKey = new Map<string, Corridor>()
CORRIDORS.forEach(c => {
  corridorByKey.set(`${c.centers[0]}-${c.centers[1]}`, c)
  corridorByKey.set(`${c.centers[1]}-${c.centers[0]}`, c)
})

// ── GATE COLOUR HELPERS ───────────────────────────────────────────────────────
function gateColor(gate: number, pGates: number[], dGates: number[]): string {
  const inP = pGates.includes(gate)
  const inD = dGates.includes(gate)
  if (inP && inD) return '#EDE9FE'
  if (inP)        return '#A78BFA'
  if (inD)        return '#F87171'
  return 'rgba(167,139,250,0.22)'
}
function gateFontWeight(gate: number, pGates: number[], dGates: number[]): string {
  return (pGates.includes(gate) || dGates.includes(gate)) ? '700' : '400'
}
function isActive(gate: number, pGates: number[], dGates: number[]): boolean {
  return pGates.includes(gate) || dGates.includes(gate)
}

// ── CENTER RENDERER ───────────────────────────────────────────────────────────
function renderCenter(
  center: Center,
  isDefined: boolean,
  onEnter: () => void,
  onLeave: () => void,
  isHovered: boolean
) {
  const pos = CP[center]
  const cx  = pos.x + pos.w / 2
  const cy  = pos.y + pos.h / 2

  const fill      = isDefined
    ? (isHovered ? 'rgba(109,40,217,0.98)' : 'rgba(76,29,149,0.92)')
    : (isHovered ? 'rgba(45,27,105,0.75)'  : 'rgba(22,14,60,0.55)')
  const stroke    = isHovered ? '#C4B5FD' : (isDefined ? '#A78BFA' : 'rgba(167,139,250,0.32)')
  const strokeW   = isHovered ? 2 : (isDefined ? 1.5 : 1)
  const labelFill = isDefined ? '#EDE9FE' : 'rgba(167,139,250,0.45)'

  const handlers = { onMouseEnter: onEnter, onMouseLeave: onLeave, style: { cursor: 'pointer' as const } }

  let shape: React.ReactNode
  let textX = cx
  let textY = cy

  switch (pos.shape) {
    case 'tri-up': {
      const pts = `${cx},${pos.y} ${pos.x},${pos.y+pos.h} ${pos.x+pos.w},${pos.y+pos.h}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} {...handlers} />
      textY = pos.y + pos.h * 2 / 3; break
    }
    case 'tri-down': {
      const pts = `${pos.x},${pos.y} ${pos.x+pos.w},${pos.y} ${cx},${pos.y+pos.h}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} {...handlers} />
      textY = pos.y + pos.h / 3; break
    }
    case 'square': {
      shape = <rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={3} fill={fill} stroke={stroke} strokeWidth={strokeW} {...handlers} />
      break
    }
    case 'diamond': {
      const pts = `${cx},${pos.y} ${pos.x+pos.w},${cy} ${cx},${pos.y+pos.h} ${pos.x},${cy}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} {...handlers} />
      break
    }
    case 'half-top': {
      const pts = `${cx},${pos.y} ${pos.x},${pos.y+pos.h} ${pos.x+pos.w},${pos.y+pos.h}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} {...handlers} />
      textX = cx; textY = pos.y + pos.h * 2 / 3; break
    }
    case 'half-left': {
      const pts = `${pos.x},${cy} ${pos.x+pos.w},${pos.y} ${pos.x+pos.w},${pos.y+pos.h}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} {...handlers} />
      textX = pos.x + pos.w * 2 / 3; textY = cy; break
    }
    case 'half-right': {
      const pts = `${pos.x+pos.w},${cy} ${pos.x},${pos.y} ${pos.x},${pos.y+pos.h}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} {...handlers} />
      textX = pos.x + pos.w / 3; textY = cy; break
    }
  }

  const fontSize =
    center === 'G'      ? 13  :
    center === 'Head'   ? 9   :
    center === 'Throat' ? 9   :
    center === 'Sacral' ? 9   :
    center === 'Root'   ? 9   :
    center === 'Ajna'   ? 9   : 8.5

  return (
    <g key={center}>
      {shape}
      {/* Invisible hit-area padding for easier hover */}
      <rect x={pos.x-6} y={pos.y-6} width={pos.w+12} height={pos.h+12}
        fill="transparent" {...handlers} />
      <text x={textX} y={textY + fontSize/3}
        textAnchor="middle" fontSize={fontSize}
        fontFamily="'Cinzel', serif" fontWeight="500" letterSpacing={0.5}
        fill={labelFill} style={{ pointerEvents: 'none' }}>
        {CENTER_LABELS[center]}
      </text>
    </g>
  )
}

// ── SIDE COLUMN RENDERER ──────────────────────────────────────────────────────
function renderSideColumn(
  centers: Center[],
  startX: number,
  colWidth: number,
  align: 'left' | 'right',
  pGates: number[],
  dGates: number[],
  onHover: (c: Center | null) => void,
  hoveredCenter: Center | null
) {
  const GATE_R   = 12
  const GATE_COLS = 4
  const COL_GAP  = 32
  const ROW_GAP  = 28
  const BLOCK_GAP = 48

  let y = -72

  return centers.map(center => {
    const gates  = CENTER_GATES[center]
    const rows   = Math.ceil(gates.length / GATE_COLS)
    const isHov  = hoveredCenter === center
    const blockH = 28 + rows * ROW_GAP + 6

    const el = (
      <g key={center}
        onMouseEnter={() => onHover(center)}
        onMouseLeave={() => onHover(null)}
        style={{ cursor: 'pointer' }}>

        {isHov && (
          <rect x={startX - 8} y={y - 4} width={colWidth + 16} height={blockH + 8}
            rx={6} fill="rgba(123,79,212,0.18)" stroke="rgba(167,139,250,0.25)" strokeWidth={1} />
        )}

        <text
          x={align === 'left' ? startX : startX + colWidth}
          y={y + 10}
          textAnchor={align === 'left' ? 'start' : 'end'}
          fontSize={14} fontFamily="'Cinzel', serif" fontWeight="500"
          letterSpacing={0.8}
          fill={isHov ? '#C4B5FD' : 'rgba(167,139,250,0.55)'}>
          {CENTER_LABELS[center]}
        </text>

        {gates.map((gate, i) => {
          const col    = i % GATE_COLS
          const row    = Math.floor(i / GATE_COLS)
          const active = isActive(gate, pGates, dGates)
          const color  = gateColor(gate, pGates, dGates)
          const fw     = gateFontWeight(gate, pGates, dGates)

          const gx = align === 'left'
            ? startX + GATE_R + col * COL_GAP
            : startX + colWidth - GATE_R - (GATE_COLS - 1 - col) * COL_GAP
          const gy = y + 30 + row * ROW_GAP

          return (
            <g key={gate}>
              {active && (
                <circle cx={gx} cy={gy} r={GATE_R} fill="none" stroke={color} strokeWidth={1.5} />
              )}
              <text x={gx} y={gy + 3.5} textAnchor="middle"
                fontSize={13} fontFamily="'Inter', sans-serif"
                fontWeight={fw} fill={color}>
                {gate}
              </text>
            </g>
          )
        })}
      </g>
    )

    y += blockH + BLOCK_GAP
    return el
  })
}

// ── HOVER TOOLTIP ─────────────────────────────────────────────────────────────
function renderTooltip(center: Center, pGates: number[], dGates: number[]) {
  const pos   = CP[center]
  const cx    = pos.x + pos.w / 2
  const cy    = pos.y + pos.h / 2
  const gates = CENTER_GATES[center]
  const cols  = 4
  const rows  = Math.ceil(gates.length / cols)
  const tw    = 136
  const th    = 32 + rows * 20 + 8
  const GR    = 7.5

  let tx = cx + pos.w / 2 + 14
  if (tx + tw > 490) tx = cx - pos.w / 2 - tw - 14
  const ty = cy - th / 2

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={tx+2} y={ty+2} width={tw} height={th} rx={8} fill="rgba(0,0,0,0.35)" />
      <rect x={tx} y={ty} width={tw} height={th} rx={8}
        fill="rgba(12,6,36,0.97)" stroke="rgba(167,139,250,0.4)" strokeWidth={1} />
      <text x={tx+tw/2} y={ty+15} textAnchor="middle"
        fontSize={9} fontFamily="'Cinzel', serif" fontWeight="500"
        letterSpacing={0.8} fill="#C4B5FD">
        {CENTER_LABELS[center]}
      </text>
      <line x1={tx+10} y1={ty+21} x2={tx+tw-10} y2={ty+21}
        stroke="rgba(167,139,250,0.2)" strokeWidth={0.8} />
      {gates.map((gate, i) => {
        const col    = i % cols
        const row    = Math.floor(i / cols)
        const active = isActive(gate, pGates, dGates)
        const color  = gateColor(gate, pGates, dGates)
        const fw     = gateFontWeight(gate, pGates, dGates)
        const gx     = tx + 16 + col * 30
        const gy     = ty + 32 + row * 20
        return (
          <g key={gate}>
            {active && (
              <circle cx={gx} cy={gy} r={GR} fill="none" stroke={color} strokeWidth={1.5} />
            )}
            <text x={gx} y={gy+3.5} textAnchor="middle"
              fontSize={7.5} fontFamily="'Inter', sans-serif"
              fontWeight={fw} fill={color}>
              {gate}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function BodyGraph({ chart }: BodyGraphProps) {
  const { definedCenters, allPersonalityGates, allDesignGates, activeChannels } = chart
  const [hoveredCenter, setHoveredCenter] = useState<Center | null>(null)

  const activeCorridorIds = new Set<string>()
  activeChannels.forEach(ch => {
    const corr = corridorByKey.get(`${ch.centers[0]}-${ch.centers[1]}`)
    if (corr) activeCorridorIds.add(corr.id)
  })

  const corridorGateData = new Map<string, Array<{ gate0: number; gate1: number }>>()
  CORRIDORS.forEach(corr => {
    const entries: Array<{ gate0: number; gate1: number }> = []
    ALL_CHANNELS.forEach(ch => {
      const forward  = ch.centers[0] === corr.centers[0] && ch.centers[1] === corr.centers[1]
      const reversed = ch.centers[1] === corr.centers[0] && ch.centers[0] === corr.centers[1]
      if (forward || reversed) {
        entries.push({
          gate0: reversed ? ch.gates[1] : ch.gates[0],
          gate1: reversed ? ch.gates[0] : ch.gates[1],
        })
      }
    })
    entries.sort((a, b) => a.gate0 - b.gate0)
    corridorGateData.set(corr.id, entries)
  })

  return (
    <svg
      viewBox="-220 -110 1100 820"
      width="100%"
      height={600}
      style={{ maxWidth: '100%', display: 'block' }}
    >
      <defs>
        <filter id="corridorGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Left gate column ─────────────────────────────────────── */}
      {renderSideColumn(LEFT_CENTERS, -195, 140, 'left',
        allPersonalityGates, allDesignGates, setHoveredCenter, hoveredCenter)}

      {/* ── Right gate column ────────────────────────────────────── */}
      {renderSideColumn(RIGHT_CENTERS, 715, 140, 'right',
        allPersonalityGates, allDesignGates, setHoveredCenter, hoveredCenter)}

      {/* ── Body graph group — translated right to center between columns ── */}
      <g transform="translate(80, 0)">

      {/* ── Human Silhouette ─────────────────────────────────────── */}
      <path
        d={`
          M 252,-60
          C 232,-60 210,-46 200,-28
          C 192,-14 192,2   198,14
          C 202,22  206,26  204,32
          C 201,38  198,44  202,52
          C 206,60  210,66  206,76
          C 202,86  200,96  196,108
          C 180,128 152,152 118,180
          C 84,208  60,244  52,282
          C 44,318  44,358  46,396
          C 48,430  50,462  52,494
          C 54,514  56,528  58,540
          L 442,540
          C 444,528 446,514 448,494
          C 450,462 452,430 454,396
          C 456,358 456,318 448,282
          C 440,244 416,208 382,180
          C 348,152 320,128 304,108
          C 300,96  298,86  294,76
          C 290,66  294,60  298,52
          C 302,44  300,38  296,32
          C 294,26  298,22  302,14
          C 308,2   308,-14 300,-28
          C 290,-46 268,-60 252,-60 Z
        `}
        fill="rgba(167,139,250,0.04)"
        stroke="rgba(167,139,250,0.28)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* ── Inactive corridors ───────────────────────────────────── */}
      {CORRIDORS.map(corr => activeCorridorIds.has(corr.id) ? null : (
        <path key={`io-${corr.id}`} d={corr.path} stroke="rgba(139,92,246,0.18)" strokeWidth={16} strokeLinecap="round" fill="none" />
      ))}
      {CORRIDORS.map(corr => activeCorridorIds.has(corr.id) ? null : (
        <path key={`ii-${corr.id}`} d={corr.path} stroke="rgba(22,14,60,0.65)"   strokeWidth={11} strokeLinecap="round" fill="none" />
      ))}

      {/* ── Active corridors ─────────────────────────────────────── */}
      {CORRIDORS.map(corr => !activeCorridorIds.has(corr.id) ? null : (
        <g key={`active-${corr.id}`}>
          <path d={corr.path} stroke="rgba(167,139,250,0.30)" strokeWidth={22} strokeLinecap="round" fill="none" />
          <path d={corr.path} stroke="rgba(109,40,217,0.88)"  strokeWidth={16} strokeLinecap="round" fill="none" />
          <path d={corr.path} stroke="rgba(167,139,250,0.40)" strokeWidth={6}  strokeLinecap="round" fill="none" />
        </g>
      ))}

      {/* ── Centers ──────────────────────────────────────────────── */}
      {(Object.keys(CP) as Center[]).map(center =>
        renderCenter(
          center,
          definedCenters.includes(center),
          () => setHoveredCenter(center),
          () => setHoveredCenter(null),
          hoveredCenter === center
        )
      )}

      {/* ── Hover tooltip (on top of everything) ─────────────────── */}
      {hoveredCenter && renderTooltip(hoveredCenter, allPersonalityGates, allDesignGates)}

      </g>{/* end body graph group */}

      {/* ── Legend ───────────────────────────────────────────────── */}
      <g>
        <circle cx={-20} cy={630} r={9} fill="none" stroke="#A78BFA" strokeWidth={1.8} />
        <text x={-6} y={635} fontSize={13} fontFamily="'Inter', sans-serif" fill="rgba(167,139,250,0.65)">Personality gate</text>

        <circle cx={160} cy={630} r={9} fill="none" stroke="#F87171" strokeWidth={1.8} />
        <text x={174} y={635} fontSize={13} fontFamily="'Inter', sans-serif" fill="rgba(167,139,250,0.65)">Design gate</text>

        <circle cx={310} cy={630} r={9} fill="none" stroke="#EDE9FE" strokeWidth={1.8} />
        <text x={324} y={635} fontSize={13} fontFamily="'Inter', sans-serif" fill="rgba(167,139,250,0.65)">Both activated</text>

        <text x={470} y={635} fontSize={12} fontFamily="'Inter', sans-serif" fill="rgba(167,139,250,0.35)">Dim = inactive gate</text>
      </g>
    </svg>
  )
}
