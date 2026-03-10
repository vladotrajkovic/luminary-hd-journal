import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'

// ── SECTION CONFIG ─────────────────────────────────────────
const SECTIONS = [
  { key: 'intro',    tag: 'section_intro',    label: 'Introduction',       icon: '✦', color: '#A78BFA' },
  { key: 'type',     tag: 'section_type',     label: 'Your Type',          icon: '◈', color: '#D4AF37' },
  { key: 'authority',tag: 'section_authority',label: 'Your Authority',     icon: '◎', color: '#2DD4BF' },
  { key: 'profile',  tag: 'section_profile',  label: 'Your Profile',       icon: '⬡', color: '#F9A8D4' },
  { key: 'centers',  tag: 'section_centers',  label: 'The Nine Centers',   icon: '◯', color: '#A78BFA' },
  { key: 'channels', tag: 'section_channels', label: 'Your Channels',      icon: '◇', color: '#FCD34D' },
  { key: 'final',    tag: 'section_final',    label: 'Your Path Forward',  icon: '✧', color: '#C4B5FD' },
]

// Parse streaming text into sections using XML-like tags
function parseSections(rawText: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const section of SECTIONS) {
    const openTag  = `<${section.tag}>`
    const closeTag = `</${section.tag}>`
    const start = rawText.indexOf(openTag)
    const end   = rawText.indexOf(closeTag)
    if (start !== -1) {
      const content = end !== -1
        ? rawText.slice(start + openTag.length, end)
        : rawText.slice(start + openTag.length)
      result[section.key] = content.trim()
    }
  }
  return result
}

// ── STYLES ─────────────────────────────────────────────────
const S = {
  card: {
    background: 'rgba(15, 10, 46, 0.6)',
    border: '1px solid rgba(167, 139, 250, 0.15)',
    borderRadius: 16,
    padding: '32px 36px',
    marginBottom: 24,
    backdropFilter: 'blur(10px)',
  } as React.CSSProperties,
  sectionTitle: (color: string) => ({
    fontFamily: 'Cinzel, serif',
    fontSize: 13,
    letterSpacing: '0.2em',
    color,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  }),
  sectionHeading: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 28,
    fontWeight: 400,
    color: '#EDE9FE',
    marginBottom: 24,
    lineHeight: 1.2,
  } as React.CSSProperties,
  body: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 18,
    color: 'rgba(220, 210, 255, 0.85)',
    lineHeight: 1.9,
    whiteSpace: 'pre-wrap' as const,
  },
  divider: {
    width: 60,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent)',
    margin: '20px 0',
  },
}

