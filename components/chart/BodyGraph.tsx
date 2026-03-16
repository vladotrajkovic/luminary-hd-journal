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
  Head:        { x: 222, y: -64, w: 56,  h: 50, shape: 'tri-up'    },  // cx=250 top=-64 bot=-14
  Ajna:        { x: 218, y: 12,  w: 64,  h: 52, shape: 'tri-down'  },  // cx=250 top=12  bot=64
  Throat:      { x: 224, y: 88,  w: 52,  h: 52, shape: 'square'    },  // cx=250 top=88  bot=140 L=224 R=276
  G:           { x: 212, y: 168, w: 76,  h: 76, shape: 'diamond'   },  // cx=250 cy=206  top=168 bot=244 L=212 R=288
  Heart:       { x: 322, y: 213, w: 80,  h: 66, shape: 'half-top'  },  // tip=(362,213) L-base=(322,279) R-base=(402,279)
  Sacral:      { x: 224, y: 390, w: 52,  h: 52, shape: 'square'    },  // cx=250 cy=416  top=390 bot=442 L=224 R=276
  SolarPlexus: { x: 334, y: 370, w: 76,  h: 68, shape: 'half-left' },  // tip=(334,404) TR=(410,370) BR=(410,438)
  Spleen:      { x: 70,  y: 370, w: 76,  h: 68, shape: 'half-right'},  // tip=(146,404) TL=(70,370) BL=(70,438)
  Root:        { x: 217, y: 480, w: 66,  h: 42, shape: 'square'    },  // cx=250 cy=501  top=480 bot=522
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
  { id: 'Head-Ajna',   centers: ['Head', 'Ajna'],     path: 'M250,-14 L250,12',   labelA: [250,-14], labelB: [250,12],  perpSign: 1 },
  { id: 'Ajna-Throat', centers: ['Ajna', 'Throat'],   path: 'M250,64 L250,88',    labelA: [250,64],  labelB: [250,88],  perpSign: 1 },
  { id: 'Throat-G',    centers: ['Throat', 'G'],      path: 'M250,140 L250,168',  labelA: [250,140], labelB: [250,168], perpSign: 1 },
  { id: 'G-Sacral',    centers: ['G', 'Sacral'],      path: 'M250,244 L250,390',  labelA: [250,244], labelB: [250,390], perpSign: 1 },
  { id: 'Sacral-Root', centers: ['Sacral', 'Root'],   path: 'M250,442 L250,480',  labelA: [250,442], labelB: [250,480], perpSign: 1 },

  // ── Right branch ─────────────────────────────────────────────────
  { id: 'Throat-Heart',       centers: ['Throat', 'Heart'],       path: 'M276,114 L362,213',  labelA: [276,114], labelB: [362,213], perpSign:  1 },
  { id: 'Heart-SolarPlexus',  centers: ['Heart', 'SolarPlexus'],  path: 'M402,279 L410,370',  labelA: [402,279], labelB: [410,370], perpSign:  1 },
  { id: 'Sacral-SolarPlexus', centers: ['Sacral', 'SolarPlexus'], path: 'M276,416 L334,404',  labelA: [276,416], labelB: [334,404], perpSign:  1 },
  { id: 'SolarPlexus-Root',   centers: ['SolarPlexus', 'Root'],   path: 'M410,438 L283,501',  labelA: [410,438], labelB: [283,501], perpSign:  1 },
  { id: 'Throat-SolarPlexus', centers: ['Throat', 'SolarPlexus'], path: 'M276,140 L410,370',  labelA: [276,140], labelB: [410,370], perpSign: -1 },
  { id: 'Sacral-Throat',      centers: ['Sacral', 'Throat'],      path: 'M280,390 L280,140',  labelA: [280,390], labelB: [280,140], perpSign:  1 },

  // ── Left branch ──────────────────────────────────────────────────
  { id: 'G-Spleen',      centers: ['G', 'Spleen'],       path: 'M212,206 L146,404',  labelA: [212,206], labelB: [146,404], perpSign: -1 },
  { id: 'Sacral-Spleen', centers: ['Sacral', 'Spleen'],  path: 'M224,416 L146,404',  labelA: [224,416], labelB: [146,404], perpSign:  1 },
  { id: 'Spleen-Root',   centers: ['Spleen', 'Root'],    path: 'M70,438 L217,501',   labelA: [70,438],  labelB: [217,501], perpSign: -1 },
  { id: 'Throat-Spleen', centers: ['Throat', 'Spleen'],  path: 'M224,114 L70,370',   labelA: [224,114], labelB: [70,370],  perpSign:  1 },

  // ── Cross connections ─────────────────────────────────────────────
  { id: 'G-Heart',      centers: ['G', 'Heart'],      path: 'M288,206 L322,279',                    labelA: [288,206], labelB: [322,279], perpSign:  1 },
  { id: 'Heart-Spleen', centers: ['Heart', 'Spleen'], path: 'M322,279 C275,330 200,375 146,404',    labelA: [322,279], labelB: [146,404], perpSign: -1 },
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
      viewBox="-30 -110 560 700"
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
