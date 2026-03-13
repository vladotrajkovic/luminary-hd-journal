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

function parseSections(rawText: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const section of SECTIONS) {
    const openTag  = `<${section.tag}>`
    const closeTag = `</${section.tag}>`
    const start = rawText.indexOf(openTag)
    const end   = rawText.indexOf(closeTag)
    if (start !== -1) {
      result[section.key] = (
        end !== -1
          ? rawText.slice(start + openTag.length, end)
          : rawText.slice(start + openTag.length)
      ).trim()
    }
  }
  return result
}

// ── SKELETON CARD ──────────────────────────────────────────
function SkeletonCard({ label, icon, color }: { label: string; icon: string; color: string }) {
  return (
    <div className="rp-card" style={{ borderColor: `${color}22`, background: 'rgba(15,10,46,0.4)', display: 'flex', alignItems: 'center', gap: 16 }}>
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
    <div className="rp-card" style={{ borderColor: `${section.color}25`, borderLeft: `3px solid ${section.color}55` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 20, color: section.color }}>{section.icon}</span>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: '0.2em', color: section.color, textTransform: 'uppercase', marginBottom: 0 }}>
          {section.label}
        </p>
      </div>
      <div className="rp-divider" />
      <p className="rp-body">
        {content}
        {isStreaming && (
          <span style={{ display: 'inline-block', width: 2, height: 20, background: section.color, marginLeft: 3, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
        )}
      </p>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────
export default function ReportPage() {
  const router = useRouter()
  const [profile, setProfile]   = useState<any>(null)
  const [userId, setUserId]     = useState<string | null>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sections, setSections] = useState<Record<string, string>>({})
  const [done, setDone]         = useState(false)
  const [savedAt, setSavedAt]   = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [exporting, setExporting] = useState(false)
  const rawRef = useRef('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      setUserId(session.user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)

      // Restore saved report
      if (data?.hd_report && Object.keys(data.hd_report).length >= 3) {
        setSections(data.hd_report)
        setSavedAt(data.hd_report_generated_at || null)
        setDone(true)
        setLoading(false)
        return
      }

      // Fresh chart data from Chart Generator
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem('luminary_chart_report') : null
      if (stored) {
        sessionStorage.removeItem('luminary_chart_report')
        try { setChartData(JSON.parse(stored)); setLoading(false); return } catch { /* fall through */ }
      }

      // Build from profile
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

  const saveReportToDb = async (completed: Record<string, string>) => {
    if (!userId) return
    setSaving(true)
    const now = new Date().toISOString()
    try {
      await supabase.from('profiles').update({ hd_report: completed, hd_report_generated_at: now }).eq('id', userId)
      setSavedAt(now)
    } catch (e) { console.error('Save failed:', e) }
    finally { setSaving(false) }
  }

  const generateReport = async () => {
    if (!chartData) return
    setGenerating(true); setDone(false); setError('')
    rawRef.current = ''; setSections({})

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
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const d = line.slice(6).trim()
          if (d === '[DONE]') { setDone(true); continue }
          try {
            const p = JSON.parse(d)
            if (p.text) { rawRef.current += p.text; setSections(parseSections(rawRef.current)) }
          } catch { /* skip */ }
        }
      }

      const final = parseSections(rawRef.current)
      if (Object.keys(final).length >= 3) await saveReportToDb(final)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setGenerating(false); setDone(true)
    }
  }

  const handleRegenerate = async () => {
    if (userId) await supabase.from('profiles').update({ hd_report: null, hd_report_generated_at: null }).eq('id', userId)
    setSections({}); setDone(false); setSavedAt(null); rawRef.current = ''; setError('')
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
    try { await generateHDReportPdf({ sections, profile }) }
    catch (e) { console.error('PDF export failed', e) }
    finally { setExporting(false) }
  }

  const hasReport  = Object.keys(sections).length >= 3
  const missingData = !chartData?.type || chartData?.type === 'Unknown'

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(167,139,250,0.5)' }}>
          Loading your reading...
        </p>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <Head><title>HD Report · Luminary</title></Head>

      <div className="rp-outer">

        {/* ── Header ── */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: '0.25em', color: 'rgba(167,139,250,0.45)', textTransform: 'uppercase', marginBottom: 10 }}>
            ✧ Personal Reading
          </p>
          <h1 className="rp-title">Your Human Design Report</h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 'clamp(15px, 4vw, 19px)', color: 'rgba(196,181,253,0.5)', lineHeight: 1.6 }}>
            A personalised reading woven from the blueprint of your birth
          </p>

          {savedAt && !generating && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 20, padding: '6px 16px' }}>
              <span style={{ color: '#2DD4BF', fontSize: 12 }}>✓</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(45,212,191,0.7)', letterSpacing: '0.05em' }}>
                Saved · {new Date(savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
          {saving && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 20, padding: '6px 16px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(167,139,250,0.6)', letterSpacing: '0.05em' }}>Saving your report...</span>
            </div>
          )}
        </div>

        {/* ── Profile strip ── */}
        {profile && (profile.hd_type || profile.hd_authority) && (
          <div className="rp-profile-strip">
            {[
              { label: 'Type',       value: profile.hd_type,      color: '#A78BFA' },
              { label: 'Authority',  value: profile.hd_authority,  color: '#2DD4BF' },
              { label: 'Profile',    value: profile.hd_profile,    color: '#D4AF37' },
              { label: 'Definition', value: profile.hd_definition, color: '#F9A8D4' },
            ].filter(i => i.value).map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.45)', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Missing data warning ── */}
        {missingData && !hasReport && (
          <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 12, padding: '20px 24px', marginBottom: 28 }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#D4AF37', marginBottom: 6 }}>⚠ Incomplete Chart Data</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: 'rgba(212,175,55,0.7)', lineHeight: 1.6 }}>
              To generate a full report, please complete your chart data in{' '}
              <a href="/profile" style={{ color: '#D4AF37', textDecoration: 'underline' }}>My Chart</a> or run the{' '}
              <a href="/chart" style={{ color: '#D4AF37', textDecoration: 'underline' }}>HD Chart Generator</a> first.
            </p>
          </div>
        )}

        {/* ── Generate button ── */}
        {!hasReport && (
          <div style={{ textAlign: 'center', padding: '40px 0 48px' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 28px', background: 'radial-gradient(circle, rgba(123,79,212,0.25) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(123,79,212,0.2)', fontSize: 40 }}>✦</div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 20, color: 'rgba(196,181,253,0.6)', maxWidth: 480, margin: '0 auto 32px' }}>
              Luminary will weave your Type, Authority, Profile, Centers and Channels into a personalised, flowing reading — written just for you.
            </p>
            <button onClick={generateReport} disabled={generating || missingData} className="btn-cosmic" style={{ fontSize: 14, padding: '16px 48px', opacity: missingData ? 0.4 : 1 }}>
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

        {/* ── Report sections ── */}
        {(generating || hasReport) && (
          <div>
            {generating && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#A78BFA', animation: 'pulse 1.5s infinite' }} />
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: '0.2em', color: 'rgba(167,139,250,0.6)', textTransform: 'uppercase' }}>Generating Your Reading</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SECTIONS.map(s => (
                    <span key={s.key} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em', background: sections[s.key] ? `${s.color}20` : 'rgba(45,27,105,0.3)', border: `1px solid ${sections[s.key] ? s.color + '50' : 'rgba(167,139,250,0.15)'}`, color: sections[s.key] ? s.color : 'rgba(167,139,250,0.4)', transition: 'all 0.4s' }}>
                      {sections[s.key] ? '✓ ' : ''}{s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {SECTIONS.map((section) => {
              const content = sections[section.key]
              if (!content && !generating) return null
              if (!content) return <SkeletonCard key={section.key} label={section.label} icon={section.icon} color={section.color} />
              const nextSectionIdx = SECTIONS.findIndex(s => s.key === section.key) + 1
              const isCurrentlyStreaming = generating && SECTIONS[nextSectionIdx] && !sections[SECTIONS[nextSectionIdx].key]
              return (
                <div key={section.key}>
                  <SectionCard section={section} content={content} isStreaming={!!isCurrentlyStreaming} />
                </div>
              )
            })}

            {/* ── Completion card ── */}
            {done && hasReport && (
              <div className="rp-card" style={{ background: 'linear-gradient(135deg, rgba(45,27,105,0.3) 0%, rgba(15,10,46,0.5) 100%)', borderColor: 'rgba(212,175,55,0.2)', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: '0.2em', color: 'rgba(212,175,55,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>✦ Your Reading is Complete ✦</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,0.5)', marginBottom: 28 }}>
                  {savedAt ? 'Your reading is saved and will be here whenever you return.' : 'Download your report as a beautifully formatted PDF, or come back to regenerate it any time.'}
                </p>
                <div className="rp-actions">
                  <button onClick={handleExportPdf} disabled={exporting} className="btn-cosmic" style={{ fontSize: 12, padding: '10px 28px', opacity: exporting ? 0.6 : 1 }}>
                    {exporting ? '✦ Preparing PDF...' : '↓ Download PDF'}
                  </button>
                  <button onClick={handleRegenerate} className="btn-ghost" style={{ fontSize: 12, padding: '10px 28px' }}>
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
