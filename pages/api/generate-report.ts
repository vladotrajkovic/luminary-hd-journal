import type { NextApiRequest, NextApiResponse } from 'next'

export const config = { api: { bodyParser: true } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { chartData, userName } = req.body

  if (!chartData) return res.status(400).json({ error: 'Missing chart data' })

  const {
    type, authority, profile, definition, incarnationCross,
    definedCenters, openCenters, activeChannels, allGates,
    allPersonalityGates, allDesignGates,
  } = chartData

  const systemPrompt = `You are a compassionate and insightful Human Design reader and guide. Your role is to generate a deeply personal, warm, and illuminating Human Design report. Your writing style is:
- Warm, direct, and personal (use "you" throughout)
- Poetic yet practical — beautiful language grounded in real guidance
- Encouraging and empowering, never diagnostic or prescriptive
- Deep but accessible — no jargon without explanation

You follow the Jovian Archive tradition closely. Write flowing paragraphs, not bullet points. Each section should feel like a personal letter to the individual.`

  const channelList = activeChannels.length > 0
    ? activeChannels.map((ch: any) => `Channel ${ch.gates[0]}-${ch.gates[1]}: ${ch.name} (${ch.type})`).join(', ')
    : 'No fully activated channels (hanging gates carry significant energy)'

  const definedCentersList = definedCenters.join(', ') || 'None'
  const openCentersList = openCenters.join(', ') || 'None'
  const personalityGates = allPersonalityGates?.join(', ') || allGates?.join(', ') || 'Unknown'
  const designGates = allDesignGates?.join(', ') || 'Unknown'

  const userPrompt = `Generate a complete, personalised Human Design report for ${userName || 'this person'} with the following chart:

**CHART DATA:**
- Type: ${type}
- Authority: ${authority}
- Profile: ${profile}
- Definition: ${definition}
- Incarnation Cross: ${incarnationCross}
- Defined Centers: ${definedCentersList}
- Open/Undefined Centers: ${openCentersList}
- Active Channels: ${channelList}
- Personality (Conscious) Gates: ${personalityGates}
- Design (Unconscious) Gates: ${designGates}

Generate the report in exactly these sections, using the XML tags below to delimit them. Write flowing, personal prose — NO bullet points, NO numbered lists:

<section_intro>
Write a warm, personal 2-3 paragraph introduction to Human Design and what it means to receive this reading. Reference their specific type and make them feel seen.
</section_intro>

<section_type>
Write a deeply personal 4-5 paragraph section about their Type (${type}). Cover: what it means to be this type, their Strategy, their Signature (what they feel when aligned), their Not-Self Theme (what they feel when out of alignment), their life purpose, and practical day-to-day guidance. Make it feel like a personal guide written just for them.
</section_type>

<section_authority>
Write a deeply personal 4-5 paragraph section about their Inner Authority (${authority}). Explain how this authority works in their body, how to listen to it, common challenges, and real-life examples of how to apply it in decisions. Be warm and specific.
</section_authority>

<section_profile>
Write 3-4 paragraphs about their Profile (${profile}). Explain both line numbers individually, then how they work together. Include: life theme, how they learn, how they interact with others, their relationship style, and growth edge.
</section_profile>

<section_centers>
Write a personalised section covering all 9 centers. For each center, state whether it is Defined or Open/Undefined for this person, and write 2-3 sentences about what that means for them personally. Cover all 9 in this order: Head, Ajna, Throat, G Center (Identity), Heart (Ego/Will), Sacral, Solar Plexus (Emotional), Spleen, Root. Make each feel personal and specific to their chart.
Centers status: Defined: ${definedCentersList} | Open: ${openCentersList}
</section_centers>

<section_channels>
${activeChannels.length > 0
  ? `Write a personalised description for each of their active channels. For each channel, give it a header (e.g. "Channel ${activeChannels[0]?.gates?.[0]}-${activeChannels[0]?.gates?.[1]}: ${activeChannels[0]?.name}") followed by 2-3 paragraphs about what this channel means for them — their natural gifts, potential challenges, and how to use this energy wisely. Channels: ${channelList}`
  : 'This person has no fully activated channels. Write 2 paragraphs about the power and significance of hanging (single) gates, and how their specific gates still carry profound meaning and energy in their chart.'
}
</section_channels>

<section_final>
Write a warm, personal, 2-3 paragraph closing note. Weave together the key themes from their chart — their type, authority, profile, and channels — into a unified message about their unique path. End with an empowering reminder about the experiment of living their design. Address them personally by name if provided.
</section_final>`

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      return res.status(500).json({ error: err })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const reader = anthropicRes.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`)
            }
          } catch { /* skip */ }
        }
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
