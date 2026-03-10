import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import BodyGraph from '../../components/chart/BodyGraph'
import { supabase } from '../../lib/supabase'
import { HDChart, ALL_CHANNELS, CENTER_GATES, getIncarnationCross } from '../../lib/hdCalculator'
import { HD_TYPES, HD_AUTHORITIES, GATES_64 } from '../../lib/hdData'
import type { Center } from '../../lib/hdCalculator'

// Build a full HDChart from API-returned planet activations
function buildChartFromActivations(activations: any[]): HDChart {
  const personalityGates = activations.map((a: any) => a.personality.gate)
  const designGates = activations.map((a: any) => a.design.gate)
  const allGates = Array.from(new Set([...personalityGates, ...designGates]))

  // Find active channels (both gates present)
  const activeChannels = ALL_CHANNELS.filter(ch =>
    allGates.includes(ch.gates[0]) && allGates.includes(ch.gates[1])
  )

  // Defined centers: any center with a complete channel
  const definedSet = new Set<Center>()
  for (const ch of activeChannels) {
    definedSet.add(ch.centers[0])
    definedSet.add(ch.centers[1])
  }
  const definedCenters = Array.from(definedSet)
  const allCenters: Center[] = ['Head','Ajna','Throat','G','Heart','Sacral','SolarPlexus','Spleen','Root']
  const openCenters = allCenters.filter(c => !definedCenters.includes(c))

  // Build connectivity graph (needed for type AND definition)
  const graph: Record<string, Set<string>> = {}
  definedCenters.forEach(c => { graph[c] = new Set() })
  activeChannels.forEach(ch => {
    const [c1, c2] = ch.centers
    if (definedCenters.includes(c1) && definedCenters.includes(c2)) {
      graph[c1]?.add(c2); graph[c2]?.add(c1)
    }
  })

  // Find connected components and assign each center to a component id
  const componentId: Record<string, number> = {}
  let components = 0
  definedCenters.forEach(c => {
    if (!(c in componentId)) {
      const q = [c]
      while (q.length) {
        const n = q.shift()!
        if (n in componentId) continue
        componentId[n] = components
        graph[n]?.forEach(nb => { if (!(nb in componentId)) q.push(nb as Center) })
      }
      components++
    }
  })

  // Type — "motor connected to Throat" means Throat is in the SAME component as a motor
  // Motors: Sacral, Heart, SolarPlexus, Root
  const MOTORS: Center[] = ['Sacral', 'Heart', 'SolarPlexus', 'Root']
  const hasSacral = definedCenters.includes('Sacral')
  const hasThroat = definedCenters.includes('Throat')
  const throatComp = componentId['Throat'] ?? -1
  const motorToThroat = hasThroat && MOTORS.some(m =>
    definedCenters.includes(m) && componentId[m] === throatComp
  )

  let type: string
  if (definedCenters.length === 0) type = 'Reflector'
  else if (hasSacral && motorToThroat) type = 'Manifesting Generator'
  else if (hasSacral) type = 'Generator'
  else if (!hasSacral && motorToThroat) type = 'Manifestor'
  else type = 'Projector'

  // Authority
  let authority: string
  if (type === 'Reflector') authority = 'Lunar'
  else if (definedCenters.includes('SolarPlexus')) authority = 'Emotional/Solar Plexus'
  else if (definedCenters.includes('Sacral')) authority = 'Sacral'
  else if (definedCenters.includes('Spleen')) authority = 'Splenic'
  else if (definedCenters.includes('Heart')) authority = 'Ego/Heart'
  else if (definedCenters.includes('G')) authority = 'G Center/Self'
  else authority = 'Mental/Environment'

  // Profile from sun activations
  const sunAct = activations.find((a: any) => a.planet === 'sun')
  const profile = sunAct ? `${sunAct.personality.line}/${sunAct.design.line}` : '?/?'

  // Definition
  let definition: string
  if (definedCenters.length === 0) definition = 'No Definition (Reflector)'
  else if (components === 1) definition = 'Single Definition'
  else if (components === 2) definition = 'Split Definition'
  else if (components === 3) definition = 'Triple Split'
  else definition = 'Quadruple Split'

  // Incarnation cross
  const pSun   = activations.find((a: any) => a.planet === 'sun')
  const pEarth = activations.find((a: any) => a.planet === 'earth')
  const dSun   = activations.find((a: any) => a.planet === 'sun')
  const dEarth = activations.find((a: any) => a.planet === 'earth')
  const pSunGate   = pSun?.personality?.gate ?? 0
  const pEarthGate = pEarth?.personality?.gate ?? 0
  const dSunGate   = dSun?.design?.gate ?? 0
  const dEarthGate = dEarth?.design?.gate ?? 0
  const incarnationCross = getIncarnationCross(pSunGate, pEarthGate, dSunGate, dEarthGate)

  return {
    type, authority, profile, definition, incarnationCross,
    personalityActivations: activations,
    allPersonalityGates: personalityGates,
    allDesignGates: designGates,
    allGates,
    activeChannels,
    definedCenters,
    openCenters,
    birthJD: 0,
    designJD: 0,
    sunLongitudePersonality: sunAct?.personality?.longitude ?? 0,
    sunLongitudeDesign: sunAct?.design?.longitude ?? 0,
  }
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

export default function ChartGenerator() {
  const router = useRouter()
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [placeResults, setPlaceResults] = useState<any[]>([])
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; city: string; country: string; timezone: string; lat: number; lon: number } | null>(null)
  const [searchingPlace, setSearchingPlace] = useState(false)
  const [chart, setChart] = useState<HDChart | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'graph' | 'activations' | 'channels'>('graph')
  const [calculating, setCalculating] = useState(false)
  const [calcError, setCalcError] = useState('')
  const [profileOverride, setProfileOverride] = useState('')
  const searchTimeout = useRef<any>(null)

  // Search cities using Open-Meteo geocoding (free, no API key)
  const searchPlace = async (query: string) => {
    if (query.length < 2) { setPlaceResults([]); return }
    setSearchingPlace(true)
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`)
      const data = await res.json()
      setPlaceResults(data.results || [])
    } catch {
      setPlaceResults([])
    }
    setSearchingPlace(false)
  }

  const handlePlaceInput = (val: string) => {
    setBirthPlace(val)
    setSelectedPlace(null)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchPlace(val), 350)
  }

  const selectPlace = (place: any) => {
    const timezone = place.timezone || 'UTC'
    setSelectedPlace({ name: `${place.name}, ${place.country}`, city: place.name, country: place.country, timezone, lat: place.latitude, lon: place.longitude })
    setBirthPlace(`${place.name}, ${place.country}`)
    setPlaceResults([])
  }

  const handleCalculate = async () => {
    if (!birthDate) return
    if (!selectedPlace) {
      setCalcError('Please select a birth city from the dropdown to ensure accurate timezone calculation.')
      return
    }
    setCalculating(true)
    setCalcError('')
    try {
      const res = await fetch('/api/chart-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate,
          birthTime: birthTime || '12:00',
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lon,
          timezone: selectedPlace.timezone,
          city: selectedPlace.name,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Calculation failed')

      // Build HDChart from API activations
      const result = buildChartFromActivations(data.activations)
      setChart(result)
      setActiveTab('graph')
    } catch (err: any) {
      setCalcError(err.message || 'Failed to calculate chart. Please try again.')
    } finally {
      setCalculating(false)
    }
  }

  const handleSaveToProfile = async () => {
    if (!chart) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('profiles').update({
      hd_type: chart.type,
      hd_authority: chart.authority,
      hd_profile: profileOverride || chart.profile,
      hd_definition: chart.definition,
      hd_incarnation_cross: chart.incarnationCross,
      defined_centers: chart.definedCenters,
      active_gates: chart.allGates.map(String),
      birth_date: birthDate,
      birth_time: birthTime || null,
      birth_place: selectedPlace?.name || birthPlace || null,
      birth_city: selectedPlace?.city || null,
      birth_country: selectedPlace?.country || null,
    }).eq('id', session.user.id)

    setSaved(true)
    setSaving(false)
    setTimeout(() => router.push('/profile'), 1500)
  }

  // ── NEW: Navigate to report page with chart data ──────────
  const handleGenerateReport = () => {
    if (!chart) return
    sessionStorage.setItem('luminary_chart_report', JSON.stringify(chart))
    router.push('/reports')
  }

  const typeInfo = chart ? HD_TYPES[chart.type as keyof typeof HD_TYPES] : null

  return (
    <>
      <Head>
        <title>Chart Generator — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cinzel:wght@400;500;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <Layout>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '.15em', color: 'rgba(167,139,250,.5)', textTransform: 'uppercase', marginBottom: 8 }}>
            Astronomical Calculation
          </p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 32, color: '#EDE9FE', letterSpacing: '.05em' }}>
            HD Chart Generator
          </h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, color: 'rgba(196,181,253,.55)', marginTop: 8 }}>
            Enter your birth data to calculate your precise Human Design chart using full planetary ephemeris
          </p>
        </div>

        {/* Birth Data Input */}
        <div className="glass" style={{ padding: 32, marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '.1em', color: 'rgba(167,139,250,.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Birth Date *
              </label>
              <input
                type="date"
                className="input-cosmic"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '.1em', color: 'rgba(167,139,250,.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Birth Time (Local) *
              </label>
              <input
                type="time"
                className="input-cosmic"
                value={birthTime}
                onChange={e => setBirthTime(e.target.value)}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '.1em', color: 'rgba(167,139,250,.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Birth City *
              </label>
              <input
                type="text"
                className="input-cosmic"
                placeholder="e.g. London, New York..."
                value={birthPlace}
                onChange={e => handlePlaceInput(e.target.value)}
              />
              {/* Autocomplete dropdown */}
              {placeResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'rgba(15,10,46,0.97)', border: '1px solid rgba(123,79,212,.4)',
                  borderRadius: 8, marginTop: 4, overflow: 'hidden',
                  backdropFilter: 'blur(12px)'
                }}>
                  {placeResults.map((place, i) => (
                    <button
                      key={i}
                      onClick={() => selectPlace(place)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 16px', background: 'none', border: 'none',
                        cursor: 'pointer', borderBottom: '1px solid rgba(167,139,250,.08)',
                        transition: 'background .15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(123,79,212,.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#EDE9FE' }}>
                        {place.name}
                      </span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,.5)', marginLeft: 8 }}>
                        {place.admin1 ? `${place.admin1}, ` : ''}{place.country}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {searchingPlace && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,.4)', marginTop: 6 }}>
                  Searching...
                </p>
              )}
              {selectedPlace && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#2DD4BF', marginTop: 6 }}>
                  ✓ {selectedPlace.timezone}
                </p>
              )}
            </div>
          </div>

          {calcError && (
            <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 10, padding: '12px 18px', marginBottom: 16 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#F87171' }}>{calcError}</p>
            </div>
          )}
          <button
            className="btn-cosmic"
            onClick={handleCalculate}
            disabled={!birthDate || calculating}
            style={{ fontSize: 13, padding: '13px 32px', opacity: (birthDate && !calculating) ? 1 : 0.5 }}
          >
            {calculating ? '✦ Calculating...' : '✦ Calculate My Chart'}
          </button>
        </div>

        {/* Chart Results */}
        {chart && (
          <div style={{ animation: 'fadeUp .5s ease forwards' }}>
            {/* Core Summary */}
            <div className="glass" style={{ padding: 32, marginBottom: 24, borderColor: 'rgba(212,175,55,.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '.15em', color: 'rgba(167,139,250,.5)', textTransform: 'uppercase', marginBottom: 8 }}>
                    Your Human Design
                  </p>
                  <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 28, color: '#EDE9FE' }}>
                    {chart.type}
                  </h2>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,.65)', marginTop: 4 }}>
                    {chart.authority} Authority · Profile {chart.profile}
                  </p>
                </div>

                {/* ── Action Buttons ── */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    className="btn-cosmic"
                    onClick={handleSaveToProfile}
                    disabled={saving}
                    style={{ fontSize: 12 }}
                  >
                    {saving ? 'Saving...' : saved ? '✓ Saved to Profile!' : '✦ Save to My Chart'}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={handleGenerateReport}
                    style={{ fontSize: 12 }}
                  >
                    ✧ Generate Report
                  </button>
                </div>
              </div>

              {/* Key stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                {[
                  { label: 'Type', value: chart.type, color: '#A78BFA' },
                  { label: 'Authority', value: chart.authority, color: '#A78BFA' },
                  { label: 'Profile', value: chart.profile, color: '#D4AF37' },
                  { label: 'Definition', value: chart.definition, color: '#2DD4BF' },
                  { label: 'Defined Centers', value: `${chart.definedCenters.length} / 9`, color: '#A78BFA' },
                  { label: 'Active Channels', value: String(chart.activeChannels.length), color: '#A78BFA' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'rgba(45,27,105,.3)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(123,79,212,.2)' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(167,139,250,.5)', marginBottom: 6 }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: item.color }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Profile Override */}
              <div style={{ marginTop: 16, background: 'rgba(212,175,55,.05)', border: '1px solid rgba(212,175,55,.15)', borderRadius: 10, padding: '14px 20px' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '.1em', color: 'rgba(212,175,55,.6)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Profile Override (optional)
                </div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(196,181,253,.5)', marginBottom: 10 }}>
                  If you know your profile from another source, enter it here to override the calculated value when saving (e.g. "2/4").
                </p>
                <input
                  type="text"
                  placeholder={`Calculated: ${chart.profile}`}
                  value={profileOverride}
                  onChange={e => setProfileOverride(e.target.value)}
                  style={{ background: 'rgba(30,20,60,.5)', border: '1px solid rgba(212,175,55,.25)', borderRadius: 8, padding: '8px 14px', color: '#EDE9FE', fontFamily: 'Cinzel, serif', fontSize: 14, width: '120px' }}
                />
              </div>

              {/* Incarnation Cross */}
              <div style={{ marginTop: 20, background: 'rgba(212,175,55,.07)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 10, padding: '14px 20px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(212,175,55,.6)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                  Incarnation Cross
                </span>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 17, color: '#D4AF37', marginTop: 4 }}>
                  {chart.incarnationCross}
                </p>
              </div>

              {/* Type description */}
              {typeInfo && (
                <div style={{ marginTop: 16, background: 'rgba(123,79,212,.1)', border: '1px solid rgba(123,79,212,.2)', borderRadius: 10, padding: '16px 20px' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'rgba(196,181,253,.8)', lineHeight: 1.6 }}>
                    {typeInfo.description}
                  </p>
                  <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(167,139,250,.5)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Strategy</span>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: '#D4AF37', marginTop: 3 }}>{typeInfo.strategy}</p>
                    </div>
                    <div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(167,139,250,.5)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Signature</span>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: '#2DD4BF', marginTop: 3 }}>{typeInfo.signature}</p>
                    </div>
                    <div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(167,139,250,.5)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Not-Self</span>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: '#F87171', marginTop: 3 }}>{typeInfo.not_self_theme}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'graph', label: '◎ Body Graph' },
                { id: 'activations', label: '⬡ Planet Activations' },
                { id: 'channels', label: '◈ Active Channels' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontSize: 12, letterSpacing: '.05em',
                    background: activeTab === tab.id ? 'rgba(123,79,212,.35)' : 'rgba(26,10,62,.5)',
                    border: `1px solid ${activeTab === tab.id ? 'rgba(123,79,212,.6)' : 'rgba(167,139,250,.12)'}`,
                    color: activeTab === tab.id ? '#EDE9FE' : 'rgba(167,139,250,.5)',
                    transition: 'all .2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body Graph Tab */}
            {activeTab === 'graph' && (
              <div className="glass" style={{ padding: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
                  {/* SVG Body Graph */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '.12em', color: 'rgba(167,139,250,.5)', textTransform: 'uppercase', marginBottom: 16 }}>
                      Body Graph
                    </p>
                    <div style={{ background: 'rgba(8,6,24,.6)', borderRadius: 12, padding: 20, border: '1px solid rgba(167,139,250,.1)' }}>
                      <BodyGraph chart={chart} size={380} />
                    </div>
                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 8, background: '#7B4FD4', borderRadius: 2 }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,.6)' }}>Defined</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 8, background: 'transparent', border: '1px solid rgba(167,139,250,.3)', borderRadius: 2 }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,.6)' }}>Open</span>
                      </div>
                    </div>
                  </div>

                  {/* Centers breakdown */}
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '.12em', color: 'rgba(167,139,250,.5)', textTransform: 'uppercase', marginBottom: 16 }}>
                      Centers
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(['Head','Ajna','Throat','G','Heart','Sacral','SolarPlexus','Spleen','Root'] as const).map(center => {
                        const isDefined = chart.definedCenters.includes(center)
                        return (
                          <div key={center} style={{
                            padding: '12px 16px', borderRadius: 10,
                            background: isDefined ? 'rgba(123,79,212,.2)' : 'rgba(45,212,191,.05)',
                            border: `1px solid ${isDefined ? 'rgba(123,79,212,.4)' : 'rgba(45,212,191,.15)'}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}>
                            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: isDefined ? '#EDE9FE' : 'rgba(167,139,250,.5)' }}>
                              {center}
                            </span>
                            <span style={{
                              fontFamily: 'Inter, sans-serif', fontSize: 10, padding: '3px 10px',
                              borderRadius: 20, letterSpacing: '.05em', textTransform: 'uppercase',
                              background: isDefined ? 'rgba(123,79,212,.3)' : 'rgba(45,212,191,.1)',
                              border: `1px solid ${isDefined ? 'rgba(123,79,212,.5)' : 'rgba(45,212,191,.3)'}`,
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

            {/* Planet Activations Tab */}
            {activeTab === 'activations' && (
              <div className="glass" style={{ padding: 28 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, padding: '8px 16px', borderBottom: '1px solid rgba(167,139,250,.1)', gridColumn: 'span 2' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(167,139,250,.5)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Planet</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#A78BFA', letterSpacing: '.1em', textTransform: 'uppercase' }}>Personality (Conscious)</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#F87171', letterSpacing: '.1em', textTransform: 'uppercase' }}>Design (Unconscious)</span>
                  </div>

                  {chart.personalityActivations.map(activation => {
                    const pGate = GATES_64[String(activation.personality.gate)]
                    const dGate = GATES_64[String(activation.design.gate)]
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
                              {activation.personality.gate}
                            </span>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,.5)' }}>
                              .{activation.personality.line}
                            </span>
                          </div>
                          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(167,139,250,.45)', marginTop: 2 }}>
                            {pGate?.name || `Gate ${activation.personality.gate}`}
                          </div>
                        </div>
                        {/* Design */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#F87171' }}>
                              {activation.design.gate}
                            </span>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(248,113,113,.5)' }}>
                              .{activation.design.line}
                            </span>
                          </div>
                          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(248,113,113,.35)', marginTop: 2 }}>
                            {dGate?.name || `Gate ${activation.design.gate}`}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(167,139,250,.4)', marginTop: 16, textAlign: 'center' }}>
                  ✦ Planet line numbers may occasionally differ from other HD software by ±1 on boundary cases — your type, profile, channels and defined centers are unaffected.
                </p>
              </div>
            )}

            {/* Active Channels Tab */}
            {activeTab === 'channels' && (
              <div className="glass" style={{ padding: 28 }}>
                {chart.activeChannels.length === 0 ? (
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, color: 'rgba(167,139,250,.5)', textAlign: 'center', padding: '32px 0' }}>
                    No fully activated channels — this is common. Your hanging gates still carry significant energy.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {chart.activeChannels.map(channel => (
                      <div key={channel.name} style={{
                        padding: '18px 22px', borderRadius: 12,
                        background: 'rgba(123,79,212,.1)', border: '1px solid rgba(123,79,212,.25)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#D4AF37' }}>
                                {channel.gates[0]}–{channel.gates[1]}
                              </span>
                              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#EDE9FE' }}>
                                {channel.name}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <span style={{
                                fontFamily: 'Inter, sans-serif', fontSize: 10, padding: '3px 10px',
                                background: 'rgba(167,139,250,.15)', border: '1px solid rgba(167,139,250,.3)',
                                borderRadius: 20, color: '#C4B5FD', letterSpacing: '.05em'
                              }}>
                                {channel.type}
                              </span>
                              <span style={{
                                fontFamily: 'Inter, sans-serif', fontSize: 10, padding: '3px 10px',
                                background: 'rgba(45,212,191,.1)', border: '1px solid rgba(45,212,191,.25)',
                                borderRadius: 20, color: '#5EEAD4', letterSpacing: '.05em'
                              }}>
                                {channel.centers[0]} → {channel.centers[1]}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
