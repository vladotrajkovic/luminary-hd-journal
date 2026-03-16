import React from 'react'
import { Center, HDChart, ALL_CHANNELS } from '../../lib/hdCalculator'

interface BodyGraphProps {
  chart: HDChart
  size?: number
}

// ── CENTER GEOMETRY ────────────────────────────────────────────────────────────
// Matches JA layout precisely:
//   Head        → triangle tip-up       (crown of skull)
//   Ajna        → triangle tip-down     (forehead/brow)
//   Throat      → rectangle             (throat)
//   G           → full diamond, largest (chest center)
//   Heart       → TOP half-diamond      (tip up, flat base; upper-right, pectoral)
//   Sacral      → rectangle             (lower abdomen)
//   SolarPlexus → LEFT half-diamond     (tip points LEFT/inward; lower-right, level with Sacral)
//   Spleen      → RIGHT half-diamond    (tip points RIGHT/inward; lower-left, level with Sacral)
//   Root        → rectangle             (base of spine)
const CP: Record<Center, {
  x: number; y: number; w: number; h: number
  shape: 'diamond' | 'square' | 'tri-up' | 'tri-down' | 'half-top' | 'half-left' | 'half-right'
}> = {
  Head:        { x: 214, y: -72, w: 72,  h: 65,  shape: 'tri-up'    },  // cx=250 top=-72  bot=-7  — scaled from cx=250 cy=-39
  Ajna:        { x: 209, y: 4,   w: 82,  h: 68,  shape: 'tri-down'  },  // cx=250 top=4    bot=72  — scaled from cx=250 cy=38
  Throat:      { x: 216, y: 80,  w: 68,  h: 68,  shape: 'square'    },  // cx=250 top=80   bot=148 L=216 R=284
  G:           { x: 201, y: 157, w: 98,  h: 98,  shape: 'diamond'   },  // cx=250 cy=206   top=157 bot=255 L=201 R=299
  Heart:       { x: 330, y: 203, w: 104, h: 86,  shape: 'half-top'  },  // tip=(382,203) L-base=(330,289) R-base=(434,289)
  Sacral:      { x: 216, y: 382, w: 68,  h: 68,  shape: 'square'    },  // cx=250 cy=416   top=382 bot=450 L=216 R=284
  SolarPlexus: { x: 343, y: 360, w: 99,  h: 88,  shape: 'half-left' },  // tip=(343,404) TR=(442,360) BR=(442,448)
  Spleen:      { x: 59,  y: 360, w: 99,  h: 88,  shape: 'half-right'},  // tip=(158,404) TL=(59,360) BL=(59,448)
  Root:        { x: 207, y: 474, w: 86,  h: 55,  shape: 'square'    },  // cx=250 cy=501   top=474 bot=529 L=207 R=293
}

