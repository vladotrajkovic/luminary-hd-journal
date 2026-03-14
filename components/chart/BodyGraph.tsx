import React from 'react'
import { Center, HDChart, ALL_CHANNELS } from '../../lib/hdCalculator'

interface BodyGraphProps {
  chart: HDChart
  size?: number
}

// ── CENTER GEOMETRY ────────────────────────────────────────────────────────────
// Positions match the established layout; shapes match traditional HD conventions
const CP: Record<Center, {
  x: number; y: number; w: number; h: number
  shape: 'diamond' | 'square' | 'tri-up' | 'tri-down'
}> = {
  Head:        { x: 220, y: 22,  w: 60, h: 50, shape: 'tri-up'   },
  Ajna:        { x: 220, y: 100, w: 60, h: 50, shape: 'tri-down' },
  Throat:      { x: 220, y: 185, w: 60, h: 40, shape: 'square'   },
  G:           { x: 220, y: 265, w: 60, h: 60, shape: 'diamond'  },
  Heart:       { x: 310, y: 255, w: 50, h: 50, shape: 'diamond'  },
  Sacral:      { x: 220, y: 360, w: 60, h: 40, shape: 'square'   },
  SolarPlexus: { x: 310, y: 340, w: 50, h: 50, shape: 'diamond'  },
  Spleen:      { x: 130, y: 255, w: 50, h: 50, shape: 'diamond'  },
  Root:        { x: 220, y: 430, w: 60, h: 40, shape: 'square'   },
}

const CENTER_LABELS: Record<Center, string> = {
  Head: 'HEAD', Ajna: 'AJNA', Throat: 'THROAT', G: 'G',
  Heart: 'HEART', Sacral: 'SACRAL', SolarPlexus: 'SP', Spleen: 'SPLEEN', Root: 'ROOT',
}

// Secondary label lines for centers with long names
const CENTER_SUBLABELS: Partial<Record<Center, string>> = {
  SolarPlexus: 'SOLAR\nPLEXUS',
}

// ── CORRIDORS ──────────────────────────────────────────────────────────────────
// Each corridor is a thick pipe connecting two centers.
// labelA = label anchor near centers[0], labelB = near centers[1].
// perpSign: 1 = gate labels go to the right as you travel A→B, -1 = left.
interface Corridor {
  id: string
  centers: [Center, Center]
  path: string
  labelA: [number, number]
  labelB: [number, number]
  perpSign: 1 | -1
}

