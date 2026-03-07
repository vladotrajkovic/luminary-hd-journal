import Head from 'next/head'
import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { MOON_PHASES, GATES_64 } from '../../lib/hdData'
import { format } from 'date-fns'

export default function Transits() {
  const [logs, setLogs] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const moonPhaseIndex = Math.floor((today.getDate() / 29.5) * 8) % 8
  const currentMoon = MOON_PHASES[moonPhaseIndex]
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
  const gateOfDay = String((dayOfYear % 64) + 1)

  const [form, setForm] = useState({
    log_date: todayStr,
    moon_phase: currentMoon.name,
    current_gate: gateOfDay,
    transit_notes: '',
    how_i_felt: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('transit_logs').select('*').eq('user_id', session.user.id).order('log_date', { ascending: false }).limit(30)
      setLogs(data || [])
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('transit_logs').insert({ ...form, user_id: session.user.id })
    setSaved(true)
    setSaving(false)
    // Reload logs
    const { data } = await supabase.from('transit_logs').select('*').eq('user_id', session.user.id).order('log_date', { ascending: false }).limit(30)
    setLogs(data || [])
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <Head>
        <title>Moon & Transits — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <Layout>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
            Celestial Rhythms
          </p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 32, color: '#EDE9FE', letterSpacing: '0.05em' }}>
            Moon & Transit Log
          </h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,0.6)', marginTop: 8 }}>
            Track how celestial transits affect your energy and HD experience
          </p>
        </div>

        {/* Current Moon Display */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
          {MOON_PHASES.map((phase, i) => (
            <div
              key={phase.name}
              className="glass"
              style={{
                padding: '20px 22px',
                borderColor: i === moonPhaseIndex ? 'rgba(167,139,250,0.4)' : 'rgba(167,139,250,0.1)',
                background: i === moonPhaseIndex ? 'rgba(45,27,105,0.5)' : undefined,
                position: 'relative'
              }}
            >
              {i === moonPhaseIndex && (
                <div style={{
                  position: 'absolute', top: 10, right: 12,
                  fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#A78BFA',
                  letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(123,79,212,0.3)',
                  padding: '3px 8px', borderRadius: 10
                }}>
                  Now
                </div>
              )}
              <div style={{ fontSize: 32, marginBottom: 10 }}>{phase.emoji}</div>
              <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: i === moonPhaseIndex ? '#EDE9FE' : 'rgba(196,181,253,0.6)', marginBottom: 8 }}>
                {phase.name}
              </h3>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: 'rgba(167,139,250,0.5)', lineHeight: 1.4, marginBottom: 10 }}>
                {phase.energy}
              </p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(167,139,250,0.4)' }}>
                {phase.journal_prompt}
              </p>
            </div>
          ))}
        </div>

        {/* New Transit Log */}
        <div className="glass" style={{ padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 24 }}>
            LOG TODAY'S TRANSIT
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Date</label>
              <input type="date" className="input-cosmic" value={form.log_date} onChange={e => setForm(p => ({ ...p, log_date: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Moon Phase</label>
              <select className="select-cosmic" value={form.moon_phase} onChange={e => setForm(p => ({ ...p, moon_phase: e.target.value }))}>
                {MOON_PHASES.map(p => <option key={p.name} value={p.name}>{p.emoji} {p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Current Gate</label>
              <select className="select-cosmic" value={form.current_gate} onChange={e => setForm(p => ({ ...p, current_gate: e.target.value }))}>
                {Object.entries(GATES_64).map(([num, g]) => (
                  <option key={num} value={num}>Gate {num} — {g.keyword}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Transit Notes</label>
            <textarea className="textarea-cosmic" rows={4} value={form.transit_notes} onChange={e => setForm(p => ({ ...p, transit_notes: e.target.value }))} placeholder="What is the cosmic weather bringing? What themes are present in this transit?" />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>How I Felt</label>
            <textarea className="textarea-cosmic" rows={3} value={form.how_i_felt} onChange={e => setForm(p => ({ ...p, how_i_felt: e.target.value }))} placeholder="How did this transit affect your energy, emotions, decisions?" />
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-cosmic">
            {saving ? 'Saving...' : saved ? '✓ Logged!' : '☽ Log This Transit'}
          </button>
        </div>

        {/* Past Logs */}
        {logs.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 20 }}>
              Transit History
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {logs.map(log => (
                <div key={log.id} className="glass" style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span style={{ fontSize: 24 }}>
                        {MOON_PHASES.find(p => p.name === log.moon_phase)?.emoji || '☽'}
                      </span>
                      <div>
                        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#EDE9FE' }}>
                          {log.moon_phase}
                        </div>
                        {log.current_gate && (
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(212,175,55,0.6)' }}>
                            Gate {log.current_gate} — {GATES_64[log.current_gate]?.keyword}
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(167,139,250,0.4)' }}>
                      {format(new Date(log.log_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {log.transit_notes && (
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: 'rgba(196,181,253,0.7)', marginBottom: 8 }}>
                      {log.transit_notes}
                    </p>
                  )}
                  {log.how_i_felt && (
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(167,139,250,0.5)' }}>
                      "{log.how_i_felt}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Layout>
    </>
  )
}
