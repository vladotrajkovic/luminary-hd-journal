import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { generateHDReportPdf } from '../../lib/generatePdf'

// ── SECTION CONFIG ─────────────────────────────────────────
const SECTIONS = [
  { key: 'intro',     tag: 'section_intro',     label: 'Introduction',      icon: '✦', color: '#A78BFA' },
  { key: 'type',      tag: 'section_type',       label: 'Your Type',         icon: '◈', color: '#D4AF37' },
  { key: 'authority', tag: 'section_authority',  label: 'Your Authority',    icon: '◎', color: '#2DD4BF' },
  { key: 'profile',   tag: 'section_profile',    label: 'Your Profile',      icon: '⬡', color: '#F9A8D4' },
  { key: 'centers',   tag: 'section_centers',    label: 'The Nine Centers',  icon: '◯', color: '#A78BFA' },
  { key: 'channels',  tag: 'section_channels',   label: 'Your Channels',     icon: '◇', color: '#FCD34D' },
  { key: 'final',     tag: 'section_final',      label: 'Your Path Forward', icon: '✧', color: '#C4B5FD' },
]

// ── SECTION PARSER ─────────────────────────────────────────
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
  divider: {
    width: 60,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent)',
    margin: '20px 0',
  },
}

// ── MARKDOWN RENDERER ──────────────────────────────────────
// Handles the subset of markdown the content library emits:
//   **bold**  *italic*  - bullets  --- dividers  blank-line paragraphs
//   **Heading** — subtitle  (center / channel label lines)

type Segment = { type: 'text' | 'bold' | 'italic'; value: string }

function parseInline(raw: string): Segment[] {
  const segments: Segment[] = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) segments.push({ type: 'text', value: raw.slice(last, m.index) })
    if (m[1] !== undefined) segments.push({ type: 'bold',   value: m[1] })
    else                    segments.push({ type: 'italic', value: m[2] })
    last = re.lastIndex
  }
  if (last < raw.length) segments.push({ type: 'text', value: raw.slice(last) })
  return segments
}

function renderInline(segments: Segment[]) {
  return segments.map((seg, i) => {
    if (seg.type === 'bold')   return <strong key={i} style={{ fontWeight: 600, color: 'rgba(235, 225, 255, 0.95)' }}>{seg.value}</strong>
    if (seg.type === 'italic') return <em     key={i} style={{ fontStyle: 'italic', color: 'rgba(196, 181, 253, 0.85)' }}>{seg.value}</em>
    return <span key={i}>{seg.value}</span>
  })
}