const CORRIDORS: Corridor[] = [
  // ── Vertical spine ───────────────────────────────────────────────
  {
    id: 'Head-Ajna',
    centers: ['Head', 'Ajna'],
    path: 'M250,72 L250,100',
    labelA: [250, 72], labelB: [250, 100], perpSign: 1,
  },
  {
    id: 'Ajna-Throat',
    centers: ['Ajna', 'Throat'],
    path: 'M250,150 L250,185',
    labelA: [250, 150], labelB: [250, 185], perpSign: 1,
  },
  {
    id: 'Throat-G',
    centers: ['Throat', 'G'],
    path: 'M250,225 L250,265',
    labelA: [250, 225], labelB: [250, 265], perpSign: 1,
  },
  {
    id: 'G-Sacral',
    centers: ['G', 'Sacral'],
    path: 'M250,325 L250,360',
    labelA: [250, 325], labelB: [250, 360], perpSign: 1,
  },
  {
    id: 'Sacral-Root',
    centers: ['Sacral', 'Root'],
    path: 'M250,400 L250,430',
    labelA: [250, 400], labelB: [250, 430], perpSign: 1,
  },

  // ── Right branch ─────────────────────────────────────────────────
  {
    id: 'Throat-Heart',
    centers: ['Throat', 'Heart'],
    path: 'M280,207 L312,258',
    labelA: [280, 207], labelB: [312, 258], perpSign: 1,
  },
  {
    id: 'Heart-SolarPlexus',
    centers: ['Heart', 'SolarPlexus'],
    path: 'M335,305 L335,340',
    labelA: [335, 305], labelB: [335, 340], perpSign: 1,
  },
  {
    id: 'Sacral-SolarPlexus',
    centers: ['Sacral', 'SolarPlexus'],
    path: 'M280,375 L312,360',
    labelA: [280, 375], labelB: [312, 360], perpSign: 1,
  },
  {
    id: 'SolarPlexus-Root',
    centers: ['SolarPlexus', 'Root'],
    path: 'M322,390 L282,430',
    labelA: [322, 390], labelB: [282, 430], perpSign: 1,
  },
  {
    id: 'Throat-SolarPlexus',
    centers: ['Throat', 'SolarPlexus'],
    path: 'M283,217 L315,345',
    labelA: [283, 217], labelB: [315, 345], perpSign: -1,
  },
  // Sacral→Throat (Channel of Charisma 34-20): routes right of G center
  {
    id: 'Sacral-Throat',
    centers: ['Sacral', 'Throat'],
    path: 'M287,362 L287,225',
    labelA: [287, 362], labelB: [287, 225], perpSign: 1,
  },

  // ── Left branch ──────────────────────────────────────────────────
  {
    id: 'G-Spleen',
    centers: ['G', 'Spleen'],
    path: 'M222,293 L182,280',
    labelA: [222, 293], labelB: [182, 280], perpSign: -1,
  },
  {
    id: 'Sacral-Spleen',
    centers: ['Sacral', 'Spleen'],
    path: 'M222,377 L182,308',
    labelA: [222, 377], labelB: [182, 308], perpSign: 1,
  },
  {
    id: 'Spleen-Root',
    centers: ['Spleen', 'Root'],
    path: 'M157,305 L238,430',
    labelA: [157, 305], labelB: [238, 430], perpSign: -1,
  },

  // ── Cross connections ─────────────────────────────────────────────
  {
    id: 'G-Heart',
    centers: ['G', 'Heart'],
    path: 'M282,293 L312,280',
    labelA: [282, 293], labelB: [312, 280], perpSign: 1,
  },
  // Throat→Spleen (channels 16-48 and 57-20)
  {
    id: 'Throat-Spleen',
    centers: ['Throat', 'Spleen'],
    path: 'M222,205 L180,260',
    labelA: [222, 205], labelB: [180, 260], perpSign: 1,
  },
  // Heart→Spleen (channel 26-44): arcs above G center diamond
  {
    id: 'Heart-Spleen',
    centers: ['Heart', 'Spleen'],
    path: 'M310,272 C278,242 220,242 182,272',
    labelA: [310, 272], labelB: [182, 272], perpSign: -1,
  },
]

// Build fast lookup: "C1-C2" or "C2-C1" → Corridor
const corridorByKey = new Map<string, Corridor>()
CORRIDORS.forEach(c => {
  corridorByKey.set(`${c.centers[0]}-${c.centers[1]}`, c)
  corridorByKey.set(`${c.centers[1]}-${c.centers[0]}`, c)
})

// ── GATE LABEL COLOUR ─────────────────────────────────────────────────────────
function gateColor(gate: number, pGates: number[], dGates: number[]): string {
  const inP = pGates.includes(gate)
  const inD = dGates.includes(gate)
  if (inP && inD) return '#EDE9FE'          // both: warm white
  if (inP) return '#A78BFA'                  // personality: violet
  if (inD) return '#F87171'                  // design: coral
  return 'rgba(167,139,250,0.22)'            // inactive: very dim
}

function gateFontWeight(gate: number, pGates: number[], dGates: number[]): string {
  return (pGates.includes(gate) || dGates.includes(gate)) ? '600' : '400'
}