const CENTER_LABELS: Record<Center, string> = {
  Head: 'HEAD', Ajna: 'AJNA', Throat: 'THROAT', G: 'G',
  Heart: 'HEART', Sacral: 'SACRAL', SolarPlexus: 'SP', Spleen: 'SPLEEN', Root: 'ROOT',
}

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
  // ── Vertical spine ───────────────────────────────────────────────
  { id: 'Head-Ajna',   centers: ['Head', 'Ajna'],     path: 'M250,-7 L250,4',     labelA: [250,-7],  labelB: [250,4],   perpSign: 1 },
  { id: 'Ajna-Throat', centers: ['Ajna', 'Throat'],   path: 'M250,72 L250,80',    labelA: [250,72],  labelB: [250,80],  perpSign: 1 },
  { id: 'Throat-G',    centers: ['Throat', 'G'],      path: 'M250,148 L250,157',  labelA: [250,148], labelB: [250,157], perpSign: 1 },
  { id: 'G-Sacral',    centers: ['G', 'Sacral'],      path: 'M250,255 L250,382',  labelA: [250,255], labelB: [250,382], perpSign: 1 },
  { id: 'Sacral-Root', centers: ['Sacral', 'Root'],   path: 'M250,450 L250,474',  labelA: [250,450], labelB: [250,474], perpSign: 1 },

  // ── Right branch ─────────────────────────────────────────────────
  { id: 'Throat-Heart',       centers: ['Throat', 'Heart'],       path: 'M284,114 L382,203',  labelA: [284,114], labelB: [382,203], perpSign:  1 },
  { id: 'Heart-SolarPlexus',  centers: ['Heart', 'SolarPlexus'],  path: 'M434,289 L442,360',  labelA: [434,289], labelB: [442,360], perpSign:  1 },
  { id: 'Sacral-SolarPlexus', centers: ['Sacral', 'SolarPlexus'], path: 'M284,416 L343,404',  labelA: [284,416], labelB: [343,404], perpSign:  1 },
  { id: 'SolarPlexus-Root',   centers: ['SolarPlexus', 'Root'],   path: 'M442,448 L293,501',  labelA: [442,448], labelB: [293,501], perpSign:  1 },
  { id: 'Throat-SolarPlexus', centers: ['Throat', 'SolarPlexus'], path: 'M284,148 L442,360',  labelA: [284,148], labelB: [442,360], perpSign: -1 },
  { id: 'Sacral-Throat',      centers: ['Sacral', 'Throat'],      path: 'M284,382 L284,148',  labelA: [284,382], labelB: [284,148], perpSign:  1 },

  // ── Left branch ──────────────────────────────────────────────────
  { id: 'G-Spleen',      centers: ['G', 'Spleen'],       path: 'M201,206 L158,404',  labelA: [201,206], labelB: [158,404], perpSign: -1 },
  { id: 'Sacral-Spleen', centers: ['Sacral', 'Spleen'],  path: 'M216,416 L158,404',  labelA: [216,416], labelB: [158,404], perpSign:  1 },
  { id: 'Spleen-Root',   centers: ['Spleen', 'Root'],    path: 'M59,448 L207,501',   labelA: [59,448],  labelB: [207,501], perpSign: -1 },
  { id: 'Throat-Spleen', centers: ['Throat', 'Spleen'],  path: 'M216,114 L59,360',   labelA: [216,114], labelB: [59,360],  perpSign:  1 },

  // ── Cross connections ─────────────────────────────────────────────
  { id: 'G-Heart',      centers: ['G', 'Heart'],      path: 'M299,206 L330,289',                    labelA: [299,206], labelB: [330,289], perpSign:  1 },
  { id: 'Heart-Spleen', centers: ['Heart', 'Spleen'], path: 'M330,289 C280,330 210,375 158,404',    labelA: [330,289], labelB: [158,404], perpSign: -1 },
]

// Fast lookup: "C1-C2" or "C2-C1" → Corridor
const corridorByKey = new Map<string, Corridor>()
CORRIDORS.forEach(c => {
  corridorByKey.set(`${c.centers[0]}-${c.centers[1]}`, c)
  corridorByKey.set(`${c.centers[1]}-${c.centers[0]}`, c)
})

// ── GATE LABEL COLOUR ─────────────────────────────────────────────────────────
function gateColor(gate: number, pGates: number[], dGates: number[]): string {
  const inP = pGates.includes(gate)
  const inD = dGates.includes(gate)
  if (inP && inD) return '#EDE9FE'
  if (inP)        return '#A78BFA'
  if (inD)        return '#F87171'
  return 'rgba(167,139,250,0.22)'
}
function gateFontWeight(gate: number, pGates: number[], dGates: number[]): string {
  return (pGates.includes(gate) || dGates.includes(gate)) ? '600' : '400'
}

