import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { generateHDReportPdf } from '../../lib/generatePdf'

// ── SECTION CONFIG ─────────────────────────────────────────
const SECTIONS = [
  { key: 'intro',     tag: 'section_intro',     label: 'Introduction',      icon: '✦', color: '#A78BFA' },
  { key: 'type',      tag: 'section_type',      label: 'Your Type',         icon: '◈', color: '#D4AF37' },
  { key: 'authority', tag: 'section_authority', label: 'Your Authority',    icon: '◎', color: '#2DD4BF' },
  { key: 'profile',   tag: 'section_profile',   label: 'Your Profile',      icon: '⬡', color: '#F9A8D4' },
  { key: 'centers',   tag: 'section_centers',   label: 'The Nine Centers',  icon: '◯', color: '#A78BFA' },
  { key: 'channels',  tag: 'section_channels',  label: 'Your Channels',     icon: '◇', color: '#FCD34D' },
  { key: 'final',     tag: 'section_final',     label: 'Your Path Forward', icon: '✧', color: '#C4B5FD' },
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

// ── RESPONSIVE STYLES ──────────────────────────────────────
const REPORT_CSS = `
  .report-page-inner {
    max-width: 820px;
    margin: 0 auto;
    padding: 40px 24px 80px;
  }
  .report-card {
    background: rgba(15, 10, 46, 0.6);
    border: 1px solid rgba(167, 139, 250, 0.15);
    border-radius: 16px;
    padding: 32px 36px;
    margin-bottom: 24px;
    backdrop-filter: blur(10px);
  }
  .report-section-card {
    background: rgba(15, 10, 46, 0.6);
    border: 1px solid rgba(167, 139, 250, 0.15);
    border-radius: 16px;
    padding: 32px 36px;
    margin-bottom: 24px;
    backdrop-filter: blur(10px);
  }
  .report-profile-strip {
    display: flex;
    gap: 28px;
    flex-wrap: wrap;
    background: rgba(45, 27, 105, 0.2);
    border-radius: 12px;
    padding: 20px 28px;
    margin-bottom: 32px;
    border: 1px solid rgba(123, 79, 212, 0.2);
  }
  .report-page-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px;
    font-weight: 400;
    color: #EDE9FE;
    line-height: 1.15;
    margin-bottom: 12px;
  }
  .report-body-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    color: rgba(220, 210, 255, 0.85);
    line-height: 1.9;
    white-space: pre-wrap;
  }
  .report-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  @media (max-width: 600px) {
    .report-page-inner {
      padding: 24px 14px 60px;
    }
    .report-card {
      padding: 20px 18px;
      border-radius: 12px;
    }
    .report-section-card {
      padding: 20px 18px;
      border-radius: 12px;
    }
    .report-profile-strip {
      gap: 16px;
      padding: 16px 18px;
    }
    .report-page-title {
      font-size: 28px;
    }
    .report-body-text {
      font-size: 16px;
      line-height: 1.75;
    }
    .report-actions {
      flex-direction: column;
      align-items: stretch;
    }
    .report-actions button {
      width: 100%;
    }
  }
`

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
    <div className="report-section-card" style={{
      borderColor: `${section.color}25`,
      borderLeft: `3px solid ${section.color}55`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 20, color: section.color }}>{section.icon}</span>
        <p style={S.sectionTitle(section.color)}>{section.label}</p>
      </div>
      <div style={S.divider} />
      <p className="report-body-text">
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
  const [userId, setUserId] = useState<string | null>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [rawText, setRawText] = useState('')
  const [sections, setSections] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const rawRef = useRef('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      setUserId(session.user.id)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(data)

      // ── Restore saved report if it exists ──────────────────
      if (data?.hd_report && Object.keys(data.hd_report).length >= 3) {
        setSections(data.hd_report)
        setSavedAt(data.hd_report_generated_at || null)
        setDone(true)
        setLoading(false)
        return
      }

      // ── Check if fresh chart data was passed from Chart Generator ──
      const stored = typeof window !== 'undefined'
        ? sessionStorage.getItem('luminary_chart_report') : null
      if (stored) {
        sessionStorage.removeItem('luminary_chart_report')
        try {
          const parsed = JSON.parse(stored)
          setChartData(parsed)
          setLoading(false)
          return
        } catch { /* fall through to profile data */ }
      }

      // ── Build chart data from profile ──
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

  // ── Save report sections to Supabase ──────────────────────
  const saveReportToDb = async (completedSections: Record<string, string>) => {
    if (!userId) return
    setSaving(true)
    const now = new Date().toISOString()
    try {
      await supabase
        .from('profiles')
        .update({
          hd_report: completedSections,
          hd_report_generated_at: now,
        })
        .eq('id', userId)
      setSavedAt(now)
    } catch (e) {
      console.error('Failed to save report:', e)
    } finally {
      setSaving(false)
    }
  }

  // ── Generate report ───────────────────────────────────────
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

      // ── Auto-save once complete ───────────────────────────
      const finalSections = parseSections(rawRef.current)
      if (Object.keys(finalSections).length >= 3) {
        await saveReportToDb(finalSections)
      }

    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setGenerating(false)
      setDone(true)
    }
  }

  // ── Regenerate: clear saved report and restart ────────────
  const handleRegenerate = async () => {
    // Clear from DB
    if (userId) {
      await supabase
        .from('profiles')
        .update({ hd_report: null, hd_report_generated_at: null })
        .eq('id', userId)
    }
    setSections({})
    setDone(false)
    setSavedAt(null)
    rawRef.current = ''
    setRawText('')
    setError('')

    // Rebuild chartData from profile for the new generation
    if (profile) {
      setChartData({
        type: profile.hd_type || 'Unknown',
        authority: profile.hd_authority || 'Unknown',
        profile: profile.hd_profile || 'Unknown',
        definition: profile.hd_definition || 'Unknown',
        incarnationCross: profile.hd_incarnation_cross || 'Unknown',
        definedCenters: profile.defined_centers || [],
        openCenters: (['Head','Ajna','Throat','G','Heart','Sacral','SolarPlexus','Spleen','Root'] as string[])
          .filter((c: string) => !(profile.defined_centers || []).includes(c)),
        activeChannels: [],
        allGates: profile.active_gates || [],
        allPersonalityGates: [],
        allDesignGates: [],
      })
    }
  }

  const handleExportPdf = async () => {
    setExporting(true)
    try {
      await generateHDReportPdf({ sections, profile })
    } catch (e) {
      console.error('PDF export failed', e)
    } finally {
      setExporting(false)
    }
  }

  const hasReport = Object.keys(sections).length >= 3
  const missingData = !chartData?.type || chartData?.type === 'Unknown'

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(167,139,250,0.5)' }}>
            Loading your reading...
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>HD Report · Luminary</title>
        <style>{REPORT_CSS}</style>
      </Head>

      <div className="report-page-inner">

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: '0.25em', color: 'rgba(167,139,250,0.45)', textTransform: 'uppercase', marginBottom: 10 }}>
            ✧ Personal Reading
          </p>
          <h1 className="report-page-title">
            Your Human Design Report
          </h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 19, color: 'rgba(196,181,253,0.5)', lineHeight: 1.6 }}>
            A personalised reading woven from the blueprint of your birth
          </p>

          {/* Saved indicator */}
          {savedAt && !generating && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16,
              background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.2)',
              borderRadius: 20, padding: '6px 16px',
            }}>
              <span style={{ color: '#2DD4BF', fontSize: 12 }}>✓</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(45,212,191,0.7)', letterSpacing: '0.05em' }}>
                Saved · {new Date(savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
          {saving && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16,
              background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: 20, padding: '6px 16px',
            }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(167,139,250,0.6)', letterSpacing: '0.05em' }}>
                Saving your report...
              </span>
            </div>
          )}
        </div>

        {/* ── Profile Summary ── */}
        {profile && (profile.hd_type || profile.hd_authority) && (
          <div className="report-profile-strip">
            {[
              { label: 'Type',       value: profile.hd_type,       color: '#A78BFA' },
              { label: 'Authority',  value: profile.hd_authority,   color: '#2DD4BF' },
              { label: 'Profile',    value: profile.hd_profile,     color: '#D4AF37' },
              { label: 'Definition', value: profile.hd_definition,  color: '#F9A8D4' },
            ].filter(i => i.value).map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.45)', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Missing Data Warning ── */}
        {missingData && !hasReport && (
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

        {/* ── Generate Button (only shown when no saved report) ── */}
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
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 20, color: 'rgba(196,181,253,0.6)', maxWidth: 480, margin: '0 auto 32px' }}>
              Luminary will weave your Type, Authority, Profile, Centers and Channels into a personalised, flowing reading — written just for you.
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
                return <SkeletonCard key={section.key} label={section.label} icon={section.icon} color={section.color} />
              }
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

            {/* ── Completion actions ── */}
            {done && hasReport && (
              <div className="report-section report-card" style={{
                background: 'linear-gradient(135deg, rgba(45,27,105,0.3) 0%, rgba(15,10,46,0.5) 100%)',
                borderColor: 'rgba(212,175,55,0.2)',
                textAlign: 'center',
              }}>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: '0.2em', color: 'rgba(212,175,55,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>
                  ✦ Your Reading is Complete ✦
                </p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,0.5)', marginBottom: 28 }}>
                  {savedAt
                    ? 'Your reading is saved and will be here whenever you return.'
                    : 'Download your report as a beautifully formatted PDF, or come back to regenerate it any time.'}
                </p>
                <div className="report-actions">
                  <button
                    onClick={handleExportPdf}
                    disabled={exporting}
                    className="btn-cosmic"
                    style={{ fontSize: 12, padding: '10px 28px', opacity: exporting ? 0.6 : 1 }}
                  >
                    {exporting ? '✦ Preparing PDF...' : '↓ Download PDF'}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '10px 28px' }}
                  >
                    ↺ Regenerate Report
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  )
}