// ── CENTER RENDERER ───────────────────────────────────────────────────────────
function renderCenter(center: Center, isDefined: boolean) {
  const pos = CP[center]
  const cx = pos.x + pos.w / 2
  const cy = pos.y + pos.h / 2

  // Unified violet for all defined centers — traditional HD style
  const fill    = isDefined ? 'rgba(76,29,149,0.92)' : 'rgba(22,14,60,0.55)'
  const stroke  = isDefined ? '#A78BFA'               : 'rgba(167,139,250,0.32)'
  const strokeW = isDefined ? 1.5                     : 1
  const labelFill = isDefined ? '#EDE9FE' : 'rgba(167,139,250,0.38)'

  let shape: React.ReactElement

  if (pos.shape === 'diamond') {
    const hw = pos.w / 2
    const hh = pos.h / 2
    shape = (
      <polygon
        points={`${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`}
        fill={fill} stroke={stroke} strokeWidth={strokeW}
      />
    )
  } else if (pos.shape === 'tri-up') {
    shape = (
      <polygon
        points={`${cx},${pos.y} ${pos.x + pos.w},${pos.y + pos.h} ${pos.x},${pos.y + pos.h}`}
        fill={fill} stroke={stroke} strokeWidth={strokeW}
      />
    )
  } else if (pos.shape === 'tri-down') {
    shape = (
      <polygon
        points={`${pos.x},${pos.y} ${pos.x + pos.w},${pos.y} ${cx},${pos.y + pos.h}`}
        fill={fill} stroke={stroke} strokeWidth={strokeW}
      />
    )
  } else {
    // square
    shape = (
      <rect
        x={pos.x} y={pos.y} width={pos.w} height={pos.h}
        rx={3} fill={fill} stroke={stroke} strokeWidth={strokeW}
      />
    )
  }

  // Two-line label for SolarPlexus
  if (center === 'SolarPlexus') {
    return (
      <g key={center}>
        {shape}
        <text x={cx} y={cy - 3} textAnchor="middle"
          fontSize={6} fontFamily="'Cinzel', serif" fontWeight="500"
          letterSpacing={0.4} fill={labelFill} style={{ pointerEvents: 'none' }}>
          SOLAR
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle"
          fontSize={6} fontFamily="'Cinzel', serif" fontWeight="500"
          letterSpacing={0.4} fill={labelFill} style={{ pointerEvents: 'none' }}>
          PLEXUS
        </text>
      </g>
    )
  }

  const fontSize =
    center === 'G'      ? 10 :
    center === 'Throat' ? 6.5 :
    center === 'Sacral' ? 6.5 :
    center === 'Root'   ? 6.5 : 7.5

  return (
    <g key={center}>
      {shape}
      <text
        x={cx} y={cy + fontSize / 3}
        textAnchor="middle"
        fontSize={fontSize}
        fontFamily="'Cinzel', serif"
        fontWeight="500"
        letterSpacing={0.5}
        fill={labelFill}
        style={{ pointerEvents: 'none' }}
      >
        {CENTER_LABELS[center]}
      </text>
    </g>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function BodyGraph({ chart, size = 500 }: BodyGraphProps) {
  const { definedCenters, allPersonalityGates, allDesignGates, activeChannels } = chart

  // Which corridors have at least one fully activated channel
  const activeCorridorIds = new Set<string>()
  activeChannels.forEach(ch => {
    const corr = corridorByKey.get(`${ch.centers[0]}-${ch.centers[1]}`)
    if (corr) activeCorridorIds.add(corr.id)
  })

  // Precompute per-corridor gate label sets (sorted for consistent layout)
  // Each entry: { gate0: near centers[0], gate1: near centers[1] }
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
    // Sort by gate0 for a consistent visual order
    entries.sort((a, b) => a.gate0 - b.gate0)
    corridorGateData.set(corr.id, entries)
  })

  return (
    <svg
      viewBox="70 -12 360 514"
      width={size}
      height={size}
      style={{ maxWidth: '100%', display: 'block' }}
    >
      <defs>
        {/* Subtle gradient for silhouette fill */}
        <radialGradient id="bgGrad" cx="50%" cy="42%" r="58%">
          <stop offset="0%"   stopColor="rgba(109,40,217,0.07)" />
          <stop offset="70%"  stopColor="rgba(88,28,135,0.04)" />
          <stop offset="100%" stopColor="rgba(46,16,101,0.01)" />
        </radialGradient>
        {/* Active corridor glow */}
        <filter id="corridorGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Human Silhouette (behind everything) ─────────────────── */}
      {/* Head */}
      <ellipse
        cx="250" cy="10" rx="30" ry="25"
        fill="url(#bgGrad)"
        stroke="rgba(139,92,246,0.1)"
        strokeWidth={0.8}
      />
      {/* Body torso */}
      <path
        d={`
          M 272,30
          C 296,46 342,88 360,138
          C 373,175 373,208 366,232
          C 376,260 377,283 368,305
          C 376,330 373,355 363,377
          C 369,402 367,426 358,450
          L 348,468
          L 152,468
          L 142,450
          C 133,426 131,402 137,377
          C 127,355 124,330 132,305
          C 123,283 124,260 134,232
          C 127,208 127,175 140,138
          C 158,88 204,46 228,30
          C 237,18 244,4 250,2
          C 256,4 263,18 272,30 Z
        `}
        fill="url(#bgGrad)"
        stroke="rgba(139,92,246,0.08)"
        strokeWidth={0.8}
      />

      {/* ── Inactive corridors (rendered first, behind active) ───── */}
      {CORRIDORS.map(corr => {
        if (activeCorridorIds.has(corr.id)) return null
        return (
          <path
            key={`inactive-${corr.id}`}
            d={corr.path}
            stroke="rgba(139,92,246,0.13)"
            strokeWidth={13}
            strokeLinecap="round"
            fill="none"
          />
        )
      })}
      {/* Inactive inner fill (slightly lighter to create pipe depth) */}
      {CORRIDORS.map(corr => {
        if (activeCorridorIds.has(corr.id)) return null
        return (
          <path
            key={`inactive-inner-${corr.id}`}
            d={corr.path}
            stroke="rgba(22,14,60,0.6)"
            strokeWidth={9}
            strokeLinecap="round"
            fill="none"
          />
        )
      })}

      {/* ── Active corridors (full violet fill) ──────────────────── */}
      {CORRIDORS.map(corr => {
        if (!activeCorridorIds.has(corr.id)) return null
        return (
          <g key={`active-${corr.id}`}>
            {/* Outer glow */}
            <path
              d={corr.path}
              stroke="rgba(167,139,250,0.25)"
              strokeWidth={18}
              strokeLinecap="round"
              fill="none"
            />
            {/* Main corridor fill */}
            <path
              d={corr.path}
              stroke="rgba(109,40,217,0.82)"
              strokeWidth={13}
              strokeLinecap="round"
              fill="none"
            />
            {/* Inner highlight */}
            <path
              d={corr.path}
              stroke="rgba(167,139,250,0.35)"
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )
      })}

      {/* ── Gate number labels ────────────────────────────────────── */}
      {CORRIDORS.map(corr => {
        const chans = corridorGateData.get(corr.id) || []
        if (chans.length === 0) return null

        const [ax, ay] = corr.labelA
        const [bx, by] = corr.labelB
        const dx = bx - ax
        const dy = by - ay
        const len = Math.sqrt(dx * dx + dy * dy) || 1

        // Unit vector along corridor A→B
        const ux = dx / len
        const uy = dy / len

        // Unit perpendicular (right of A→B when perpSign=1)
        const px = (dy / len) * corr.perpSign
        const py = (-dx / len) * corr.perpSign

        // How far labels sit from corridor center line
        const base = 19
        const spread = 10

        return chans.map((chan, i) => {
          const offset = base + (i - (chans.length - 1) / 2) * spread

          // Inset along corridor direction so labels don't touch center shapes
          const inset = 12

          const g0x = ax + ux * inset + px * offset
          const g0y = ay + uy * inset + py * offset
          const g1x = bx - ux * inset + px * offset
          const g1y = by - uy * inset + py * offset

          const c0  = gateColor(chan.gate0, allPersonalityGates, allDesignGates)
          const c1  = gateColor(chan.gate1, allPersonalityGates, allDesignGates)
          const fw0 = gateFontWeight(chan.gate0, allPersonalityGates, allDesignGates)
          const fw1 = gateFontWeight(chan.gate1, allPersonalityGates, allDesignGates)

          return (
            <g key={`${corr.id}-${chan.gate0}-${chan.gate1}`}>
              <text
                x={g0x} y={g0y + 3}
                textAnchor="middle"
                fontSize={7}
                fontFamily="'Inter', sans-serif"
                fontWeight={fw0}
                fill={c0}
                style={{ pointerEvents: 'none' }}
              >
                {chan.gate0}
              </text>
              <text
                x={g1x} y={g1y + 3}
                textAnchor="middle"
                fontSize={7}
                fontFamily="'Inter', sans-serif"
                fontWeight={fw1}
                fill={c1}
                style={{ pointerEvents: 'none' }}
              >
                {chan.gate1}
              </text>
            </g>
          )
        })
      })}

      {/* ── Centers (rendered on top of everything) ──────────────── */}
      {(Object.keys(CP) as Center[]).map(center =>
        renderCenter(center, definedCenters.includes(center))
      )}
    </svg>
  )
}
