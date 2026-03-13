// pages/api/generate-report.ts
// Hybrid report generator:
//   - Type, Authority, Profile, Centers, Channels → fetched from content_library (Supabase, instant)
//   - Intro + Final → small Claude API call (~1200 tokens, ~$0.02/report)
//
// Replace the existing pages/api/generate-report.ts with this file.

import type { NextApiRequest, NextApiResponse } from 'next'
import { getChartContent } from '../../lib/contentLibrary'
import type { HdCenterName } from '../../lib/contentLibraryTypes'

export const config = { api: { bodyParser: true } }

// ── Center key mapping ─────────────────────────────────────
// chartData.definedCenters uses internal Center type keys ('SolarPlexus', 'G', etc.)
// getChartContent expects HdCenterName slugs ('solar_plexus', 'g', etc.)
const CENTER_TO_SLUG: Record<string, HdCenterName> = {
  Head:        'head',
  Ajna:        'ajna',
  Throat:      'throat',
  G:           'g',
  Heart:       'heart',
  Sacral:      'sacral',
  SolarPlexus: 'solar_plexus',
  Spleen:      'spleen',
  Root:        'root',
}

// Display labels shown as headings inside each center block in the report
const CENTER_LABEL: Record<HdCenterName, string> = {
  head:        'Head Center',
  ajna:        'Ajna Center',
  throat:      'Throat Center',
  g:           'G Center (Identity)',
  heart:       'Heart / Ego Center',
  sacral:      'Sacral Center',
  solar_plexus:'Solar Plexus Center',
  spleen:      'Spleen Center',
  root:        'Root Center',
}

const ALL_CENTER_KEYS: HdCenterName[] = [
  'head', 'ajna', 'throat', 'g', 'heart',
  'sacral', 'solar_plexus', 'spleen', 'root',
]

// ── Authority key mapping ─────────────────────────────────
// Handles the names the chart calculator emits (e.g. "Solar Plexus", "Sacral", etc.)
const AUTHORITY_SLUG: Record<string, string> = {
  'Sacral':              'authority_sacral',
  'Solar Plexus':        'authority_emotional',
  'Emotional':           'authority_emotional',
  'Splenic':             'authority_splenic',
  'Spleen':              'authority_splenic',
  'Ego Manifested':      'authority_ego_manifested',
  'Ego Projected':       'authority_ego_projected',
  'Self-Projected':      'authority_self_projected',
  'Self Projected':      'authority_self_projected',
  'G Center':            'authority_self_projected',
  'Mental Projector':    'authority_mental_projector',
  'No Inner Authority':  'authority_mental_projector',
  'Lunar':               'authority_lunar',
  'Moon':                'authority_lunar',
}

// ── Helpers ────────────────────────────────────────────────
function toTypeKey(type: string): string {
  return `type_${type.toLowerCase().replace(/\s+/g, '_')}`
}

function toAuthorityKey(authority: string): string {
  return AUTHORITY_SLUG[authority]
    ?? `authority_${authority.toLowerCase().replace(/[\s-]+/g, '_')}`
}

