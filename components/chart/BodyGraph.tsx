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
  Head:        { x: 222, y: 20,  w: 56, h: 50, shape: 'tri-up'    },
  Ajna:        { x: 218, y: 96,  w: 64, h: 52, shape: 'tri-down'  },
  Throat:      { x: 217, y: 163, w: 66, h: 42, shape: 'square'    },
  G:           { x: 212, y: 232, w: 76, h: 76, shape: 'diamond'   },
  Heart:       { x: 298, y: 224, w: 66, h: 58, shape: 'half-top'  },
  Sacral:      { x: 217, y: 340, w: 66, h: 42, shape: 'square'    },
  SolarPlexus: { x: 300, y: 334, w: 62, h: 56, shape: 'half-left' },
  Spleen:      { x: 118, y: 334, w: 62, h: 56, shape: 'half-right'},
  Root:        { x: 217, y: 406, w: 66, h: 42, shape: 'square'    },
}
// Key geometry reference:
//   G:           cx=250 cy=270  top=(250,232) bot=(250,308) L=(212,270) R=(288,270)
//   Heart:       cx=331         tip=(331,224) L-base=(298,282) R-base=(364,282)
//   SolarPlexus: cy=362         tip=(300,362) TR=(362,334) BR=(362,390)
//   Spleen:      cy=362         tip=(180,362) TL=(118,334) BL=(118,390)
//   Throat:      cx=250         top=163 bot=205 L=217 R=283
//   Sacral:      cx=250         top=340 bot=382 L=217 R=283

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
  { id: 'Head-Ajna',   centers: ['Head', 'Ajna'],     path: 'M250,70 L250,96',    labelA: [250,70],  labelB: [250,96],  perpSign: 1 },
  { id: 'Ajna-Throat', centers: ['Ajna', 'Throat'],   path: 'M250,148 L250,163',  labelA: [250,148], labelB: [250,163], perpSign: 1 },
  { id: 'Throat-G',    centers: ['Throat', 'G'],      path: 'M250,205 L250,232',  labelA: [250,205], labelB: [250,232], perpSign: 1 },
  { id: 'G-Sacral',    centers: ['G', 'Sacral'],      path: 'M250,308 L250,340',  labelA: [250,308], labelB: [250,340], perpSign: 1 },
  { id: 'Sacral-Root', centers: ['Sacral', 'Root'],   path: 'M250,382 L250,406',  labelA: [250,382], labelB: [250,406], perpSign: 1 },

  // ── Right branch ─────────────────────────────────────────────────
  // Throat R-midpoint → Heart tip
  { id: 'Throat-Heart',       centers: ['Throat', 'Heart'],       path: 'M283,184 L331,224',  labelA: [283,184], labelB: [331,224], perpSign:  1 },
  // Heart R-base → SolarPlexus TR corner (near-vertical)
  { id: 'Heart-SolarPlexus',  centers: ['Heart', 'SolarPlexus'],  path: 'M364,282 L362,334',  labelA: [364,282], labelB: [362,334], perpSign:  1 },
  // Sacral R-edge → SolarPlexus tip (short horizontal)
  { id: 'Sacral-SolarPlexus', centers: ['Sacral', 'SolarPlexus'], path: 'M283,362 L300,362',  labelA: [283,362], labelB: [300,362], perpSign:  1 },
  // SolarPlexus BR → Root R-area
  { id: 'SolarPlexus-Root',   centers: ['SolarPlexus', 'Root'],   path: 'M362,390 L283,427',  labelA: [362,390], labelB: [283,427], perpSign:  1 },
  // Throat R → SolarPlexus TR (long diagonal)
  { id: 'Throat-SolarPlexus', centers: ['Throat', 'SolarPlexus'], path: 'M283,205 L362,334',  labelA: [283,205], labelB: [362,334], perpSign: -1 },
  // Sacral → Throat (ch. 34-20): runs right of G center
  { id: 'Sacral-Throat',      centers: ['Sacral', 'Throat'],      path: 'M287,340 L287,205',  labelA: [287,340], labelB: [287,205], perpSign:  1 },

  // ── Left branch ──────────────────────────────────────────────────
  // G L-edge → Spleen tip (diagonal down-left)
  { id: 'G-Spleen',     centers: ['G', 'Spleen'],     path: 'M212,270 L180,362',  labelA: [212,270], labelB: [180,362], perpSign: -1 },
  // Sacral L-edge → Spleen tip (short horizontal)
  { id: 'Sacral-Spleen', centers: ['Sacral', 'Spleen'], path: 'M217,362 L180,362', labelA: [217,362], labelB: [180,362], perpSign:  1 },
  // Spleen BL corner → Root L-area
  { id: 'Spleen-Root',  centers: ['Spleen', 'Root'],   path: 'M118,390 L217,427',  labelA: [118,390], labelB: [217,427], perpSign: -1 },
  // Throat L-edge → Spleen TL corner
  { id: 'Throat-Spleen', centers: ['Throat', 'Spleen'], path: 'M217,184 L118,334', labelA: [217,184], labelB: [118,334], perpSign:  1 },

  // ── Cross connections ─────────────────────────────────────────────
  // G R-edge → Heart L-base (very short bridge)
  { id: 'G-Heart',    centers: ['G', 'Heart'],   path: 'M288,270 L298,282',                    labelA: [288,270], labelB: [298,282], perpSign:  1 },
  // Heart → Spleen (ch. 26-44): wide arc down-left across the graph
  { id: 'Heart-Spleen', centers: ['Heart', 'Spleen'], path: 'M298,282 C265,300 215,325 180,362', labelA: [298,282], labelB: [180,362], perpSign: -1 },
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
export default function BodyGraph({ chart, size = 500 }: BodyGraphProps) {
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
      viewBox="60 -12 380 514"
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

      {/* ── Human Silhouette ─────────────────────────────────────── */}
      <ellipse cx="250" cy="10" rx="30" ry="25" fill="url(#bgGrad)" stroke="rgba(139,92,246,0.1)" strokeWidth={0.8} />
      <path
        d={`M 272,30 C 296,46 342,88 360,138 C 373,175 373,208 366,232 C 376,260 377,283 368,305
            C 376,330 373,355 363,377 C 369,402 367,426 358,450 L 348,468 L 152,468
            C 142,450 133,426 137,377 C 127,355 124,330 132,305 C 123,283 124,260 134,232
            C 127,208 127,175 140,138 C 158,88 204,46 228,30 C 237,18 244,4 250,2
            C 256,4 263,18 272,30 Z`}
        fill="url(#bgGrad)"
        stroke="rgba(139,92,246,0.08)"
        strokeWidth={0.8}
      />

      {/* ── Inactive corridors ───────────────────────────────────── */}
      {CORRIDORS.map(corr => activeCorridorIds.has(corr.id) ? null : (
        <path key={`io-${corr.id}`} d={corr.path} stroke="rgba(139,92,246,0.13)" strokeWidth={13} strokeLinecap="round" fill="none" />
      ))}
      {CORRIDORS.map(corr => activeCorridorIds.has(corr.id) ? null : (
        <path key={`ii-${corr.id}`} d={corr.path} stroke="rgba(22,14,60,0.6)"    strokeWidth={9}  strokeLinecap="round" fill="none" />
      ))}

      {/* ── Active corridors ─────────────────────────────────────── */}
      {CORRIDORS.map(corr => !activeCorridorIds.has(corr.id) ? null : (
        <g key={`active-${corr.id}`}>
          <path d={corr.path} stroke="rgba(167,139,250,0.25)" strokeWidth={18} strokeLinecap="round" fill="none" />
          <path d={corr.path} stroke="rgba(109,40,217,0.82)"  strokeWidth={13} strokeLinecap="round" fill="none" />
          <path d={corr.path} stroke="rgba(167,139,250,0.35)" strokeWidth={5}  strokeLinecap="round" fill="none" />
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
