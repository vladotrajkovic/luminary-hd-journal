import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import BodyGraph from '../../components/chart/BodyGraph'
import { supabase } from '../../lib/supabase'
import { HD_TYPES, HD_CENTERS, HD_PROFILES, GATES_64 } from '../../lib/hdData'
import { ALL_CHANNELS } from '../../lib/hdCalculator'
import type { Center } from '../../lib/hdCalculator'

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const ALL_CENTER_NAMES: Center[] = [
  'Head', 'Ajna', 'Throat', 'G', 'Heart', 'Sacral', 'SolarPlexus', 'Spleen', 'Root',
]

const CENTER_DISPLAY_NAMES: Record<string, string> = {
  SolarPlexus: 'Solar Plexus',
  G: 'G Center',
}

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉', earth: '⊕', moon: '☽', northNode: '☊', southNode: '☋',
  mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃',
  saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
}

const PLANET_NAMES: Record<string, string> = {
  sun: 'Sun', earth: 'Earth', moon: 'Moon',
  northNode: 'North Node', southNode: 'South Node',
  mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus',
  neptune: 'Neptune', pluto: 'Pluto',
}

function centerLabel(c: string) {
  return CENTER_DISPLAY_NAMES[c] ?? c
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function FrozenField({ value }: { value: string }) {
  return (
    <div style={{
      background: 'rgba(15,10,46,0.5)',
      border: '1px solid rgba(167,139,250,0.1)',
      borderRadius: 8, padding: '10px 14px',
      fontFamily: 'Cormorant Garamond, serif', fontSize: 16,
      color: value === '—' ? 'rgba(167,139,250,0.3)' : '#EDE9FE',
      minHeight: 40, display: 'flex', alignItems: 'center',
    }}>
      {value}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontFamily: 'Inter, sans-serif', fontSize: 11,
      letterSpacing: '0.1em', color: 'rgba(167,139,250,0.5)',
      textTransform: 'uppercase' as const, display: 'block', marginBottom: 8,
    }}>
      {children}
    </label>
  )
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
export default function MyChart() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'graph' | 'activations' | 'channels'>('graph')
  const [expandedGate, setExpandedGate] = useState<number | null>(null)
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      const { data } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()
      if (data) { setProfile(data); setNotes(data.notes || '') }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('profiles').update({ notes }).eq('id', session.user.id)
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleGenerateReport = () => {
    if (!profile) return
    const gates = (profile.active_gates || []).map(Number)
    const activeChannels = ALL_CHANNELS.filter(ch =>
      gates.includes(ch.gates[0]) && gates.includes(ch.gates[1])
    )
    const openCenters = ALL_CENTER_NAMES.filter(c =>
      !(profile.defined_centers || []).includes(c))
    const pa: any[] = profile.planet_activations || []
    sessionStorage.setItem('luminary_chart_report', JSON.stringify({
      type: profile.hd_type, authority: profile.hd_authority,
      profile: profile.hd_profile, definition: profile.hd_definition,
      incarnationCross: profile.hd_incarnation_cross,
      definedCenters: profile.defined_centers || [], openCenters,
      activeChannels, allGates: gates,
      allPersonalityGates: pa.map((a: any) => a.personality?.gate).filter(Boolean),
      allDesignGates: pa.map((a: any) => a.design?.gate).filter(Boolean),
      personalityActivations: pa,
    }))
    router.push('/reports')
  }

  if (loading) {
    return (
      <Layout>
        <p style={{ color: 'rgba(196,181,253,0.5)', fontFamily: 'Cormorant Garamond, serif', padding: 40 }}>
          Loading your chart...
        </p>
      </Layout>
    )
  }

  const hasChart = !!(profile?.hd_type)
  const gates: number[] = (profile?.active_gates || []).map(Number)
  const uniqueGates = Array.from(new Set(gates)).sort((a, b) => a - b)
  const definedCenters: string[] = profile?.defined_centers || []
  const activeChannels = ALL_CHANNELS.filter(ch =>
    gates.includes(ch.gates[0]) && gates.includes(ch.gates[1])
  )
  const planetActivations: any[] = profile?.planet_activations || []
  const hasPlanetData = planetActivations.length > 0

  const chart = hasChart ? {
    type: profile.hd_type, authority: profile.hd_authority,
    profile: profile.hd_profile, definition: profile.hd_definition,
    incarnationCross: profile.hd_incarnation_cross,
    definedCenters: definedCenters as Center[],
    openCenters: ALL_CENTER_NAMES.filter(c => !definedCenters.includes(c)) as Center[],
    activeChannels, allGates: gates,
    allPersonalityGates: planetActivations.map((a: any) => a.personality?.gate).filter(Boolean) as number[],
    allDesignGates: planetActivations.map((a: any) => a.design?.gate).filter(Boolean) as number[],
    personalityActivations: planetActivations,
  } : null

  const typeInfo = profile?.hd_type ? HD_TYPES[profile.hd_type as keyof typeof HD_TYPES] : null
  const profileInfo = profile?.hd_profile ? HD_PROFILES[profile.hd_profile as keyof typeof HD_PROFILES] : null
  const birthDateDisplay = profile?.birth_date
    ? new Date(profile.birth_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <>
      <Head>
        <title>My Chart — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <Layout>

        {/* No chart banner */}
        {!hasChart && (
          <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: '24px 28px', marginBottom: 28 }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#D4AF37', marginBottom: 8 }}>
              Your chart has not been generated yet
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: 'rgba(212,175,55,0.7)', marginBottom: 16 }}>
              Visit the Chart Generator to calculate your Human Design chart from your birth data.
            </p>
            <button className="btn-cosmic" onClick={() => router.push('/chart')}>Go to Chart Generator →</button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 1 — BIRTH DATA
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 24 }}>BIRTH DATA</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            <div><FieldLabel>Your Name</FieldLabel><FrozenField value={profile?.full_name || '—'} /></div>
            <div><FieldLabel>Birth Date</FieldLabel><FrozenField value={birthDateDisplay} /></div>
            <div><FieldLabel>Birth Time</FieldLabel><FrozenField value={profile?.birth_time || '—'} /></div>
            <div><FieldLabel>Birth City</FieldLabel><FrozenField value={profile?.birth_city || '—'} /></div>
            <div><FieldLabel>Country</FieldLabel><FrozenField value={profile?.birth_country || '—'} /></div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 2 — CORE DESIGN
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 24 }}>CORE DESIGN</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
            <div><FieldLabel>Energy Type</FieldLabel><FrozenField value={profile?.hd_type || '—'} /></div>
            <div><FieldLabel>Inner Authority</FieldLabel><FrozenField value={profile?.hd_authority || '—'} /></div>
            <div><FieldLabel>Profile</FieldLabel><FrozenField value={profile?.hd_profile || '—'} /></div>
            <div><FieldLabel>Definition</FieldLabel><FrozenField value={profile?.hd_definition || '—'} /></div>
            <div><FieldLabel>Incarnation Cross</FieldLabel><FrozenField value={profile?.hd_incarnation_cross || '—'} /></div>
          </div>
          {(typeInfo || profileInfo) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {typeInfo && (
                <div style={{ background: 'rgba(123,79,212,0.1)', borderRadius: 12, padding: '20px 24px', border: '1px solid rgba(123,79,212,0.25)' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    {profile.hd_type} · {typeInfo.population}
                  </p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'rgba(196,181,253,0.8)', lineHeight: 1.6, marginBottom: 16 }}>
                    {typeInfo.description}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: 'rgba(45,212,191,0.06)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(45,212,191,0.15)' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(45,212,191,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Strategy</span>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#5EEAD4' }}>{typeInfo.strategy}</p>
                    </div>
                    <div style={{ background: 'rgba(248,113,113,0.06)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(248,113,113,0.15)' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(248,113,113,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Not-Self Theme</span>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#F87171' }}>{typeInfo.not_self_theme}</p>
                    </div>
                  </div>
                </div>
              )}
              {profileInfo && (
                <div style={{ background: 'rgba(212,175,55,0.06)', borderRadius: 12, padding: '20px 24px', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    Profile {profile.hd_profile} · {profileInfo.name}
                  </p>
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#D4AF37', marginBottom: 10 }}>{profileInfo.theme}</p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'rgba(196,181,253,0.7)', lineHeight: 1.6 }}>{profileInfo.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 3 — CENTERS
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 8 }}>CENTERS</h2>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(167,139,250,0.5)', fontSize: 16, marginBottom: 24 }}>
            Your defined and open centers — determined from your chart calculations.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {HD_CENTERS.map(center => {
              const isDefined = definedCenters.includes(center.name)
              return (
                <div key={center.name} style={{
                  padding: '16px 20px', borderRadius: 12,
                  background: isDefined ? 'rgba(123,79,212,0.12)' : 'rgba(15,10,46,0.5)',
                  border: `1px solid ${isDefined ? 'rgba(123,79,212,0.3)' : 'rgba(167,139,250,0.1)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: isDefined ? '#EDE9FE' : 'rgba(167,139,250,0.5)' }}>
                      {centerLabel(center.name)}
                    </span>
                    <span className={`center-badge ${isDefined ? 'center-defined' : 'center-open'}`}>
                      {isDefined ? 'Defined' : 'Open'}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14, lineHeight: 1.5, color: isDefined ? 'rgba(196,181,253,0.75)' : 'rgba(167,139,250,0.45)' }}>
                    {isDefined ? center.defined_gift : center.open_gift}
                  </p>
                  {!isDefined && center.open_conditioning && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(248,113,113,0.5)', marginTop: 8 }}>
                      ⚠ Watch for: {center.open_conditioning}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 4 — ACTIVE GATES with expand-on-click
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 8 }}>ACTIVE GATES</h2>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(167,139,250,0.5)', fontSize: 16, marginBottom: 20 }}>
            The gates active in your chart. Click any gate to see its full description, shadow, gift and siddhi.
          </p>
          {uniqueGates.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {uniqueGates.map(gNum => {
                const gateData = GATES_64[String(gNum)]
                const isExpanded = expandedGate === gNum
                return (
                  <div
                    key={gNum}
                    onClick={() => setExpandedGate(isExpanded ? null : gNum)}
                    style={{
                      padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                      background: isExpanded ? 'rgba(123,79,212,0.2)' : 'rgba(45,27,105,0.35)',
                      border: `1px solid ${isExpanded ? 'rgba(123,79,212,0.5)' : 'rgba(123,79,212,0.2)'}`,
                      transition: 'all 0.2s',
                      gridColumn: isExpanded ? 'span 2' : 'span 1',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#D4AF37', lineHeight: 1, minWidth: 30, paddingTop: 2, flexShrink: 0 }}>
                        {gNum}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: '#EDE9FE', marginBottom: 2 }}>
                          {gateData?.name || `Gate ${gNum}`}
                        </p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(212,175,55,0.6)' }}>
                          {gateData?.keyword || ''}
                        </p>
                      </div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(167,139,250,0.4)', flexShrink: 0, paddingTop: 4 }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                    {isExpanded && gateData && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(123,79,212,0.25)' }}>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: 'rgba(196,181,253,0.8)', lineHeight: 1.6, marginBottom: 16 }}>
                          {gateData.description}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                          {[
                            { label: 'Shadow', value: gateData.shadow, bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', labelColor: 'rgba(248,113,113,0.6)', valueColor: '#F87171' },
                            { label: 'Gift',   value: gateData.gift,   bg: 'rgba(45,212,191,0.08)',  border: 'rgba(45,212,191,0.2)',  labelColor: 'rgba(45,212,191,0.6)',  valueColor: '#5EEAD4' },
                            { label: 'Siddhi', value: gateData.siddhi, bg: 'rgba(212,175,55,0.08)',  border: 'rgba(212,175,55,0.2)',  labelColor: 'rgba(212,175,55,0.6)',  valueColor: '#D4AF37' },
                          ].map(({ label, value, bg, border, labelColor, valueColor }) => (
                            <div key={label} style={{ background: bg, borderRadius: 8, padding: '10px 12px', border: `1px solid ${border}` }}>
                              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>
                                {label}
                              </span>
                              <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: valueColor }}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: 'rgba(167,139,250,0.4)' }}>
              No active gates recorded. Generate and save your chart to populate this section.
            </p>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 5 — CHART TABS (Body Graph / Activations / Channels)
        ══════════════════════════════════════════════════════ */}
        {hasChart && chart && (
          <div className="glass" style={{ padding: 32, marginBottom: 24 }}>

            {/* Key stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Type',            value: chart.type,                           color: '#A78BFA' },
                { label: 'Authority',       value: chart.authority,                      color: '#A78BFA' },
                { label: 'Profile',         value: chart.profile,                        color: '#D4AF37' },
                { label: 'Definition',      value: chart.definition,                     color: '#2DD4BF' },
                { label: 'Defined Centers', value: `${chart.definedCenters.length} / 9`, color: '#A78BFA' },
                { label: 'Active Channels', value: String(chart.activeChannels.length),  color: '#A78BFA' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(45,27,105,0.3)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(123,79,212,0.2)' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.5)', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Generate Report button */}
            <div style={{ marginBottom: 24 }}>
              <button className="btn-ghost" onClick={handleGenerateReport} style={{ fontSize: 12 }}>
                ✧ Generate Full Report
              </button>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'graph',       label: '◎ Body Graph' },
                { id: 'activations', label: '⬡ Planet Activations' },
                { id: 'channels',    label: '◈ Active Channels' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} style={{
                  padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: 12, letterSpacing: '0.05em',
                  background: activeTab === tab.id ? 'rgba(123,79,212,0.35)' : 'rgba(26,10,62,0.5)',
                  border: `1px solid ${activeTab === tab.id ? 'rgba(123,79,212,0.6)' : 'rgba(167,139,250,0.12)'}`,
                  color: activeTab === tab.id ? '#EDE9FE' : 'rgba(167,139,250,0.5)',
                  transition: 'all 0.2s',
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Body Graph tab ── */}
            {activeTab === 'graph' && (
              <div className="glass" style={{ padding: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.12em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 16 }}>Body Graph</p>
                    <div style={{ background: 'rgba(8,6,24,0.6)', borderRadius: 12, padding: 20, border: '1px solid rgba(167,139,250,0.1)' }}>
                      <BodyGraph chart={chart as any} size={380} />
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 8, background: '#7B4FD4', borderRadius: 2 }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.6)' }}>Defined</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 8, background: 'transparent', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 2 }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.6)' }}>Open</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.12em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 16 }}>Centers</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {ALL_CENTER_NAMES.map(center => {
                        const isDefined = chart.definedCenters.includes(center)
                        const centerData = HD_CENTERS.find(c => c.name === center)
                        return (
                          <div key={center} style={{
                            padding: '12px 16px', borderRadius: 10,
                            background: isDefined ? 'rgba(123,79,212,0.2)' : 'rgba(45,212,191,0.06)',
                            border: `1px solid ${isDefined ? 'rgba(123,79,212,0.4)' : 'rgba(45,212,191,0.2)'}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}>
                            <div>
                              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#EDE9FE' }}>{centerLabel(center)}</span>
                              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(167,139,250,0.5)', marginTop: 2 }}>
                                {isDefined ? centerData?.defined_gift : centerData?.open_gift}
                              </p>
                            </div>
                            <span style={{
                              padding: '3px 10px', borderRadius: 20, fontSize: 11,
                              fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em', flexShrink: 0, marginLeft: 12,
                              background: isDefined ? 'rgba(123,79,212,0.3)' : 'rgba(45,212,191,0.1)',
                              border: `1px solid ${isDefined ? 'rgba(123,79,212,0.5)' : 'rgba(45,212,191,0.3)'}`,
                              color: isDefined ? '#C4B5FD' : '#5EEAD4',
                            }}>
                              {isDefined ? 'DEFINED' : 'OPEN'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Planet Activations tab ── */}
            {activeTab === 'activations' && (
              <div className="glass" style={{ padding: 28 }}>
                {hasPlanetData ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      {/* Personality column */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EDE9FE' }} />
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: '#EDE9FE', letterSpacing: '0.1em' }}>PERSONALITY</span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.45)' }}>(Conscious)</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {planetActivations.map((activation: any, i: number) => {
                            const pGate = GATES_64[String(activation.personality?.gate)]
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(45,27,105,0.3)', border: '1px solid rgba(123,79,212,0.15)' }}>
                                <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>
                                  {PLANET_SYMBOLS[activation.planet] || '·'}
                                </span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.5)', width: 80, flexShrink: 0 }}>
                                  {PLANET_NAMES[activation.planet] || activation.planet}
                                </span>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#EDE9FE' }}>{activation.personality?.gate}</span>
                                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.5)' }}>.{activation.personality?.line}</span>
                                  </div>
                                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(167,139,250,0.45)', marginTop: 2 }}>
                                    {pGate?.name || `Gate ${activation.personality?.gate}`}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Design column */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F87171' }} />
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: '#F87171', letterSpacing: '0.1em' }}>DESIGN</span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(248,113,113,0.45)' }}>(Unconscious)</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {planetActivations.map((activation: any, i: number) => {
                            const dGate = GATES_64[String(activation.design?.gate)]
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(45,27,105,0.3)', border: '1px solid rgba(123,79,212,0.15)' }}>
                                <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>
                                  {PLANET_SYMBOLS[activation.planet] || '·'}
                                </span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.5)', width: 80, flexShrink: 0 }}>
                                  {PLANET_NAMES[activation.planet] || activation.planet}
                                </span>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#F87171' }}>{activation.design?.gate}</span>
                                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(248,113,113,0.5)' }}>.{activation.design?.line}</span>
                                  </div>
                                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(248,113,113,0.35)', marginTop: 2 }}>
                                    {dGate?.name || `Gate ${activation.design?.gate}`}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(167,139,250,0.4)', marginTop: 16, textAlign: 'center' }}>
                      ✦ Planet line numbers may occasionally differ from other HD software by ±1 on boundary cases — your type, profile, channels and defined centers are unaffected.
                    </p>
                  </>
                ) : (
                  <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ color: '#D4AF37', fontSize: 16, flexShrink: 0 }}>⬡</span>
                    <div>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#D4AF37', marginBottom: 8 }}>Planet activation data not available</p>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(212,175,55,0.7)', lineHeight: 1.6 }}>
                        Your chart was saved before per-planet data was stored. Re-run the{' '}
                        <a href="/chart" style={{ color: '#D4AF37', textDecoration: 'underline' }}>HD Chart Generator</a>{' '}
                        and save again to unlock the full planetary breakdown.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Active Channels tab ── */}
            {activeTab === 'channels' && (
              <div className="glass" style={{ padding: 28 }}>
                {activeChannels.length === 0 ? (
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, color: 'rgba(167,139,250,0.5)', textAlign: 'center', padding: '32px 0' }}>
                    No fully activated channels — this is common. Your hanging gates still carry significant energy.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {activeChannels.map(ch => {
                      const g1 = GATES_64[String(ch.gates[0])]
                      const g2 = GATES_64[String(ch.gates[1])]
                      const channelKey = `${ch.gates[0]}-${ch.gates[1]}`
                      return (
                        <div key={channelKey} className="glass" style={{ padding: '20px 24px' }}>
                          {/* Channel header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                              <p style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: '#EDE9FE', marginBottom: 8 }}>{ch.name}</p>

                              {/* ── Teal pill badge with hover tooltip ── */}
                              <div
                                style={{ position: 'relative', display: 'inline-block' }}
                                onMouseEnter={() => setHoveredChannel(channelKey)}
                                onMouseLeave={() => setHoveredChannel(null)}
                              >
                                <span style={{
                                  fontFamily: 'Inter, sans-serif', fontSize: 10, padding: '3px 10px',
                                  background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)',
                                  borderRadius: 20, color: '#5EEAD4', letterSpacing: '0.05em',
                                  display: 'inline-block', cursor: 'default',
                                  borderBottom: ch.tooltip ? '1px dashed rgba(45,212,191,0.5)' : undefined,
                                }}>
                                  {centerLabel(ch.centers[0])} → {centerLabel(ch.centers[1])}
                                </span>

                                {hoveredChannel === channelKey && ch.tooltip && (
                                  <div style={{
                                    position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
                                    zIndex: 20,
                                    background: 'rgba(10,6,36,0.97)',
                                    border: '1px solid rgba(45,212,191,0.25)',
                                    borderRadius: 10, padding: '12px 16px',
                                    width: 300,
                                    backdropFilter: 'blur(16px)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                    pointerEvents: 'none',
                                  }}>
                                    <p style={{
                                      fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                                      fontSize: 14, color: 'rgba(196,181,253,0.9)', lineHeight: 1.7, margin: 0,
                                    }}>
                                      {ch.tooltip}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <span style={{
                              padding: '4px 12px', borderRadius: 20,
                              fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                              background: 'rgba(123,79,212,0.2)', border: '1px solid rgba(123,79,212,0.35)', color: '#A78BFA', flexShrink: 0,
                            }}>
                              {ch.type}
                            </span>
                          </div>

                          {/* Two gate cards */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[{ gate: ch.gates[0], data: g1 }, { gate: ch.gates[1], data: g2 }].map(({ gate, data }) => (
                              <div key={gate} style={{ background: 'rgba(45,27,105,0.3)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(123,79,212,0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#A78BFA' }}>{gate}</span>
                                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(167,139,250,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gate</span>
                                </div>
                                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: '#EDE9FE', marginBottom: 4 }}>{data?.name || `Gate ${gate}`}</p>
                                {data?.keyword && (
                                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(212,175,55,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                    {data.keyword}
                                  </p>
                                )}
                                {data?.description && (
                                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(167,139,250,0.45)', lineHeight: 1.5 }}>
                                    {data.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 6 — NOTES
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 8 }}>PERSONAL NOTES</h2>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(167,139,250,0.5)', fontSize: 16, marginBottom: 16 }}>
            Your private space to reflect on your chart — experiments, insights, observations.
          </p>
          <textarea
            className="input-cosmic"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Write your reflections here..."
            rows={6}
            style={{ width: '100%', resize: 'vertical', marginBottom: 16 }}
          />
          <button
            className="btn-cosmic"
            onClick={handleSave}
            disabled={saving}
            style={{ fontSize: 13 }}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : '✦ Save Notes'}
          </button>
        </div>

      </Layout>
    </>
  )
}
