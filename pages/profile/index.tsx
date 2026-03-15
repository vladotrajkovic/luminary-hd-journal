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

// Map internal Center keys → display names
const CENTER_DISPLAY_NAMES: Record<string, string> = {
  SolarPlexus: 'Solar Plexus',
  G: 'G Center',
}

// FIX: Map HD_CENTERS display names → internal Center keys (for isDefined comparison)
// HD_CENTERS uses display names but the DB stores internal keys
const CENTER_NAME_TO_KEY: Record<string, string> = {
  'Solar Plexus': 'SolarPlexus',
  'G Center': 'G',
  'Heart/Ego': 'Heart',   // HD_CENTERS calls it Heart/Ego; DB stores 'Heart'
}

// Short descriptions for each center-pair connection, shown on hover in Active Channels
// Covers all 36 channels across all circuits (Integration, Centering, Knowing, Sensing,
// Logic, Tribal, Individual)
const CENTER_PAIR_DESCRIPTIONS: Record<string, string> = {
  'G-Spleen':           'Identity & survival intuition — knowing who you are through bodily instinct',
  'Spleen-G':           'Identity & survival intuition — knowing who you are through bodily instinct',
  'Sacral-Spleen':      'Life force & immune awareness — sustainable vitality guided by the body',
  'Spleen-Sacral':      'Life force & immune awareness — sustainable vitality guided by the body',
  'G-Throat':           'Identity expressing itself — direction and love finding its voice',
  'Throat-G':           'Identity expressing itself — direction and love finding its voice',
  'Sacral-Throat':      'Life force manifesting — raw energy channelled directly into action',
  'Throat-Sacral':      'Life force manifesting — raw energy channelled directly into action',
  'G-Heart':            'Identity & willpower — sense of self backed by consistent ego energy',
  'Heart-G':            'Identity & willpower — sense of self backed by consistent ego energy',
  'Sacral-G':           'Life force anchored in self — sustainable energy with a clear sense of direction',
  'G-Sacral':           'Life force anchored in self — sustainable energy with a clear sense of direction',
  'Head-Ajna':          'Mental pressure finding form — inspiration becoming conceptual certainty',
  'Ajna-Head':          'Mental pressure finding form — inspiration becoming conceptual certainty',
  'Ajna-Throat':        'Mind speaking — processed thought ready to be communicated',
  'Throat-Ajna':        'Mind speaking — processed thought ready to be communicated',
  'Throat-Heart':       'Will expressing — ego-driven communication and manifestation',
  'Heart-Throat':       'Will expressing — ego-driven communication and manifestation',
  'Throat-SolarPlexus': 'Emotional truth finding voice — feelings that need time before speaking',
  'SolarPlexus-Throat': 'Emotional truth finding voice — feelings that need time before speaking',
  'Throat-Spleen':      'Intuitive voice — spontaneous knowing that speaks in the moment',
  'Spleen-Throat':      'Intuitive voice — spontaneous knowing that speaks in the moment',
  'Sacral-Root':        'Drive powering life force — root pressure fuelling sustained energy',
  'Root-Sacral':        'Drive powering life force — root pressure fuelling sustained energy',
  'Sacral-SolarPlexus': 'Life force & emotional depth — passion and feeling entwined',
  'SolarPlexus-Sacral': 'Life force & emotional depth — passion and feeling entwined',
  'Spleen-Root':        'Survival under pressure — instinct and adrenaline working together',
  'Root-Spleen':        'Survival under pressure — instinct and adrenaline working together',
  'Heart-Spleen':       'Willpower & immune resilience — ego strength expressed through healthy boundaries',
  'Spleen-Heart':       'Willpower & immune resilience — ego strength expressed through healthy boundaries',
  'SolarPlexus-Heart':  'Emotional willpower — feeling and ego fused into tribal bonding',
  'Heart-SolarPlexus':  'Emotional willpower — feeling and ego fused into tribal bonding',
  'SolarPlexus-Root':   'Emotional pressure — root urgency feeding the emotional wave',
  'Root-SolarPlexus':   'Emotional pressure — root urgency feeding the emotional wave',
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
  // Tooltip state for Active Gates hover
  const [hoveredGate, setHoveredGate] = useState<number | null>(null)
  // Tooltip state for Active Channels center label hover
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

    // Initial load
    load()

    // Re-fetch every time the user navigates to this page,
    // including after saving a new chart from the Chart Generator.
    const handleRouteChange = (url: string) => {
      if (url.startsWith('/profile')) load()
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Required by HDChart type — not stored on profile, default to 0
    birthJD: 0, designJD: 0, sunLongitudePersonality: 0, sunLongitudeDesign: 0,
  } : null

  const typeInfo = profile?.hd_type ? HD_TYPES[profile.hd_type as keyof typeof HD_TYPES] : null
  const profileInfo = profile?.hd_profile ? HD_PROFILES[profile.hd_profile as keyof typeof HD_PROFILES] : null
  const birthDateDisplay = profile?.birth_date
    ? new Date(profile.birth_date + 'T12:00:00').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'

  return (
    <>
      <Head>
        <title>My Chart — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <Layout>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
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

        {/* ── No chart yet ── */}
        {!hasChart && (
          <div className="glass" style={{ padding: 32, marginBottom: 24, borderColor: 'rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.04)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 16, color: '#D4AF37', marginBottom: 12 }}>✦ No Chart Generated Yet</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, color: 'rgba(196,181,253,0.7)', marginBottom: 20 }}>
              Go to the Chart Generator, enter your birth data, and click "Save to My Chart" to populate this page.
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
            FIX: use CENTER_NAME_TO_KEY to normalise HD_CENTERS display
            names (e.g. 'Solar Plexus') to internal keys ('SolarPlexus')
            before comparing against the definedCenters array from the DB.
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 8 }}>CENTERS</h2>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(167,139,250,0.5)', fontSize: 16, marginBottom: 24 }}>
            Your defined and open centers — determined from your chart calculations.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {HD_CENTERS.map(center => {
              // Normalise display name to internal key before comparing
              const centerKey = CENTER_NAME_TO_KEY[center.name] ?? center.name
              const isDefined = definedCenters.includes(centerKey)
              return (
                <div key={center.name} style={{
                  padding: '16px 20px', borderRadius: 12,
                  background: isDefined ? 'rgba(123,79,212,0.12)' : 'rgba(15,10,46,0.5)',
                  border: `1px solid ${isDefined ? 'rgba(123,79,212,0.3)' : 'rgba(167,139,250,0.1)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: isDefined ? '#EDE9FE' : 'rgba(167,139,250,0.5)' }}>
                      {center.name}
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
            CHANGES:
            - keyword font: 13 → 15
            - expanded description font: 15 → 17
            - tooltip "Click for More Details" on hover (collapsed only)
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
                    onMouseEnter={() => { if (!isExpanded) setHoveredGate(gNum) }}
                    onMouseLeave={() => setHoveredGate(null)}
                    style={{
                      position: 'relative',
                      padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                      background: isExpanded ? 'rgba(123,79,212,0.2)' : 'rgba(45,27,105,0.35)',
                      border: `1px solid ${isExpanded ? 'rgba(123,79,212,0.5)' : 'rgba(123,79,212,0.2)'}`,
                      transition: 'all 0.2s',
                      gridColumn: isExpanded ? 'span 2' : 'span 1',
                    }}
                  >
                    {/* Tooltip — only shown when collapsed and hovered */}
                    {hoveredGate === gNum && !isExpanded && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(15,8,40,0.96)',
                        border: '1px solid rgba(167,139,250,0.3)',
                        borderRadius: 6,
                        padding: '5px 12px',
                        marginBottom: 6,
                        fontSize: 11,
                        fontFamily: 'Inter, sans-serif',
                        color: '#C4B5FD',
                        whiteSpace: 'nowrap',
                        zIndex: 20,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                        pointerEvents: 'none',
                        letterSpacing: '0.04em',
                      }}>
                        Click for More Details
                        {/* Small arrow */}
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0, height: 0,
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderTop: '5px solid rgba(167,139,250,0.3)',
                        }} />
                      </div>
                    )}

                    {/* Always-visible header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#D4AF37', lineHeight: 1, minWidth: 30, paddingTop: 2, flexShrink: 0 }}>
                        {gNum}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: '#EDE9FE', marginBottom: 2 }}>
                          {gateData?.name || `Gate ${gNum}`}
                        </p>
                        {/* FONT BUMP: keyword 13 → 15 */}
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(212,175,55,0.6)' }}>
                          {gateData?.keyword || ''}
                        </p>
                      </div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(167,139,250,0.4)', flexShrink: 0, paddingTop: 4 }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && gateData && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(123,79,212,0.25)' }}>
                        {/* FONT BUMP: description 15 → 17 */}
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'rgba(196,181,253,0.8)', lineHeight: 1.6, marginBottom: 16 }}>
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
            SECTION 5 — PERSONAL CHART NOTES (editable)
        ══════════════════════════════════════════════════════ */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 16 }}>PERSONAL CHART NOTES</h2>
          <textarea
            className="textarea-cosmic" rows={6} value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional notes about your chart, channels, splits, or things you want to remember..."
          />
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 6 — HD CHART VISUALIZATION
        ══════════════════════════════════════════════════════ */}
        {hasChart && chart && (
          <div className="glass" style={{ padding: 32, marginBottom: 24 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 6 }}>YOUR HD CHART</h2>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: 'rgba(167,139,250,0.5)' }}>
                  Body graph, planet activations and channels from your saved chart
                </p>
              </div>
              <button className="btn-ghost" onClick={handleGenerateReport} style={{ fontSize: 12 }}>
                ✧ Generate Report
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Type',            value: chart.type,                           color: '#A78BFA' },
                { label: 'Authority',       value: chart.authority,                      color: '#A78BFA' },
                { label: 'Profile',         value: chart.profile,                        color: '#D4AF37' },
                { label: 'Definition',      value: chart.definition,                     color: '#2DD4BF' },
                { label: 'Defined Centers', value: `${chart.definedCenters.length} / 9`, color: '#A78BFA' },
                { label: 'Active Channels', value: String(activeChannels.length),        color: '#A78BFA' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(45,27,105,0.3)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(123,79,212,0.2)' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.5)', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: item.color }}>{item.value}</div>
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
                  {/* Left: SVG + legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.12em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 16 }}>
                      Body Graph
                    </p>
                    <div style={{ background: 'rgba(8,6,24,0.6)', borderRadius: 12, padding: 20, border: '1px solid rgba(167,139,250,0.1)' }}>
                      <BodyGraph chart={chart} size={380} />
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

                  {/* Right: Centers list */}
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.12em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 16 }}>
                      Centers
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {ALL_CENTER_NAMES.map(center => {
                        const isDefined = definedCenters.includes(center)
                        // Build a nice display name for this internal key
                        const displayName = CENTER_DISPLAY_NAMES[center] ?? center
                        return (
                          <div key={center} style={{
                            padding: '12px 16px', borderRadius: 10,
                            background: isDefined ? 'rgba(123,79,212,0.2)' : 'rgba(45,212,191,0.06)',
                            border: `1px solid ${isDefined ? 'rgba(123,79,212,0.4)' : 'rgba(45,212,191,0.2)'}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}>
                            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: isDefined ? '#EDE9FE' : 'rgba(167,139,250,0.5)' }}>
                              {displayName}
                            </span>
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
                {!hasPlanetData ? (
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
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      {/* Header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, padding: '8px 16px', borderBottom: '1px solid rgba(167,139,250,.1)', gridColumn: 'span 2' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(167,139,250,.5)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Planet</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#A78BFA', letterSpacing: '.1em', textTransform: 'uppercase' }}>Personality (Conscious)</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#F87171', letterSpacing: '.1em', textTransform: 'uppercase' }}>Design (Unconscious)</span>
                      </div>

                      {planetActivations.map(activation => {
                        const pGate = GATES_64[String(activation.personality?.gate)]
                        const dGate = GATES_64[String(activation.design?.gate)]
                        return (
                          <div key={activation.planet} style={{
                            display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8,
                            padding: '12px 16px', borderBottom: '1px solid rgba(167,139,250,.06)',
                            gridColumn: 'span 2', transition: 'background .2s'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 18, opacity: .8 }}>{PLANET_SYMBOLS[activation.planet]}</span>
                              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: 'rgba(196,181,253,.7)' }}>
                                {PLANET_NAMES[activation.planet]}
                              </span>
                            </div>
                            {/* Personality */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#A78BFA' }}>
                                  {activation.personality?.gate}
                                </span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,.5)' }}>
                                  .{activation.personality?.line}
                                </span>
                              </div>
                              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(167,139,250,0.45)', marginTop: 2 }}>
                                {pGate?.name || `Gate ${activation.personality?.gate}`}
                              </div>
                            </div>
                            {/* Design */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#F87171' }}>{activation.design?.gate}</span>
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
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(167,139,250,0.4)', marginTop: 16, textAlign: 'center' }}>
                      ✦ Planet line numbers may occasionally differ from other HD software by ±1 on boundary cases — your type, profile, channels and defined centers are unaffected.
                    </p>
                  </>
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
                      const centerPairKey = `${ch.centers[0]}-${ch.centers[1]}`
                      const centerTooltip = CENTER_PAIR_DESCRIPTIONS[centerPairKey] || ''
                      return (
                        <div key={channelKey} className="glass" style={{ padding: '20px 24px' }}>
                          {/* Channel header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                              <p style={{ fontFamily: 'Cinzel, serif', fontSize: 17, color: '#EDE9FE', marginBottom: 8 }}>{ch.name}</p>
                              {/* Teal pill badge — matches Chart Generator style. Hover shows center description. */}
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span
                                  onMouseEnter={() => setHoveredChannel(channelKey)}
                                  onMouseLeave={() => setHoveredChannel(null)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    fontFamily: 'Inter, sans-serif', fontSize: 10, padding: '3px 10px',
                                    background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)',
                                    borderRadius: 20, color: '#5EEAD4', letterSpacing: '0.05em',
                                    cursor: 'help',
                                  }}
                                >
                                  {centerLabel(ch.centers[0])} → {centerLabel(ch.centers[1])}
                                  <span style={{ fontSize: 11, opacity: 0.7, lineHeight: 1 }}>ⓘ</span>
                                </span>
                                {/* Hover tooltip with center connection description */}
                                {hoveredChannel === channelKey && (
                                  <div style={{
                                    position: 'absolute',
                                    bottom: 'calc(100% + 8px)',
                                    left: 0,
                                    background: 'rgba(8,6,24,0.97)',
                                    border: '1px solid rgba(45,212,191,0.25)',
                                    borderRadius: 8,
                                    padding: '10px 14px',
                                    width: 300,
                                    zIndex: 30,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                                    pointerEvents: 'none',
                                  }}>
                                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#5EEAD4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                      {centerLabel(ch.centers[0])} → {centerLabel(ch.centers[1])}
                                    </p>
                                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,0.9)', lineHeight: 1.5 }}>
                                      {centerTooltip || `${centerLabel(ch.centers[0])} and ${centerLabel(ch.centers[1])} working in unified definition`}
                                    </p>
                                    {/* Arrow */}
                                    <div style={{
                                      position: 'absolute', top: '100%', left: 20,
                                      width: 0, height: 0,
                                      borderLeft: '5px solid transparent',
                                      borderRight: '5px solid transparent',
                                      borderTop: '5px solid rgba(45,212,191,0.25)',
                                    }} />
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
                                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#EDE9FE', marginBottom: 4 }}>{data?.name || `Gate ${gate}`}</p>
                                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, color: 'rgba(167,139,250,0.45)', marginBottom: data?.description ? 8 : 0 }}>
                                  {data?.keyword || ''}
                                </p>
                                {data?.description && (
                                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'rgba(196,181,253,0.5)', lineHeight: 1.5 }}>
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
      </Layout>
    </>
  )
}