function MarkdownContent({ text, accentColor, isStreaming }: {
  text: string
  accentColor: string
  isStreaming: boolean
}) {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 18,
    color: 'rgba(220, 210, 255, 0.85)',
    lineHeight: 1.9,
  }

  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let paragraphLines: string[] = []
  let key = 0

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    const combined = paragraphLines.join(' ').trim()
    if (combined) {
      blocks.push(
        <p key={key++} style={{ ...baseStyle, margin: '0 0 16px 0' }}>
          {renderInline(parseInline(combined))}
        </p>
      )
    }
    paragraphLines = []
  }

  for (const line of lines) {
    // Horizontal divider ---
    if (line.trim() === '---') {
      flushParagraph()
      blocks.push(
        <div key={key++} style={{
          width: '100%', height: 1,
          background: `linear-gradient(90deg, transparent, ${accentColor}35, transparent)`,
          margin: '24px 0',
        }} />
      )
      continue
    }

    // Bullet point
    if (line.trimStart().startsWith('- ')) {
      flushParagraph()
      const bulletText = line.trimStart().slice(2)
      blocks.push(
        <div key={key++} style={{ display: 'flex', gap: 12, margin: '0 0 10px 0', alignItems: 'flex-start' }}>
          <span style={{ color: accentColor, fontSize: 18, lineHeight: 1.9, flexShrink: 0, marginTop: 1 }}>◦</span>
          <p style={{ ...baseStyle, margin: 0 }}>
            {renderInline(parseInline(bulletText))}
          </p>
        </div>
      )
      continue
    }

    // Blank line → flush paragraph
    if (line.trim() === '') {
      flushParagraph()
      continue
    }

    // Accumulate into paragraph
    paragraphLines.push(line)
  }
  flushParagraph()

  return (
    <div>
      {blocks}
      {isStreaming && (
        <span style={{
          display: 'inline-block', width: 2, height: 20, background: accentColor,
          marginLeft: 3, verticalAlign: 'middle',
          animation: 'blink 1s step-end infinite',
        }} />
      )}
    </div>
  )
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
      <div style={{ flex: 1 }}>
        <span style={{
          fontFamily: 'Cinzel, serif', fontSize: 13,
          color: `${color}55`, letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[80, 60, 90].map((w, i) => (
          <div key={i} style={{
            width: w, height: 8, borderRadius: 4,
            background: 'rgba(167,139,250,0.08)',
            animation: 'pulse 2s infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
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
      <MarkdownContent
        text={content}
        accentColor={section.color}
        isStreaming={isStreaming}
      />
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────
export default function ReportPage() {
  const router = useRouter()
  const [profile, setProfile]       = useState<any>(null)
  const [userId, setUserId]         = useState<string | null>(null)
  const [chartData, setChartData]   = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [rawText, setRawText]       = useState('')
  const [sections, setSections]     = useState<Record<string, string>>({})
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')
  const [exporting, setExporting]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [savedAt, setSavedAt]       = useState<string | null>(null)
  const rawRef = useRef('')

  // ── LOAD ────────────────────────────────────────────────
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

      const chartFromProfile = {
        type:             data?.hd_type             || 'Unknown',
        authority:        data?.hd_authority         || 'Unknown',
        profile:          data?.hd_profile           || 'Unknown',
        definition:       data?.hd_definition        || 'Unknown',
        incarnationCross: data?.hd_incarnation_cross || 'Unknown',
        definedCenters:   data?.defined_centers      || [],
        openCenters: (['Head','Ajna','Throat','G','Heart','Sacral','SolarPlexus','Spleen','Root'] as string[])
          .filter((c: string) => !(data?.defined_centers || []).includes(c)),
        activeChannels:      [],
        allGates:            data?.active_gates        || [],
        allPersonalityGates: [],
        allDesignGates:      [],
      }

      // Restore persisted report
      if (data?.hd_report && typeof data.hd_report === 'object' && Object.keys(data.hd_report).length > 0) {
        setSections(data.hd_report as Record<string, string>)
        setDone(true)
        if (data.hd_report_generated_at) setSavedAt(data.hd_report_generated_at)
        setChartData(chartFromProfile)
        setLoading(false)
        return
      }

      // Check sessionStorage (passed from Chart Generator)
      const stored = typeof window !== 'undefined'
        ? sessionStorage.getItem('luminary_chart_report')
        : null
      if (stored) {
        sessionStorage.removeItem('luminary_chart_report')
        try {
          const parsed = JSON.parse(stored)
          setChartData(parsed)
          setLoading(false)
          return
        } catch { /* fall through */ }
      }

      setChartData(chartFromProfile)
      setLoading(false)
    }
    load()
  }, [])

  // ── SAVE TO DB ──────────────────────────────────────────
  const saveReportToDb = async (completedSections: Record<string, string>) => {
    if (!userId) return
    setSaving(true)
    const now = new Date().toISOString()
    const { error: saveError } = await supabase
      .from('profiles')
      .update({ hd_report: completedSections, hd_report_generated_at: now })
      .eq('id', userId)
    if (!saveError) {
      setSavedAt(now)
    } else {
      console.error('Failed to save report to DB:', saveError)
    }
    setSaving(false)
  }

  // ── GENERATE ────────────────────────────────────────────
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
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') { setDone(true); continue }
            try {
              const parsed = JSON.parse(payload)
              if (parsed.text) {
                rawRef.current += parsed.text
                setRawText(rawRef.current)
                setSections(parseSections(rawRef.current))
              }
            } catch { /* skip malformed chunks */ }
          }
        }
      }

      const finalSections = parseSections(rawRef.current)
      await saveReportToDb(finalSections)

    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setGenerating(false)
      setDone(true)
    }
  }

  // ── REGENERATE ──────────────────────────────────────────
  const handleRegenerate = async () => {
    if (userId) {
      await supabase
        .from('profiles')
        .update({ hd_report: null, hd_report_generated_at: null })
        .eq('id', userId)
    }
    setSections({})
    setRawText('')
    rawRef.current = ''
    setDone(false)
    setSavedAt(null)
    setError('')
  }

  // ── EXPORT PDF ──────────────────────────────────────────
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

  const hasReport   = Object.keys(sections).length > 0
  const missingData = !profile?.hd_type || !profile?.hd_authority || !profile?.hd_profile

  // ── LOADING STATE ───────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', paddingTop: 80, fontFamily: 'Cinzel, serif', color: 'rgba(167,139,250,0.4)', letterSpacing: '0.2em' }}>
          Loading your chart...
        </div>
      </Layout>
    )
  }

  // ── RENDER ──────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Your HD Report — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Cinzel:wght@400;500;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
        <style>{`
          @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          .report-section { animation: fadeUp 0.5s ease forwards; }
        `}</style>
      </Head>
      <Layout>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
            Your Personal Reading
          </p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 32, color: '#EDE9FE', letterSpacing: '0.05em' }}>
            Human Design Report
          </h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,0.55)', marginTop: 8 }}>
            Your complete reading, woven from the stars at the moment of your birth
          </p>

          {/* Saved badge */}
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

        {/* ── Profile Summary Strip ── */}
        {profile && (profile.hd_type || profile.hd_authority) && (
          <div style={{
            display: 'flex', gap: 28, flexWrap: 'wrap',
            background: 'rgba(45,27,105,0.2)', borderRadius: 12,
            padding: '20px 28px', marginBottom: 32,
            border: '1px solid rgba(123,79,212,0.2)',
          }}>
            {[
              { label: 'Type',              value: profile.hd_type,              color: '#A78BFA' },
              { label: 'Authority',         value: profile.hd_authority,          color: '#2DD4BF' },
              { label: 'Profile',           value: profile.hd_profile,            color: '#D4AF37' },
              { label: 'Definition',        value: profile.hd_definition,         color: '#F9A8D4' },
              { label: 'Incarnation Cross', value: profile.hd_incarnation_cross,  color: '#FCD34D' },
            ].filter(i => i.value).map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 9,
                  letterSpacing: '0.15em', color: 'rgba(167,139,250,0.45)',
                  textTransform: 'uppercase', marginBottom: 4,
                }}>
                  {item.label}
                </p>
                <p style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: item.label === 'Incarnation Cross' ? 11 : 14,
                  color: item.color,
                  maxWidth: item.label === 'Incarnation Cross' ? 180 : undefined,
                  lineHeight: 1.3,
                }}>
                  {item.value}
                </p>
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

        {/* ── Generate Button ── */}
        {!hasReport && !generating && (
          <div style={{ textAlign: 'center', padding: '40px 0 48px' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto 28px',
              background: 'radial-gradient(circle, rgba(123,79,212,0.25) 0%, transparent 70%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(123,79,212,0.2)', fontSize: 40,
            }}>✦</div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 20, color: 'rgba(196,181,253,0.6)', maxWidth: 480, margin: '0 auto 32px' }}>
              Luminary will weave your Type, Authority, Profile, Centers and Channels into a personalised, flowing reading — written just for you.
            </p>
            <button
              onClick={generateReport}
              disabled={missingData}
              className="btn-cosmic"
              style={{ fontSize: 14, padding: '16px 48px', opacity: missingData ? 0.4 : 1 }}
            >
              ✦ Generate My Report
            </button>
          </div>
        )}

        {/* ── Generating Indicator ── */}
        {generating && (
          <div style={{ textAlign: 'center', padding: '24px 0 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#A78BFA', animation: 'pulse 1.5s infinite' }} />
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: '0.2em', color: 'rgba(167,139,250,0.6)', textTransform: 'uppercase' }}>
                Generating Your Reading
              </p>
            </div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(167,139,250,0.5)' }}>
              Your reading is being assembled — most sections appear instantly...
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 }}>
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

        {/* ── Error ── */}
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#F87171' }}>{error}</p>
          </div>
        )}

        {/* ── Report Sections ── */}
        {(generating || hasReport) && (
          <div>
            {SECTIONS.map((section) => {
              const content = sections[section.key]
              if (!content && !generating) return null
              if (!content) {
                return <SkeletonCard key={section.key} label={section.label} icon={section.icon} color={section.color} />
              }
              const nextSectionIdx = SECTIONS.findIndex(s => s.key === section.key) + 1
              const nextSection    = SECTIONS[nextSectionIdx]
              const isCurrentlyStreaming = generating && nextSection && !sections[nextSection.key]
              return (
                <div key={section.key} className="report-section">
                  <SectionCard section={section} content={content} isStreaming={!!isCurrentlyStreaming} />
                </div>
              )
            })}

            {/* ── Completion Actions ── */}
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
                  {savedAt
                    ? 'Your reading is saved and will be here whenever you return.'
                    : 'Download your report as a beautifully formatted PDF, or come back to regenerate it any time.'}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
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

      </Layout>
    </>
  )
}
