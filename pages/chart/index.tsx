import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import BodyGraph from '../../components/chart/BodyGraph'
import { supabase } from '../../lib/supabase'
import { calculateHDChart, HDChart } from '../../lib/hdCalculator'
import { HD_TYPES, HD_AUTHORITIES, GATES_64 } from '../../lib/hdData'

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
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; timezone: string; lat: number; lon: number } | null>(null)
  const [searchingPlace, setSearchingPlace] = useState(false)
  const [chart, setChart] = useState<HDChart | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'graph' | 'activations' | 'channels'>('graph')
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
    setSelectedPlace({ name: `${place.name}, ${place.country}`, timezone, lat: place.latitude, lon: place.longitude })
    setBirthPlace(`${place.name}, ${place.country}`)
    setPlaceResults([])
  }

  const handleCalculate = () => {
    if (!birthDate) return
    let date: Date
    if (selectedPlace && birthTime) {
      // Convert local birth time to UTC using the location timezone
      const dateTimeStr = `${birthDate}T${birthTime}:00`
      // Use Intl to get the UTC offset for the timezone at the birth date/time
      const localDate = new Date(dateTimeStr)
      const tzFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: selectedPlace.timezone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      })
      // Get UTC offset by comparing local time in that timezone vs UTC
      const utcDate = new Date(dateTimeStr + 'Z')
      const localInTZ = new Date(tzFormatter.format(utcDate).replace(/(\d+)\/(\d+)\/(\d+),\s/, '$3-$1-$2T') + 'Z')
      const offsetMs = utcDate.getTime() - localInTZ.getTime()
      date = new Date(localDate.getTime() + offsetMs)
    } else if (birthTime) {
      // No timezone — treat as local browser time
      date = new Date(`${birthDate}T${birthTime}:00`)
    } else {
      date = new Date(`${birthDate}T12:00:00Z`)
    }
    const result = calculateHDChart(date)
    setChart(result)
    setActiveTab('graph')
  }

  const handleSaveToProfile = async () => {
    if (!chart) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('profiles').update({
      hd_type: chart.type,
      hd_authority: chart.authority,
      hd_profile: chart.profile,
      hd_definition: chart.definition,
      hd_incarnation_cross: chart.incarnationCross,
      defined_centers: chart.definedCenters,
      active_gates: chart.allGates.map(String),
      birth_date: birthDate,
      birth_time: birthTime || null,
      birth_place: selectedPlace?.name || birthPlace || null,
    }).eq('id', session.user.id)

    setSaved(true)
    setSaving(false)
    setTimeout(() => router.push('/profile'), 1500)
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
                Birth Time
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
                placeholder="e.g. London, New York, Tokyo"
                value={birthPlace}
                onChange={e => handlePlaceInput(e.target.value)}
                autoComplete="off"
              />
              {/* City search dropdown */}
              {placeResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: 'rgba(15,10,46,0.98)', border: '1px solid rgba(123,79,212,.4)',
                  borderRadius: 10, marginTop: 4, overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,.6)'
                }}>
                  {placeResults.map((place: any, i: number) => (
                    <div
                      key={i}
                      onClick={() => selectPlace(place)}
                      style={{
                        padding: '11px 16px', cursor: 'pointer',
                        borderBottom: i < placeResults.length - 1 ? '1px solid rgba(123,79,212,.1)' : 'none',
                        transition: 'background .15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(123,79,212,.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#EDE9FE' }}>
                        {place.name}{place.admin1 ? `, ${place.admin1}` : ''}
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,.5)', marginTop: 2 }}>
                        {place.country} · {place.timezone}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Selected place confirmation */}
              {selectedPlace && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#2DD4BF', fontSize: 12 }}>✓</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(45,212,191,.8)' }}>
                    {selectedPlace.timezone}
                  </span>
                </div>
              )}
              {searchingPlace && (
                <div style={{ marginTop: 6, fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,.5)' }}>
                  Searching...
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'rgba(212,175,55,.07)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 20 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(212,175,55,.8)' }}>
              ✦ Birth city resolves the exact timezone so your time is accurately converted to UTC for planetary calculations.
            </p>
          </div>

          <button
            className="btn-cosmic"
            onClick={handleCalculate}
            disabled={!birthDate}
            style={{ fontSize: 13, padding: '13px 32px', opacity: birthDate ? 1 : 0.5 }}
          >
            ✦ Calculate My Chart
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
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="btn-cosmic"
                    onClick={handleSaveToProfile}
                    disabled={saving}
                    style={{ fontSize: 12 }}
                  >
                    {saving ? 'Saving...' : saved ? '✓ Saved to Profile!' : '✦ Save to My Chart'}
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
                            background: isDefined ? 'rgba(123,79,212,.15)' : 'rgba(15,10,46,.4)',
                            border: `1px solid ${isDefined ? 'rgba(123,79,212,.4)' : 'rgba(167,139,250,.1)'}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}>
                            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: isDefined ? '#EDE9FE' : 'rgba(167,139,250,.5)' }}>
                              {center === 'SolarPlexus' ? 'Solar Plexus' : center}
                            </span>
                            <span style={{
                              fontFamily: 'Inter, sans-serif', fontSize: 10, padding: '3px 10px', borderRadius: 10,
                              background: isDefined ? 'rgba(123,79,212,.3)' : 'rgba(45,212,191,.1)',
                              border: `1px solid ${isDefined ? 'rgba(123,79,212,.5)' : 'rgba(45,212,191,.3)'}`,
                              color: isDefined ? '#C4B5FD' : '#5EEAD4',
                              letterSpacing: '.05em'
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
                                borderRadius: 10, color: '#A78BFA', letterSpacing: '.05em'
                              }}>
                                {channel.centers[0]} → {channel.centers[1]}
                              </span>
                              <span style={{
                                fontFamily: 'Inter, sans-serif', fontSize: 10, padding: '3px 10px',
                                background: 'rgba(45,212,191,.08)', border: '1px solid rgba(45,212,191,.2)',
                                borderRadius: 10, color: '#2DD4BF', letterSpacing: '.05em'
                              }}>
                                {channel.type}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {channel.gates.map(g => {
                              const gateInfo = GATES_64[String(g)]
                              return (
                                <div key={g} style={{
                                  padding: '8px 12px', background: 'rgba(212,175,55,.07)',
                                  border: '1px solid rgba(212,175,55,.2)', borderRadius: 8, textAlign: 'center'
                                }}>
                                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#D4AF37' }}>{g}</div>
                                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(212,175,55,.6)', marginTop: 2 }}>
                                    {gateInfo?.keyword}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hanging gates */}
                <div style={{ marginTop: 28 }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '.12em', color: 'rgba(167,139,250,.5)', textTransform: 'uppercase', marginBottom: 14 }}>
                    All Active Gates
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {chart.allGates.sort((a, b) => a - b).map(g => {
                      const isPersonality = chart.allPersonalityGates.includes(g)
                      const isDesign = chart.allDesignGates.includes(g)
                      const both = isPersonality && isDesign
                      const gateInfo = GATES_64[String(g)]
                      return (
                        <div key={g} style={{
                          padding: '8px 14px', borderRadius: 10,
                          background: both ? 'rgba(123,79,212,.25)' : isPersonality ? 'rgba(167,139,250,.12)' : 'rgba(248,113,113,.1)',
                          border: `1px solid ${both ? 'rgba(123,79,212,.5)' : isPersonality ? 'rgba(167,139,250,.3)' : 'rgba(248,113,113,.25)'}`,
                          textAlign: 'center', minWidth: 56
                        }}>
                          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: both ? '#C4B5FD' : isPersonality ? '#A78BFA' : '#F87171' }}>{g}</div>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(167,139,250,.5)', marginTop: 2, letterSpacing: '.04em' }}>
                            {gateInfo?.keyword}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, background: 'rgba(167,139,250,.2)', border: '1px solid rgba(167,139,250,.4)', borderRadius: 3 }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,.5)' }}>Personality (Conscious)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 3 }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,.5)' }}>Design (Unconscious)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, background: 'rgba(123,79,212,.25)', border: '1px solid rgba(123,79,212,.5)', borderRadius: 3 }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,.5)' }}>Both</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Layout>
    </>
  )
}