// ── SKELETON CARD ──────────────────────────────────────────
function SkeletonCard({ label, icon, color }: { label: string; icon: string; color: string }) {
  return (
    <div style={{
      ...S.card,
      borderColor: `${color}22`,
      background: 'rgba(15,10,46,0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '24px 32px',
    }}>
      <span style={{ fontSize: 22, opacity: 0.3, color }}>{icon}</span>
      <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: `${color}55`, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ flex: 1, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {[80, 60, 90].map((w, i) => (
          <div key={i} style={{ width: w, height: 8, borderRadius: 4, background: 'rgba(167,139,250,0.08)', animation: 'pulse 2s infinite', animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

// ── SECTION CARD ───────────────────────────────────────────
function SectionCard({ section, content, isStreaming }: {
  section: typeof SECTIONS[0]
  content: string
  isStreaming: boolean
}) {
  return (
    <div style={{
      ...S.card,
      borderColor: `${section.color}25`,
      borderLeft: `3px solid ${section.color}55`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 20, color: section.color }}>{section.icon}</span>
        <p style={S.sectionTitle(section.color)}>{section.label}</p>
      </div>
      <div style={S.divider} />
      <p style={S.body}>
        {content}
        {isStreaming && (
          <span style={{
            display: 'inline-block', width: 2, height: 20, background: section.color,
            marginLeft: 3, verticalAlign: 'middle',
            animation: 'blink 1s step-end infinite',
          }} />
        )}
      </p>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────
export default function ReportPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [rawText, setRawText] = useState('')
  const [sections, setSections] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const rawRef = useRef('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)

      // Build chart data from profile
      if (data) {
        setChartData({
          type: data.hd_type || 'Unknown',
          authority: data.hd_authority || 'Unknown',
          profile: data.hd_profile || 'Unknown',
          definition: data.hd_definition || 'Unknown',
          incarnationCross: data.hd_incarnation_cross || 'Unknown',
          definedCenters: data.defined_centers || [],
          openCenters: (['Head','Ajna','Throat','G','Heart','Sacral','SolarPlexus','Spleen','Root'] as string[])
            .filter((c: string) => !(data.defined_centers || []).includes(c)),
          activeChannels: [],
          allGates: data.active_gates || [],
          allPersonalityGates: [],
          allDesignGates: [],
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const generateReport = async () => {
    if (!chartData) return
    setGenerating(true)
    setDone(false)
    setError('')
    rawRef.current = ''
    setRawText('')
    setSections({})

    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartData, userName: profile?.full_name }),
      })

      if (!res.ok) throw new Error('Failed to generate report')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') { setDone(true); continue }
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                rawRef.current += parsed.text
                setRawText(rawRef.current)
                setSections(parseSections(rawRef.current))
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setGenerating(false)
      setDone(true)
    }
  }

  const hasReport = Object.keys(sections).length > 0

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', paddingTop: 80, fontFamily: 'Cinzel, serif', color: 'rgba(167,139,250,0.4)', letterSpacing: '0.2em' }}>
          Loading your chart...
        </div>
      </Layout>
    )
  }

  const missingData = !profile?.hd_type || !profile?.hd_authority || !profile?.hd_profile

  return (
    <>
      <Head>
        <title>Your HD Report — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Cinzel:wght@400;500;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
        <style>{`
          @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
          .report-section { animation: fadeUp 0.5s ease forwards; }
        `}</style>
      </Head>
      <Layout>

        {/* ── Header ── */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.2em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
            AI-Powered Reading
          </p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 36, color: '#EDE9FE', letterSpacing: '0.05em', marginBottom: 8 }}>
            Your Human Design Report
          </h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 19, color: 'rgba(196,181,253,0.55)' }}>
            A personalised reading of your unique energetic blueprint
          </p>
        </div>

        {/* ── Chart Summary Banner ── */}
        {profile && (
          <div style={{
            ...S.card,
            background: 'linear-gradient(135deg, rgba(45,27,105,0.5) 0%, rgba(15,10,46,0.7) 100%)',
            borderColor: 'rgba(212,175,55,0.2)',
            marginBottom: 32,
            display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center',
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Reading For</p>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#EDE9FE' }}>{profile.full_name || 'Your Chart'}</p>
            </div>
            {[
              { label: 'Type', value: profile.hd_type, color: '#A78BFA' },
              { label: 'Authority', value: profile.hd_authority, color: '#2DD4BF' },
              { label: 'Profile', value: profile.hd_profile, color: '#D4AF37' },
              { label: 'Definition', value: profile.hd_definition, color: '#F9A8D4' },
            ].filter(i => i.value).map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.45)', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Missing Data Warning ── */}
        {missingData && (
          <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 12, padding: '20px 24px', marginBottom: 28 }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#D4AF37', marginBottom: 6 }}>⚠ Incomplete Chart Data</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: 'rgba(212,175,55,0.7)', lineHeight: 1.6 }}>
              To generate a full report, please complete your chart data in{' '}
              <a href="/profile" style={{ color: '#D4AF37', textDecoration: 'underline' }}>My Chart</a> or run the{' '}
              <a href="/chart" style={{ color: '#D4AF37', textDecoration: 'underline' }}>HD Chart Generator</a> first.
              At minimum, Type, Authority, and Profile are required.
            </p>
          </div>
        )}

        {/* ── Generate Button ── */}
        {!hasReport && (
          <div style={{ textAlign: 'center', padding: '40px 0 48px' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto 28px',
              background: 'radial-gradient(circle, rgba(123,79,212,0.25) 0%, transparent 70%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(123,79,212,0.2)',
              fontSize: 40,
            }}>
              ✦
            </div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 20, color: 'rgba(196,181,253,0.6)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
              Your chart holds a story unlike any other. Luminary will weave your Type, Authority, Profile, Centers and Channels into a personalised, flowing reading — written just for you.
            </p>
            <button
              onClick={generateReport}
              disabled={generating || missingData}
              className="btn-cosmic"
              style={{ fontSize: 14, padding: '16px 48px', opacity: missingData ? 0.4 : 1 }}
            >
              {generating ? '✦ Channelling Your Reading...' : '✦ Generate My Report'}
            </button>
            {generating && (
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(167,139,250,0.5)', marginTop: 16 }}>
                This takes about 15–20 seconds — your full reading is being crafted...
              </p>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#F87171' }}>{error}</p>
          </div>
        )}

        {/* ── Report Sections ── */}
        {(generating || hasReport) && (
          <div>
            {/* Progress indicator while generating */}
            {generating && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', background: '#A78BFA',
                    animation: 'pulse 1.5s infinite',
                  }} />
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: '0.2em', color: 'rgba(167,139,250,0.6)', textTransform: 'uppercase' }}>
                    Generating Your Reading
                  </p>
                </div>
                {/* Section progress pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SECTIONS.map(s => (
                    <span key={s.key} style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 11,
                      fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em',
                      background: sections[s.key] ? `${s.color}20` : 'rgba(45,27,105,0.3)',
                      border: `1px solid ${sections[s.key] ? s.color + '50' : 'rgba(167,139,250,0.15)'}`,
                      color: sections[s.key] ? s.color : 'rgba(167,139,250,0.4)',
                      transition: 'all 0.4s',
                    }}>
                      {sections[s.key] ? '✓ ' : ''}{s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Render each section as it arrives */}
            {SECTIONS.map((section) => {
              const content = sections[section.key]
              if (!content && !generating) return null
              if (!content) {
                // Still waiting for this section
                return <SkeletonCard key={section.key} label={section.label} icon={section.icon} color={section.color} />
              }
              // Determine if this specific section is still streaming
              const nextSectionIdx = SECTIONS.findIndex(s => s.key === section.key) + 1
              const nextSection = SECTIONS[nextSectionIdx]
              const isCurrentlyStreaming = generating && nextSection && !sections[nextSection.key]
              return (
                <div key={section.key} className="report-section">
                  <SectionCard
                    section={section}
                    content={content}
                    isStreaming={!!isCurrentlyStreaming}
                  />
                </div>
              )
            })}

            {/* Re-generate & actions (shown after completion) */}
            {done && hasReport && (
              <div className="report-section" style={{
                ...S.card,
                background: 'linear-gradient(135deg, rgba(45,27,105,0.3) 0%, rgba(15,10,46,0.5) 100%)',
                borderColor: 'rgba(212,175,55,0.2)',
                textAlign: 'center',
              }}>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: '0.2em', color: 'rgba(212,175,55,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>
                  ✦ Your Reading is Complete ✦
                </p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,0.5)', marginBottom: 28 }}>
                  Save this page or print it for your records. Come back when you're ready to dive deeper.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => window.print()}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '10px 28px' }}
                  >
                    ◎ Print / Save as PDF
                  </button>
                  <button
                    onClick={() => {
                      setSections({})
                      setRawText('')
                      setDone(false)
                      rawRef.current = ''
                    }}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '10px 28px' }}
                  >
                    ↺ Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </Layout>
    </>
  )
}
