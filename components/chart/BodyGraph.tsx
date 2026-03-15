import React from 'react'
import { Center, HDChart, ALL_CHANNELS } from '../../lib/hdCalculator'

interface BodyGraphProps {
  chart: HDChart
  size?: number
}

// ── CENTER GEOMETRY ────────────────────────────────────────────────────────────
// Positions match JA layout:
//   - Spleen: lower-left, level with SolarPlexus and Sacral (not level with G/Heart)
//   - Heart:  upper-right, slightly above G center
//   - G:      slightly larger diamond as the central anchor
const CP: Record<Center, {
  x: number; y: number; w: number; h: number
  shape: 'diamond' | 'square' | 'tri-up' | 'tri-down'
}> = {
  Head:        { x: 222, y: 22,  w: 56, h: 50, shape: 'tri-up'   },
  Ajna:        { x: 218, y: 100, w: 64, h: 52, shape: 'tri-down' },
  Throat:      { x: 218, y: 182, w: 64, h: 40, shape: 'square'   },
  G:           { x: 215, y: 262, w: 70, h: 70, shape: 'diamond'  },
  Heart:       { x: 308, y: 248, w: 56, h: 56, shape: 'diamond'  },
  Sacral:      { x: 218, y: 358, w: 64, h: 40, shape: 'square'   },
  SolarPlexus: { x: 308, y: 338, w: 56, h: 56, shape: 'diamond'  },
  Spleen:      { x: 126, y: 338, w: 56, h: 56, shape: 'diamond'  },
  Root:        { x: 218, y: 432, w: 64, h: 40, shape: 'square'   },
}
// Center edge reference (cx, cy, edge points):
//   Head:        cx=250 cy=47   tri-up:  tip=(250,22)  base-bottom=(250,72)
//   Ajna:        cx=250 cy=126  tri-down: base-top=(250,100) tip=(250,152)
//   Throat:      cx=250 cy=202  top=182 bottom=222 left=218 right=282
//   G:           cx=250 cy=297  top=(250,262) bot=(250,332) left=(215,297) right=(285,297) half=35
//   Heart:       cx=336 cy=276  top=(336,248) bot=(336,304) left=(308,276) right=(364,276) half=28
//   Sacral:      cx=250 cy=378  top=358 bottom=398 left=218 right=282
//   SolarPlexus: cx=336 cy=366  top=(336,338) bot=(336,394) left=(308,366) right=(364,366) half=28
//   Spleen:      cx=154 cy=366  top=(154,338) bot=(154,394) left=(126,366) right=(182,366) half=28
//   Root:        cx=250 cy=452  top=432 bottom=472 left=218 right=282

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
// labelA = gate-label anchor near centers[0], labelB = near centers[1].
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
    path: 'M250,152 L250,182',
    labelA: [250, 152], labelB: [250, 182], perpSign: 1,
  },
  {
    id: 'Throat-G',
    centers: ['Throat', 'G'],
    path: 'M250,222 L250,262',
    labelA: [250, 222], labelB: [250, 262], perpSign: 1,
  },
  {
    id: 'G-Sacral',
    centers: ['G', 'Sacral'],
    path: 'M250,332 L250,358',
    labelA: [250, 332], labelB: [250, 358], perpSign: 1,
  },
  {
    id: 'Sacral-Root',
    centers: ['Sacral', 'Root'],
    path: 'M250,398 L250,432',
    labelA: [250, 398], labelB: [250, 432], perpSign: 1,
  },

  // ── Right branch ─────────────────────────────────────────────────
  {
    id: 'Throat-Heart',
    centers: ['Throat', 'Heart'],
    path: 'M282,206 L308,270',
    labelA: [282, 206], labelB: [308, 270], perpSign: 1,
  },
  {
    id: 'Heart-SolarPlexus',
    centers: ['Heart', 'SolarPlexus'],
    path: 'M336,304 L336,338',
    labelA: [336, 304], labelB: [336, 338], perpSign: 1,
  },
  {
    id: 'Sacral-SolarPlexus',
    centers: ['Sacral', 'SolarPlexus'],
    path: 'M282,376 L308,366',
    labelA: [282, 376], labelB: [308, 366], perpSign: 1,
  },
  {
    id: 'SolarPlexus-Root',
    centers: ['SolarPlexus', 'Root'],
    path: 'M328,392 L282,442',
    labelA: [328, 392], labelB: [282, 442], perpSign: 1,
  },
  {
    id: 'Throat-SolarPlexus',
    centers: ['Throat', 'SolarPlexus'],
    path: 'M284,215 L316,340',
    labelA: [284, 215], labelB: [316, 340], perpSign: -1,
  },
  // Sacral→Throat (Channel 34-20 Charisma): routes right of G center
  {
    id: 'Sacral-Throat',
    centers: ['Sacral', 'Throat'],
    path: 'M287,358 L287,222',
    labelA: [287, 358], labelB: [287, 222], perpSign: 1,
  },

  // ── Left branch (Spleen now lower-left, level with SolarPlexus) ──
  {
    id: 'G-Spleen',
    centers: ['G', 'Spleen'],
    path: 'M215,297 L182,360',
    labelA: [215, 297], labelB: [182, 360], perpSign: -1,
  },
  {
    id: 'Sacral-Spleen',
    centers: ['Sacral', 'Spleen'],
    path: 'M218,376 L182,366',
    labelA: [218, 376], labelB: [182, 366], perpSign: 1,
  },
  {
    id: 'Spleen-Root',
    centers: ['Spleen', 'Root'],
    path: 'M158,394 L228,440',
    labelA: [158, 394], labelB: [228, 440], perpSign: -1,
  },
  // Throat→Spleen (channels 16-48 and 57-20)
  {
    id: 'Throat-Spleen',
    centers: ['Throat', 'Spleen'],
    path: 'M218,206 L158,340',
    labelA: [218, 206], labelB: [158, 340], perpSign: 1,
  },

  // ── Cross connections ─────────────────────────────────────────────
  {
    id: 'G-Heart',
    centers: ['G', 'Heart'],
    path: 'M285,294 L308,270',
    labelA: [285, 294], labelB: [308, 270], perpSign: 1,
  },
  // Heart→Spleen (channel 26-44): wide arc bridging right→left across the graph
  {
    id: 'Heart-Spleen',
    centers: ['Heart', 'Spleen'],
    path: 'M308,272 C275,244 208,268 182,360',
    labelA: [308, 272], labelB: [182, 360], perpSign: -1,
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

  const fill    = isDefined ? 'rgba(76,29,149,0.92)' : 'rgba(22,14,60,0.55)'
  const stroke  = isDefined ? '#A78BFA'               : 'rgba(167,139,250,0.32)'
  const strokeW = isDefined ? 1.5                     : 1
  const labelFill = isDefined ? '#EDE9FE' : 'rgba(167,139,250,0.45)'

  let shape: React.ReactNode

  if (pos.shape === 'tri-up') {
    const pts = `${cx},${pos.y} ${pos.x},${pos.y + pos.h} ${pos.x + pos.w},${pos.y + pos.h}`
    shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} />
  } else if (pos.shape === 'tri-down') {
    const pts = `${pos.x},${pos.y} ${pos.x + pos.w},${pos.y} ${cx},${pos.y + pos.h}`
    shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} />
  } else if (pos.shape === 'square') {
    shape = (
      <rect
        x={pos.x} y={pos.y} width={pos.w} height={pos.h}
        rx={3} fill={fill} stroke={stroke} strokeWidth={strokeW}
      />
    )
  } else {
    // diamond
    const hw = pos.w / 2
    const hh = pos.h / 2
    const pts = `${cx},${pos.y} ${pos.x + pos.w},${cy} ${cx},${pos.y + pos.h} ${pos.x},${cy}`
    shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} />
  }

  const fontSize =
    center === 'Head'   ? 7   :
    center === 'G'      ? 10  :
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

  // Precompute per-corridor gate label sets (sorted for consistent visual order)
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
      viewBox="70 -12 360 514"
      width={size}
      height={size}
      style={{ maxWidth: '100%', display: 'block' }}
    >
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="42%" r="58%">
          <stop offset="0%"   stopColor="rgba(109,40,217,0.07)" />
          <stop offset="70%"  stopColor="rgba(88,28,135,0.04)" />
          <stop offset="100%" stopColor="rgba(46,16,101,0.01)" />
        </radialGradient>
        <filter id="corridorGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Human Silhouette (behind everything) ─────────────────── */}
      <ellipse
        cx="250" cy="10" rx="30" ry="25"
        fill="url(#bgGrad)"
        stroke="rgba(139,92,246,0.1)"
        strokeWidth={0.8}
      />
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
          C 142,450 133,426 137,377
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

      {/* ── Inactive corridors ───────────────────────────────────── */}
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

      {/* ── Active corridors ─────────────────────────────────────── */}
      {CORRIDORS.map(corr => {
        if (!activeCorridorIds.has(corr.id)) return null
        return (
          <g key={`active-${corr.id}`}>
            <path
              d={corr.path}
              stroke="rgba(167,139,250,0.25)"
              strokeWidth={18}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={corr.path}
              stroke="rgba(109,40,217,0.82)"
              strokeWidth={13}
              strokeLinecap="round"
              fill="none"
            />
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

        const ux = dx / len
        const uy = dy / len
        const px = (dy / len) * corr.perpSign
        const py = (-dx / len) * corr.perpSign

        const base   = 19
        const spread = 10

        return chans.map((chan, i) => {
          const offset = base + (i - (chans.length - 1) / 2) * spread
          const inset  = 12

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