function toProfileKey(profile: string): string {
  // profile is "1/3", "4/6", etc.
  const [l1, l2] = profile.split('/').map(s => s.trim())
  return `profile_${l1}_${l2}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { chartData, userName } = req.body
  if (!chartData) return res.status(400).json({ error: 'Missing chart data' })

  const {
    type         = 'Generator',
    authority    = 'Sacral',
    profile      = '1/3',
    definition   = '',
    incarnationCross = '',
    definedCenters   = [] as string[],
    openCenters      = [] as string[],
    activeChannels   = [] as any[],
  } = chartData

  // ── Build content library keys ─────────────────────────
  const typeKey      = toTypeKey(type)
  const authorityKey = toAuthorityKey(authority)
  const profileKey   = toProfileKey(profile)

  // Build defined-center lookup set (handles both chartData key formats)
  const definedSet = new Set<HdCenterName>(
    (definedCenters as string[])
      .map(c => CENTER_TO_SLUG[c] ?? CENTER_TO_SLUG[c.replace(/\s/g, '')] ?? null)
      .filter(Boolean) as HdCenterName[]
  )

  const centerInput = ALL_CENTER_KEYS.map(name => ({ name, defined: definedSet.has(name) }))

  const channelInput = (activeChannels as any[]).map((ch: any) => ({
    gate1: ch.gates[0],
    gate2: ch.gates[1],
  }))

  // ── Set SSE headers (do this early) ──────────────────────
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const emit = (text: string) => {
    res.write(`data: ${JSON.stringify({ text })}\n\n`)
  }

  // ── Fetch static content from Supabase ────────────────────
  let staticContent: Awaited<ReturnType<typeof getChartContent>> | null = null
  try {
    staticContent = await getChartContent({
      typeKey:      typeKey as any,
      authorityKey: authorityKey as any,
      profileKey:   profileKey as any,
      centers:      centerInput,
      channels:     channelInput,
    })
  } catch (err) {
    console.error('[generate-report] Content library fetch failed:', err)
  }

  // ── Emit static sections immediately ─────────────────────
  // These resolve 5 of 7 skeleton cards instantly, before Claude even starts.

  if (staticContent) {
    // Type
    if (staticContent.type) {
      emit(`<section_type>\n${staticContent.type}\n</section_type>\n`)
    }

    // Authority
    if (staticContent.authority) {
      emit(`<section_authority>\n${staticContent.authority}\n</section_authority>\n`)
    }

    // Profile
    if (staticContent.profile) {
      emit(`<section_profile>\n${staticContent.profile}\n</section_profile>\n`)
    }

    // Centers — one content block per center with a label heading
    const centersBlocks = ALL_CENTER_KEYS.map(slug => {
      const isDefined = definedSet.has(slug)
      const key = `center_${slug}_${isDefined ? 'defined' : 'open'}` as any
      const body = staticContent!.centers.get(key) ?? ''
      const label = CENTER_LABEL[slug]
      const state = isDefined ? 'Defined' : 'Open / Undefined'
      return `**${label}** — ${state}\n\n${body}`
    }).filter(b => b.includes('\n\n'))

    if (centersBlocks.length > 0) {
      emit(`<section_centers>\n${centersBlocks.join('\n\n---\n\n')}\n</section_centers>\n`)
    }

    // Channels — one content block per active channel with a label heading
    if (channelInput.length > 0) {
      const channelsBlocks = channelInput.map(({ gate1, gate2 }) => {
        const lo = Math.min(gate1, gate2)
        const hi = Math.max(gate1, gate2)
        const key = `channel_${lo}_${hi}` as any
        const body = staticContent!.channels.get(key) ?? ''
        const chInfo = (activeChannels as any[]).find(
          (ch: any) => ch.gates.includes(gate1) && ch.gates.includes(gate2)
        )
        const label = chInfo?.name
          ? `Channel ${lo}–${hi}: ${chInfo.name}`
          : `Channel ${lo}–${hi}`
        return `**${label}**\n\n${body}`
      }).filter(b => b.includes('\n\n'))

      if (channelsBlocks.length > 0) {
        emit(`<section_channels>\n${channelsBlocks.join('\n\n---\n\n')}\n</section_channels>\n`)
      } else {
        emit(`<section_channels>\nYou have no fully activated channels in your chart. This is not a lack — it means your energy is designed to remain open and magnetic, drawing in the energies of others and sampling the full spectrum of human experience. Your individual gates each carry profound meaning and are activated in the right company.\n</section_channels>\n`)
      }
    } else {
      emit(`<section_channels>\nYou have no fully activated channels in your chart. This is not a lack — it means your energy is designed to remain open and magnetic, drawing in the energies of others and sampling the full spectrum of human experience. Your individual gates each carry profound meaning and are activated in the right company.\n</section_channels>\n`)
    }
  } else {
    // Content library unavailable — emit minimal placeholders so the UI isn't broken.
    // Claude will still generate personalised intro + final below.
    emit(`<section_type>\nContent for your Type (${type}) is being prepared.\n</section_type>\n`)
    emit(`<section_authority>\nContent for your Authority (${authority}) is being prepared.\n</section_authority>\n`)
    emit(`<section_profile>\nContent for your Profile (${profile}) is being prepared.\n</section_profile>\n`)
    emit(`<section_centers>\nCenter content is being prepared.\n</section_centers>\n`)
    emit(`<section_channels>\nChannel content is being prepared.\n</section_channels>\n`)
  }

  // ── Claude: personalised intro + final only ───────────────
  const channelList = activeChannels.length > 0
    ? (activeChannels as any[]).map((ch: any) => `${ch.gates[0]}–${ch.gates[1]}: ${ch.name}`).join(', ')
    : 'No fully activated channels'

  const definedCentersList = (definedCenters as string[]).join(', ') || 'None'

  const systemPrompt = `You are a warm, deeply insightful Human Design guide. Write in second person ("you") throughout. Your voice is poetic yet grounded — beautiful language that delivers real, practical guidance. No bullet points except where specifically instructed. No jargon without explanation.`

  const userPrompt = `Write exactly two sections of a Human Design report for ${userName || 'this person'}. Use only the XML section tags below — no other output.

Chart:
- Type: ${type}
- Authority: ${authority}  
- Profile: ${profile}
- Definition: ${definition}
- Incarnation Cross: ${incarnationCross}
- Defined Centers: ${definedCentersList}
- Active Channels: ${channelList}

<section_intro>
Write 2–3 warm, personal paragraphs welcoming them to their Human Design reading. Reference their Type (${type}) in the opening. Explain, briefly and simply, what Human Design is and how this report is meant to be used — as a mirror, not a prescription. Make them feel genuinely seen. Close the section with an invitation to read slowly and return often.
</section_intro>

<section_final>
Write a closing note in three parts — no sub-headers, let it flow as natural prose:

PART 1 (1 paragraph): A warm, grounding statement about what this chart is really for. It is not here to tell them what to do — it is here to remind them of what is already true inside them.

PART 2 (exactly 3 bullet points, each starting with "- "): Three short, specific personal reminders drawn directly from their chart. One or two sentences each. Cover:
- Their Type (${type}) and what it means for how they move through life
- Their Profile (${profile}) and how they are designed to learn and connect
- A key gift or theme from their defined centers or active channels

PART 3 (2–3 paragraphs): A poetic, encouraging closing. This is not about fixing anything — it is about remembering their natural flow. Encourage curiosity and patience with the experiment. End with one sentence about how Human Design, explored over time, can become a true ally on their path.
</section_final>`

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1400,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[generate-report] Claude API error:', errText)
      // Emit fallback intro + final so the report is still complete
      emit(`<section_intro>\nWelcome to your Human Design reading. This chart is a map of your unique energy — a guide to understanding how you are designed to move through the world as a ${type}. Take your time with it.\n</section_intro>\n`)
      emit(`<section_final>\nTrust your design. Return to it often. Your chart is always here.\n</section_final>\n`)
    } else {
      const reader = anthropicRes.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              emit(parsed.delta.text)
            }
          } catch { /* skip malformed SSE frames */ }
        }
      }
    }
  } catch (err: any) {
    console.error('[generate-report] Unexpected error:', err)
    emit(`<section_intro>\nWelcome to your Human Design reading as a ${type}.\n</section_intro>\n`)
    emit(`<section_final>\nTrust your design.\n</section_final>\n`)
  }

  res.write('data: [DONE]\n\n')
  res.end()
}