// ── CENTER RENDERER ───────────────────────────────────────────────────────────
function renderCenter(center: Center, isDefined: boolean) {
  const pos = CP[center]
  const cx  = pos.x + pos.w / 2
  const cy  = pos.y + pos.h / 2

  const fill      = isDefined ? 'rgba(76,29,149,0.92)' : 'rgba(22,14,60,0.55)'
  const stroke    = isDefined ? '#A78BFA'               : 'rgba(167,139,250,0.32)'
  const strokeW   = isDefined ? 1.5                     : 1
  const labelFill = isDefined ? '#EDE9FE'               : 'rgba(167,139,250,0.45)'

  let shape: React.ReactNode
  let textX = cx
  let textY = cy

  switch (pos.shape) {
    case 'tri-up': {
      const pts = `${cx},${pos.y} ${pos.x},${pos.y+pos.h} ${pos.x+pos.w},${pos.y+pos.h}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      textY = pos.y + pos.h * 2 / 3
      break
    }
    case 'tri-down': {
      const pts = `${pos.x},${pos.y} ${pos.x+pos.w},${pos.y} ${cx},${pos.y+pos.h}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      textY = pos.y + pos.h / 3
      break
    }
    case 'square': {
      shape = <rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={3} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      break
    }
    case 'diamond': {
      const pts = `${cx},${pos.y} ${pos.x+pos.w},${cy} ${cx},${pos.y+pos.h} ${pos.x},${cy}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      break
    }
    case 'half-top': {
      // Tip UP, flat base at bottom. Centroid Y = top + 2h/3
      const pts = `${cx},${pos.y} ${pos.x},${pos.y+pos.h} ${pos.x+pos.w},${pos.y+pos.h}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      textX = cx
      textY = pos.y + pos.h * 2 / 3
      break
    }
    case 'half-left': {
      // Tip LEFT, flat edge RIGHT. Centroid X = left + 2w/3, Y = cy
      const pts = `${pos.x},${cy} ${pos.x+pos.w},${pos.y} ${pos.x+pos.w},${pos.y+pos.h}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      textX = pos.x + pos.w * 2 / 3
      textY = cy
      break
    }
    case 'half-right': {
      // Tip RIGHT, flat edge LEFT. Centroid X = left + w/3, Y = cy
      const pts = `${pos.x+pos.w},${cy} ${pos.x},${pos.y} ${pos.x},${pos.y+pos.h}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      textX = pos.x + pos.w / 3
      textY = cy
      break
    }
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
        x={textX} y={textY + fontSize / 3}
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
export default function BodyGraph({ chart, size = 600 }: BodyGraphProps) {
  const { definedCenters, allPersonalityGates, allDesignGates, activeChannels } = chart

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
      viewBox="-30 -95 560 700"
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

      {/* ── Human Silhouette — wider head + wider body to contain all centers ── */}
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

      {/* ── Gate number labels ────────────────────────────────────── */}
      {CORRIDORS.map(corr => {
        const chans = corridorGateData.get(corr.id) || []
        if (chans.length === 0) return null
        const [ax, ay] = corr.labelA
        const [bx, by] = corr.labelB
        const dx = bx - ax, dy = by - ay
        const len = Math.sqrt(dx*dx + dy*dy) || 1
        const ux = dx/len, uy = dy/len
        const px = (dy/len) * corr.perpSign
        const py = (-dx/len) * corr.perpSign
        const base = 19, spread = 10
        return chans.map((chan, i) => {
          const offset = base + (i - (chans.length - 1) / 2) * spread
          const inset  = 12
          const g0x = ax + ux*inset + px*offset, g0y = ay + uy*inset + py*offset
          const g1x = bx - ux*inset + px*offset, g1y = by - uy*inset + py*offset
          const c0 = gateColor(chan.gate0, allPersonalityGates, allDesignGates)
          const c1 = gateColor(chan.gate1, allPersonalityGates, allDesignGates)
          const fw0 = gateFontWeight(chan.gate0, allPersonalityGates, allDesignGates)
          const fw1 = gateFontWeight(chan.gate1, allPersonalityGates, allDesignGates)
          return (
            <g key={`${corr.id}-${chan.gate0}-${chan.gate1}`}>
              <text x={g0x} y={g0y+3} textAnchor="middle" fontSize={7} fontFamily="'Inter', sans-serif" fontWeight={fw0} fill={c0} style={{ pointerEvents:'none' }}>{chan.gate0}</text>
              <text x={g1x} y={g1y+3} textAnchor="middle" fontSize={7} fontFamily="'Inter', sans-serif" fontWeight={fw1} fill={c1} style={{ pointerEvents:'none' }}>{chan.gate1}</text>
            </g>
          )
        })
      })}

      {/* ── Centers (on top of everything) ───────────────────────── */}
      {(Object.keys(CP) as Center[]).map(center => renderCenter(center, definedCenters.includes(center)))}
    </svg>
  )
}
