import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import BodyGraph from '../../components/chart/BodyGraph'
import { supabase } from '../../lib/supabase'
import { HD_TYPES, HD_AUTHORITIES, HD_CENTERS, HD_PROFILES, GATES_64 } from '../../lib/hdData'
import { ALL_CHANNELS } from '../../lib/hdCalculator'
import type { Center } from '../../lib/hdCalculator'

const ALL_CENTER_NAMES: Center[] = [
  'Head', 'Ajna', 'Throat', 'G', 'Heart', 'Sacral', 'SolarPlexus', 'Spleen', 'Root',
]

const CENTER_DISPLAY_NAMES: Record<string, string> = {
  SolarPlexus: 'Solar Plexus',
  G: 'G Center',
}

function centerLabel(c: string) {
  return CENTER_DISPLAY_NAMES[c] ?? c
}

// ─────────────────────────────────────────────────────────────
// Frozen display field — read-only cosmetic input
// ─────────────────────────────────────────────────────────────
function FrozenField({ value }: { value: string }) {
  return (
    <div style={{
      background: 'rgba(15,10,46,0.5)',
      border: '1px solid rgba(167,139,250,0.1)',
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: 16,
      color: value === '—' ? 'rgba(167,139,250,0.3)' : '#EDE9FE',
      minHeight: 40,
      display: 'flex',
      alignItems: 'center',
    }}>
      {value}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Field label
// ─────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: 11,
      letterSpacing: '0.1em',
      color: 'rgba(167,139,250,0.5)',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 8,
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

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (data) {
        setProfile(data)
        setNotes(data.notes || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  // Save only the personal notes field
  const handleSave = async () => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase
      .from('profiles')
      .update({ notes })
      .eq('id', session.user.id)
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2500)
  }

  // Build chart data from profile for the report page
  const handleGenerateReport = () => {
    if (!profile) return
    const gates = (profile.active_gates || []).map(Number)
    const activeChannels = ALL_CHANNELS.filter(ch =>
      gates.includes(ch.gates[0]) && gates.includes(ch.gates[1])
    )
    const openCenters = ALL_CENTER_NAMES.filter(
      c => !(profile.defined_centers || []).includes(c)
    )
    const chartData = {
      type: profile.hd_type,
      authority: profile.hd_authority,
      profile: profile.hd_profile,
      definition: profile.hd_definition,
      incarnationCross: profile.hd_incarnation_cross,
      definedCenters: profile.defined_centers || [],
      openCenters,
      activeChannels,
      allGates: gates,
      allPersonalityGates: [],
      allDesignGates: [],
    }
    sessionStorage.setItem('luminary_chart_report', JSON.stringify(chartData))
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

  // Reconstruct chart structures from stored profile data
  const gates: number[] = (profile?.active_gates || []).map(Number)
  const uniqueGates = [...new Set(gates)].sort((a, b) => a - b)
  const definedCenters: string[] = profile?.defined_centers || []
  const openCenters = ALL_CENTER_NAMES.filter(c => !definedCenters.includes(c))
  const activeChannels = ALL_CHANNELS.filter(ch =>
    gates.includes(ch.gates[0]) && gates.includes(ch.gates[1])
  )

  // Partial HDChart object for BodyGraph component
  const chart = hasChart
    ? {
        type: profile.hd_type,
        authority: profile.hd_authority,
        profile: profile.hd_profile,
        definition: profile.hd_definition,
        incarnationCross: profile.hd_incarnation_cross,
        definedCenters: definedCenters as Center[],
        openCenters: openCenters as Center[],
        activeChannels,
        allGates: gates,
        allPersonalityGates: [] as number[],
        allDesignGates: [] as number[],
        personalityActivations: [],
      }
    : null

  const typeInfo = profile?.hd_type
    ? HD_TYPES[profile.hd_type as keyof typeof HD_TYPES]
    : null
  const profileInfo = profile?.hd_profile
    ? HD_PROFILES[profile.hd_profile as keyof typeof HD_PROFILES]
    : null

  // Friendly date display
  const birthDateDisplay = profile?.birth_date
    ? new Date(profile.birth_date + 'T12:00:00').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'

  return (
    <>
      <Head>
        <title>My Chart — Luminary</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Layout>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 36,
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: 11,
              letterSpacing: '0.15em', color: 'rgba(167,139,250,0.5)',
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Your Blueprint
            </p>
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 32, color: '#EDE9FE', letterSpacing: '0.05em' }}>
              My Human Design Chart
            </h1>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-cosmic">
            {saving ? 'Saving...' : saved ? '✓ Saved!' : '✦ Save Chart'}
          </button>
        </div>

        {/* ── No chart yet ───────────────────────────────────── */}
        {!hasChart && (
          <div className="glass" style={{
            padding: 32, marginBottom: 24,
            borderColor: 'rgba(212,175,55,0.3)',
            background: 'rgba(212,175,55,0.04)',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 16, color: '#D4AF37', marginBottom: 12 }}>
              ✦ No Chart Generated Yet
            </p>
            <p style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 17, color: 'rgba(196,181,253,0.7)', marginBottom: 20,
            }}>
              Go to the Chart Generator, enter your birth data, and click "Save to My Chart" to populate this page.
            </p>
            <button className="btn-cosmic" onClick={() => router.push('/chart')}>
              Go to Chart Generator →
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 1 — BIRTH DATA (read-only)
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{
            fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em',
            color: '#A78BFA', marginBottom: 24,
          }}>
            BIRTH DATA
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            <div>
              <FieldLabel>Your Name</FieldLabel>
              <FrozenField value={profile?.full_name || '—'} />
            </div>
            <div>
              <FieldLabel>Birth Date</FieldLabel>
              <FrozenField value={birthDateDisplay} />
            </div>
            <div>
              <FieldLabel>Birth Time</FieldLabel>
              <FrozenField value={profile?.birth_time || '—'} />
            </div>
            <div>
              <FieldLabel>Birth City</FieldLabel>
              <FrozenField value={profile?.birth_city || '—'} />
            </div>
            <div>
              <FieldLabel>Country</FieldLabel>
              <FrozenField value={profile?.birth_country || '—'} />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 2 — CORE DESIGN (read-only)
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{
            fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em',
            color: '#A78BFA', marginBottom: 24,
          }}>
            CORE DESIGN
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
            <div>
              <FieldLabel>Energy Type</FieldLabel>
              <FrozenField value={profile?.hd_type || '—'} />
            </div>
            <div>
              <FieldLabel>Inner Authority</FieldLabel>
              <FrozenField value={profile?.hd_authority || '—'} />
            </div>
            <div>
              <FieldLabel>Profile</FieldLabel>
              <FrozenField value={profile?.hd_profile || '—'} />
            </div>
            <div>
              <FieldLabel>Definition</FieldLabel>
              <FrozenField value={profile?.hd_definition || '—'} />
            </div>
            <div>
              <FieldLabel>Incarnation Cross</FieldLabel>
              <FrozenField value={profile?.hd_incarnation_cross || '—'} />
            </div>
          </div>

          {/* Contextual info cards for Type and Profile */}
          {(typeInfo || profileInfo) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

              {typeInfo && (
                <div style={{
                  background: 'rgba(123,79,212,0.1)', borderRadius: 12,
                  padding: '20px 24px', border: '1px solid rgba(123,79,212,0.25)',
                }}>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#A78BFA',
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
                  }}>
                    {profile.hd_type} · {typeInfo.population}
                  </p>
                  <p style={{
                    fontFamily: 'Cormorant Garamond, serif', fontSize: 17,
                    color: 'rgba(196,181,253,0.8)', lineHeight: 1.6, marginBottom: 16,
                  }}>
                    {typeInfo.description}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{
                      background: 'rgba(45,212,191,0.06)', borderRadius: 8,
                      padding: '12px 14px', border: '1px solid rgba(45,212,191,0.15)',
                    }}>
                      <span style={{
                        fontFamily: 'Inter, sans-serif', fontSize: 10,
                        color: 'rgba(45,212,191,0.6)', textTransform: 'uppercase',
                        letterSpacing: '0.08em', display: 'block', marginBottom: 4,
                      }}>
                        Strategy
                      </span>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#5EEAD4' }}>
                        {typeInfo.strategy}
                      </p>
                    </div>
                    <div style={{
                      background: 'rgba(248,113,113,0.06)', borderRadius: 8,
                      padding: '12px 14px', border: '1px solid rgba(248,113,113,0.15)',
                    }}>
                      <span style={{
                        fontFamily: 'Inter, sans-serif', fontSize: 10,
                        color: 'rgba(248,113,113,0.6)', textTransform: 'uppercase',
                        letterSpacing: '0.08em', display: 'block', marginBottom: 4,
                      }}>
                        Not-Self Theme
                      </span>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#F87171' }}>
                        {typeInfo.not_self_theme}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {profileInfo && (
                <div style={{
                  background: 'rgba(212,175,55,0.06)', borderRadius: 12,
                  padding: '20px 24px', border: '1px solid rgba(212,175,55,0.15)',
                }}>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(212,175,55,0.7)',
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
                  }}>
                    Profile {profile.hd_profile} · {profileInfo.name}
                  </p>
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#D4AF37', marginBottom: 10 }}>
                    {profileInfo.theme}
                  </p>
                  <p style={{
                    fontFamily: 'Cormorant Garamond, serif', fontSize: 17,
                    color: 'rgba(196,181,253,0.7)', lineHeight: 1.6,
                  }}>
                    {profileInfo.description}
                  </p>
                </div>
              )}

            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 3 — CENTERS (read-only with context)
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{
            fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em',
            color: '#A78BFA', marginBottom: 8,
          }}>
            CENTERS
          </h2>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            color: 'rgba(167,139,250,0.5)', fontSize: 16, marginBottom: 24,
          }}>
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
                    <span style={{
                      fontFamily: 'Cinzel, serif', fontSize: 14,
                      color: isDefined ? '#EDE9FE' : 'rgba(167,139,250,0.5)',
                    }}>
                      {centerLabel(center.name)}
                    </span>
                    <span className={`center-badge ${isDefined ? 'center-defined' : 'center-open'}`}>
                      {isDefined ? 'Defined' : 'Open'}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'Cormorant Garamond, serif', fontSize: 14, lineHeight: 1.5,
                    color: isDefined ? 'rgba(196,181,253,0.75)' : 'rgba(167,139,250,0.45)',
                  }}>
                    {isDefined ? center.defined_gift : center.open_gift}
                  </p>
                  {!isDefined && center.open_conditioning && (
                    <p style={{
                      fontFamily: 'Inter, sans-serif', fontSize: 11,
                      color: 'rgba(248,113,113,0.5)', marginTop: 8,
                      letterSpacing: '0.02em',
                    }}>
                      ⚠ Watch for: {center.open_conditioning}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 4 — ACTIVE GATES with context (read-only)
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{
            fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em',
            color: '#A78BFA', marginBottom: 8,
          }}>
            ACTIVE GATES
          </h2>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            color: 'rgba(167,139,250,0.5)', fontSize: 16, marginBottom: 20,
          }}>
            The gates active in your chart — each carrying a distinct archetypal energy from the 64 hexagrams.
          </p>

          {uniqueGates.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {uniqueGates.map(gNum => {
                const gateData = GATES_64[String(gNum)]
                return (
                  <div key={gNum} style={{
                    padding: '12px 16px', borderRadius: 10,
                    background: 'rgba(45,27,105,0.35)',
                    border: '1px solid rgba(123,79,212,0.2)',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}>
                    <span style={{
                      fontFamily: 'Cinzel, serif', fontSize: 22,
                      color: '#D4AF37', lineHeight: 1, minWidth: 30, paddingTop: 2,
                    }}>
                      {gNum}
                    </span>
                    <div>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: '#EDE9FE', marginBottom: 2 }}>
                        {gateData?.name || `Gate ${gNum}`}
                      </p>
                      <p style={{
                        fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                        fontSize: 13, color: 'rgba(212,175,55,0.6)',
                      }}>
                        {gateData?.keyword || ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 16, color: 'rgba(167,139,250,0.4)',
            }}>
              No active gates recorded. Generate and save your chart to populate this section.
            </p>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 5 — PERSONAL CHART NOTES (editable)
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{
            fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em',
            color: '#A78BFA', marginBottom: 16,
          }}>
            PERSONAL CHART NOTES
          </h2>
          <textarea
            className="textarea-cosmic"
            rows={6}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional notes about your chart, channels, splits, or things you want to remember..."
          />
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 6 — HD CHART VISUALIZATION
            Full read-only replica of Chart Generator output
        ══════════════════════════════════════════════════════ */}
        {hasChart && chart && (
          <div className="glass" style={{ padding: 32, marginBottom: 24 }}>

            {/* Sub-header with Generate Report button */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <h2 style={{
                  fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em',
                  color: '#A78BFA', marginBottom: 6,
                }}>
                  YOUR HD CHART
                </h2>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                  fontSize: 16, color: 'rgba(167,139,250,0.5)',
                }}>
                  Body graph, planet activations and channels from your saved chart
                </p>
              </div>
              <button className="btn-ghost" onClick={handleGenerateReport} style={{ fontSize: 12 }}>
                ✧ Generate Report
              </button>
            </div>

            {/* Key stats row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12, marginBottom: 24,
            }}>
              {[
                { label: 'Type',            value: chart.type,                         color: '#A78BFA' },
                { label: 'Authority',       value: chart.authority,                    color: '#A78BFA' },
                { label: 'Profile',         value: chart.profile,                      color: '#D4AF37' },
                { label: 'Definition',      value: chart.definition,                   color: '#2DD4BF' },
                { label: 'Defined Centers', value: `${chart.definedCenters.length} / 9`, color: '#A78BFA' },
                { label: 'Active Channels', value: String(activeChannels.length),      color: '#A78BFA' },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'rgba(45,27,105,0.3)', borderRadius: 10,
                  padding: '14px 16px', border: '1px solid rgba(123,79,212,0.2)',
                }}>
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'rgba(167,139,250,0.5)', marginBottom: 6,
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: item.color }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'graph',       label: '◎ Body Graph' },
                { id: 'activations', label: '⬡ Planet Activations' },
                { id: 'channels',    label: '◈ Active Channels' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{
                    padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontSize: 12, letterSpacing: '0.05em',
                    background: activeTab === tab.id ? 'rgba(123,79,212,0.35)' : 'rgba(26,10,62,0.5)',
                    border: `1px solid ${activeTab === tab.id ? 'rgba(123,79,212,0.6)' : 'rgba(167,139,250,0.12)'}`,
                    color: activeTab === tab.id ? '#EDE9FE' : 'rgba(167,139,250,0.5)',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Body Graph ── */}
            {activeTab === 'graph' && (
              <div className="glass" style={{ padding: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>

                  {/* SVG */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p style={{
                      fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.12em',
                      color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 16,
                    }}>
                      Body Graph
                    </p>
                    <div style={{
                      background: 'rgba(8,6,24,0.6)', borderRadius: 12,
                      padding: 20, border: '1px solid rgba(167,139,250,0.1)',
                    }}>
                      <BodyGraph chart={chart as any} size={380} />
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 8, background: '#7B4FD4', borderRadius: 2 }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.6)' }}>Defined</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 16, height: 8, background: 'transparent',
                          border: '1px solid rgba(167,139,250,0.3)', borderRadius: 2,
                        }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.6)' }}>Open</span>
                      </div>
                    </div>
                  </div>

                  {/* Centers list */}
                  <div>
                    <p style={{
                      fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.12em',
                      color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 16,
                    }}>
                      Centers
                    </p>
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
                              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#EDE9FE' }}>
                                {centerLabel(center)}
                              </span>
                              <p style={{
                                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                                fontSize: 13, color: 'rgba(167,139,250,0.5)', marginTop: 2,
                              }}>
                                {isDefined ? centerData?.defined_gift : centerData?.open_gift}
                              </p>
                            </div>
                            <span style={{
                              padding: '3px 10px', borderRadius: 20, fontSize: 11,
                              fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em',
                              flexShrink: 0, marginLeft: 12,
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

            {/* ── Tab: Planet Activations ── */}
            {activeTab === 'activations' && (
              <div className="glass" style={{ padding: 28 }}>
                {/* Info note about missing per-planet data */}
                <div style={{
                  background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: 10, padding: '14px 20px', marginBottom: 24,
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  <span style={{ color: '#D4AF37', fontSize: 16, flexShrink: 0 }}>⬡</span>
                  <p style={{
                    fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                    fontSize: 15, color: 'rgba(212,175,55,0.7)', lineHeight: 1.6,
                  }}>
                    Per-planet activation data is not stored when saving to My Chart. To see the full
                    planetary breakdown (Sun, Moon, Mercury etc.), re-run the{' '}
                    <a href="/chart" style={{ color: '#D4AF37', textDecoration: 'underline' }}>
                      HD Chart Generator
                    </a>.
                  </p>
                </div>

                {/* All active gates displayed with context */}
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em',
                  color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 16,
                }}>
                  All Active Gates · {uniqueGates.length} total
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {uniqueGates.map(g => {
                    const gd = GATES_64[String(g)]
                    return (
                      <div key={g} style={{
                        padding: '7px 14px', borderRadius: 8,
                        background: 'rgba(45,27,105,0.4)',
                        border: '1px solid rgba(123,79,212,0.25)',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: '#A78BFA' }}>
                          {g}
                        </span>
                        <span style={{
                          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                          fontSize: 13, color: 'rgba(196,181,253,0.5)',
                        }}>
                          {gd?.keyword || ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Tab: Active Channels ── */}
            {activeTab === 'channels' && (
              <div className="glass" style={{ padding: 28 }}>
                {activeChannels.length === 0 ? (
                  <p style={{
                    fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                    fontSize: 17, color: 'rgba(167,139,250,0.5)',
                    textAlign: 'center', padding: '32px 0',
                  }}>
                    No fully activated channels — this is common. Your hanging gates still carry significant energy.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {activeChannels.map(ch => (
                      <div
                        key={`${ch.gates[0]}-${ch.gates[1]}`}
                        style={{
                          padding: '18px 22px', borderRadius: 12,
                          background: 'rgba(123,79,212,0.1)',
                          border: '1px solid rgba(123,79,212,0.25)',
                          display: 'flex', alignItems: 'center', gap: 20,
                        }}
                      >
                        {/* Gate numbers */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 90 }}>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#A78BFA' }}>
                            {ch.gates[0]}
                          </span>
                          <span style={{ color: 'rgba(167,139,250,0.35)', fontSize: 18 }}>—</span>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#A78BFA' }}>
                            {ch.gates[1]}
                          </span>
                        </div>

                        {/* Channel info */}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#EDE9FE', marginBottom: 5 }}>
                            {ch.name}
                          </p>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{
                              fontFamily: 'Inter, sans-serif', fontSize: 10,
                              color: 'rgba(167,139,250,0.5)', letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                            }}>
                              {ch.type}
                            </span>
                            <span style={{ color: 'rgba(167,139,250,0.3)' }}>·</span>
                            <span style={{
                              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                              fontSize: 14, color: 'rgba(196,181,253,0.55)',
                            }}>
                              {centerLabel(ch.centers[0])} → {centerLabel(ch.centers[1])}
                            </span>
                          </div>
                          {/* Gate names */}
                          <p style={{
                            fontFamily: 'Cormorant Garamond, serif', fontSize: 13,
                            color: 'rgba(212,175,55,0.5)', marginTop: 4,
                          }}>
                            {GATES_64[String(ch.gates[0])]?.name} &amp; {GATES_64[String(ch.gates[1])]?.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ── Bottom save button ─────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 40 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-cosmic"
            style={{ padding: '14px 40px' }}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : '✦ Save Chart'}
          </button>
        </div>

      </Layout>
    </>
  )
}
