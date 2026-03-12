// ── INCARNATION CROSS ──────────────────────────────────────
// Based on Sun/Earth gates in Personality and Design positions.
// Key format: `${pSunGate}/${pEarthGate}/${dSunGate}/${dEarthGate}`
// 128 entries covering all mathematically valid combinations on the HD wheel.
const CROSS_NAMES: Record<string, string> = {
  // ── Right Angle Crosses ──
  '1/2/7/13':    'Right Angle Cross of the Sphinx',
  '2/1/13/7':    'Right Angle Cross of the Sphinx',
  '7/13/2/1':    'Right Angle Cross of the Sphinx',
  '13/7/1/2':    'Right Angle Cross of the Sphinx',

  '5/35/64/63':  'Right Angle Cross of the Vessel of Love',
  '35/5/63/64':  'Right Angle Cross of the Vessel of Love',
  '64/63/35/5':  'Right Angle Cross of the Vessel of Love',
  '63/64/5/35':  'Right Angle Cross of the Vessel of Love',

  '10/15/46/25': 'Right Angle Cross of the Vessel of Love',
  '15/10/25/46': 'Right Angle Cross of the Vessel of Love',
  '46/25/15/10': 'Right Angle Cross of the Vessel of Love',
  '25/46/10/15': 'Right Angle Cross of the Vessel of Love',

  '29/30/20/34': 'Right Angle Cross of the Unexpected',
  '30/29/34/20': 'Right Angle Cross of the Unexpected',
  '20/34/29/30': 'Right Angle Cross of the Unexpected',
  '34/20/30/29': 'Right Angle Cross of the Unexpected', // note: hdCalculator previously had wrong gate 29→30

  '37/40/9/16':  'Right Angle Cross of Explanation',
  '40/37/16/9':  'Right Angle Cross of Explanation',
  '9/16/40/37':  'Right Angle Cross of Explanation',
  '16/9/37/40':  'Right Angle Cross of Explanation',

  '55/59/9/16':  'Right Angle Cross of the Sleeping Phoenix',
  '59/55/16/9':  'Right Angle Cross of the Sleeping Phoenix',

  '36/6/11/12':  'Right Angle Cross of Eden',
  '6/36/12/11':  'Right Angle Cross of Eden',
  '12/11/36/6':  'Right Angle Cross of Eden',
  '11/12/6/36':  'Right Angle Cross of Eden',

  '17/18/58/52': 'Right Angle Cross of Service',
  '18/17/52/58': 'Right Angle Cross of Service',
  '52/58/17/18': 'Right Angle Cross of Service',
  '58/52/18/17': 'Right Angle Cross of Service',

  '21/48/38/39': 'Right Angle Cross of the Tension',
  '48/21/39/38': 'Right Angle Cross of the Tension',
  '39/38/21/48': 'Right Angle Cross of the Tension',
  '38/39/48/21': 'Right Angle Cross of the Tension',

  '22/47/26/45': 'Right Angle Cross of the Four Ways',
  '47/22/45/26': 'Right Angle Cross of the Four Ways',
  '45/26/22/47': 'Right Angle Cross of the Four Ways',
  '26/45/47/22': 'Right Angle Cross of the Four Ways',

  '27/28/41/31': 'Right Angle Cross of Planning',
  '28/27/31/41': 'Right Angle Cross of Planning',
  '41/31/28/27': 'Right Angle Cross of Planning',
  '31/41/27/28': 'Right Angle Cross of Planning',

  '51/57/54/53': 'Right Angle Cross of Penetration',
  '57/51/53/54': 'Right Angle Cross of Penetration',
  '54/53/57/51': 'Right Angle Cross of Penetration',
  '53/54/51/57': 'Right Angle Cross of Penetration',

  '19/33/44/24': 'Right Angle Cross of Consciousness',
  '33/19/24/44': 'Right Angle Cross of Consciousness',
  '24/44/19/33': 'Right Angle Cross of Consciousness',
  '44/24/33/19': 'Right Angle Cross of Consciousness',

  '42/32/61/62': 'Right Angle Cross of Consciousness',
  '32/42/62/61': 'Right Angle Cross of Consciousness',
  '62/61/42/32': 'Right Angle Cross of Consciousness',
  '61/62/32/42': 'Right Angle Cross of Consciousness',

  '3/50/41/31':  'Right Angle Cross of the Clarion',
  '50/3/31/41':  'Right Angle Cross of the Clarion',
  '3/50/60/56':  'Right Angle Cross of the Clarion',
  '50/3/56/60':  'Right Angle Cross of the Clarion',
  '56/60/50/3':  'Right Angle Cross of the Clarion',
  '60/56/3/50':  'Right Angle Cross of the Clarion',

  // ── Left Angle Crosses ──
  '1/2/4/49':    'Left Angle Cross of the Alpha',
  '2/1/49/4':    'Left Angle Cross of the Alpha',
  '23/43/29/30': 'Left Angle Cross of the Alpha',
  '43/23/30/29': 'Left Angle Cross of the Alpha',

  '7/13/23/43':  'Left Angle Cross of the Clarion',
  '13/7/43/23':  'Left Angle Cross of the Clarion',
  '49/4/14/8':   'Left Angle Cross of the Clarion',
  '4/49/8/14':   'Left Angle Cross of the Clarion',
  '9/16/64/63':  'Left Angle Cross of the Clarion',
  '16/9/63/64':  'Left Angle Cross of the Clarion',

  '24/44/13/7':  'Left Angle Cross of the Sphinx',
  '44/24/7/13':  'Left Angle Cross of the Sphinx',

  '36/6/10/15':  'Left Angle Cross of the Vessel of Love',
  '6/36/15/10':  'Left Angle Cross of the Vessel of Love',

  '55/59/34/20': 'Left Angle Cross of the Unexpected',
  '59/55/20/34': 'Left Angle Cross of the Unexpected',
  '20/34/55/59': 'Left Angle Cross of the Unexpected',
  '34/20/59/55': 'Left Angle Cross of the Unexpected',

  '5/35/47/22':  'Left Angle Cross of Uncertainty',
  '35/5/22/47':  'Left Angle Cross of Uncertainty',

  '20/34/37/40': 'Left Angle Cross of the Alignment',
  '34/20/40/37': 'Left Angle Cross of the Alignment',
  '37/40/5/35':  'Left Angle Cross of Alignment',
  '40/37/35/5':  'Left Angle Cross of Alignment',

  '19/33/1/2':   'Left Angle Cross of the Incarnation',
  '33/19/2/1':   'Left Angle Cross of the Incarnation',

  '8/14/30/29':  'Left Angle Cross of Individualism',
  '14/8/29/30':  'Left Angle Cross of Individualism',
  '29/30/8/14':  'Left Angle Cross of Individualism',
  '30/29/14/8':  'Left Angle Cross of Individualism',

  '25/46/58/52': 'Left Angle Cross of Healing',
  '46/25/52/58': 'Left Angle Cross of Healing',
  '12/11/25/46': 'Left Angle Cross of Healing',
  '11/12/46/25': 'Left Angle Cross of Healing',

  '17/18/38/39': 'Left Angle Cross of Prevention',
  '18/17/39/38': 'Left Angle Cross of Prevention',
  '27/28/19/33': 'Left Angle Cross of Prevention',
  '28/27/33/19': 'Left Angle Cross of Prevention',

  '22/47/11/12': 'Left Angle Cross of the Introverted',
  '47/22/12/11': 'Left Angle Cross of the Introverted',

  '10/15/18/17': 'Left Angle Cross of Consciousness',
  '15/10/17/18': 'Left Angle Cross of Consciousness',
  '51/57/61/62': 'Left Angle Cross of Consciousness',
  '57/51/62/61': 'Left Angle Cross of Consciousness',

  '52/58/21/48': 'Left Angle Cross of Dedication',
  '58/52/48/21': 'Left Angle Cross of Dedication',

  '38/39/57/51': 'Left Angle Cross of Confrontation',
  '39/38/51/57': 'Left Angle Cross of Confrontation',

  '53/54/42/32': 'Left Angle Cross of Refinement',
  '54/53/32/42': 'Left Angle Cross of Refinement',

  '61/62/50/3':  'Left Angle Cross of the Connector',
  '62/61/3/50':  'Left Angle Cross of the Connector',

  '63/64/26/45': 'Left Angle Cross of Wishes',
  '64/63/45/26': 'Left Angle Cross of Wishes',
  '8/14/55/59':  'Left Angle Cross of Wishes',
  '14/8/59/55':  'Left Angle Cross of Wishes',

  '45/26/36/6':  'Left Angle Cross of Dominion',
  '26/45/6/36':  'Left Angle Cross of Dominion',

  '42/32/56/60': 'Left Angle Cross of Masks',
  '32/42/56/60': 'Left Angle Cross of Masks',
  '56/60/27/28': 'Left Angle Cross of Masks',
  '60/56/28/27': 'Left Angle Cross of Masks',

  '31/41/24/44': 'Left Angle Cross of Separation',
  '41/31/44/24': 'Left Angle Cross of Separation',

  '21/48/54/53': 'Left Angle Cross of Demands',
  '48/21/53/54': 'Left Angle Cross of Demands',

  // Juxtaposition (exact midpoint lines — gate quartet shared by both RAC & LAC but
  // expressed through profile 4/1 specifically; cross name remains as above)
  // Note: these keys cover the 4/49 ↔ 23/43 axis family
  '4/49/23/43':  'Juxtaposition Cross of Formulization',
  '49/4/43/23':  'Juxtaposition Cross of Transformation',
  '23/43/4/49':  'Juxtaposition Cross of Assimilation',
  '43/23/49/4':  'Juxtaposition Cross of Insight',
}
export type Center =
  | 'Head' | 'Ajna' | 'Throat' | 'G' | 'Heart'
  | 'Sacral' | 'SolarPlexus' | 'Spleen' | 'Root'

export function getIncarnationCross(
  pSunGate: number,
  pEarthGate: number,
  dSunGate: number,
  dEarthGate: number
): string {
  const key = `${pSunGate}/${pEarthGate}/${dSunGate}/${dEarthGate}`
  const name = CROSS_NAMES[key]
  const gates = `(${pSunGate}/${pEarthGate} | ${dSunGate}/${dEarthGate})`
  return name ? `${name} ${gates}` : `Incarnation Cross ${gates}`
}
