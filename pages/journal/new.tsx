import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { HD_TYPES, HD_AUTHORITIES, DECONDITIONING_PROMPTS, GATES_64, MOON_PHASES } from '../../lib/hdData'
import { format } from 'date-fns'

const MOOD_OPTIONS = [
  'Aligned', 'Grounded', 'Open', 'Expansive', 'Creative', 'Restful',
  'Frustrated', 'Resistant', 'Scattered', 'Depleted', 'Bitter', 'Anxious',
  'Joyful', 'Curious', 'Grateful', 'Peaceful', 'Angry', 'Overwhelmed',
]

export default function NewJournalEntry() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
  const gateOfDay = String((dayOfYear % 64) + 1)
  const moonPhaseIndex = Math.floor((today.getDate() / 29.5) * 8) % 8

  const [form, setForm] = useState({
    entry_date: todayStr,
    title: '',
    morning_reflection: '',
    strategy_check: '',
    authority_check: '',
    open_centers_log: '',
    deconditioning_notes: '',
    body_awareness: '',
    synchronicities: '',
    gratitude: '',
    evening_reflection: '',
    energy_level: 5,
    followed_strategy: null as boolean | null,
    mood_tags: [] as string[],
    gate_of_the_day: gateOfDay,
  })

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleMood = (mood: string) => {
    setForm(prev => ({
      ...prev,
      mood_tags: prev.mood_tags.includes(mood)
        ? prev.mood_tags.filter(m => m !== mood)
        : [...prev.mood_tags, mood]
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('journal_entries').insert({
      ...form,
      user_id: session.user.id,
    })

    if (!error) {
      setSaved(true)
      setTimeout(() => router.push('/journal'), 1200)
    }
    setSaving(false)
  }

  const typeInfo = profile?.hd_type ? HD_TYPES[profile.hd_type as keyof typeof HD_TYPES] : null
  const authorityInfo = profile?.hd_authority ? HD_AUTHORITIES[profile.hd_authority as keyof typeof HD_AUTHORITIES] : null
  const moonPhase = MOON_PHASES[moonPhaseIndex]
  const gateInfo = GATES_64[gateOfDay]

  const SECTIONS = [
    { label: 'Morning', icon: '☀' },
    { label: 'Strategy', icon: '◎' },
    { label: 'Body & Energy', icon: '◯' },
    { label: 'Deconditioning', icon: '✦' },
    { label: 'Evening', icon: '☽' },
  ]

  return (
    <>
      <Head>
        <title>New Journal Entry — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cinzel:wght@400;500;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <Layout>
        {/* Header */}
        <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
              {format(today, 'EEEE, MMMM d, yyyy')} · {moonPhase.emoji} {moonPhase.name}
            </p>
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 28, color: '#EDE9FE', letterSpacing: '0.05em' }}>
              New Journal Entry
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {saved ? (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#2DD4BF', display: 'flex', alignItems: 'center', gap: 8 }}>
                ✓ Saved!
              </span>
            ) : (
              <button onClick={handleSave} disabled={saving} className="btn-cosmic" style={{ fontSize: 12 }}>
                {saving ? 'Saving...' : '✦ Save Entry'}
              </button>
            )}
          </div>
        </div>

        {/* Entry Date & Title */}
        <div className="glass" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Date
              </label>
              <input type="date" className="input-cosmic" value={form.entry_date} onChange={e => update('entry_date', e.target.value)} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Entry Title (optional)
              </label>
              <input type="text" className="input-cosmic" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Give this entry a name..." />
            </div>
          </div>
        </div>

        {/* Gate of the Day callout */}
        <div style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: '16px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 36, color: '#D4AF37' }}>{gateOfDay}</div>
          <div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, letterSpacing: '0.1em', color: 'rgba(212,175,55,0.6)', textTransform: 'uppercase', marginBottom: 4 }}>
              Gate of the Day · {gateInfo?.keyword}
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, color: '#D4AF37' }}>
              {gateInfo?.name}
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: 'rgba(196,181,253,0.6)', marginTop: 2 }}>
              Shadow: {gateInfo?.shadow} · Gift: {gateInfo?.gift} · Siddhi: {gateInfo?.siddhi}
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {SECTIONS.map((s, i) => (
            <button key={s.label} onClick={() => setCurrentSection(i)} style={{
              background: currentSection === i ? 'rgba(123,79,212,0.4)' : 'rgba(26,10,62,0.4)',
              border: `1px solid ${currentSection === i ? 'rgba(123,79,212,0.6)' : 'rgba(167,139,250,0.15)'}`,
              borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: 12, letterSpacing: '0.05em',
              color: currentSection === i ? '#EDE9FE' : 'rgba(167,139,250,0.5)',
              transition: 'all 0.2s'
            }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Section: Morning */}
        {currentSection === 0 && (
          <div>
            <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
              <div className="journal-section">
                <p className="journal-section-title">Morning Reflection</p>
                <p className="prompt-text">
                  {typeInfo?.journal_prompts[0] || 'How are you entering this day? What is present for you right now?'}
                </p>
                <textarea className="textarea-cosmic" rows={5} value={form.morning_reflection} onChange={e => update('morning_reflection', e.target.value)} placeholder="Begin writing..." />
              </div>
              <hr className="divider-cosmic" />
              <div className="journal-section">
                <p className="journal-section-title">Synchronicities & Signs</p>
                <p className="prompt-text">What meaningful coincidences, moments of flow, or signs have you noticed?</p>
                <textarea className="textarea-cosmic" rows={4} value={form.synchronicities} onChange={e => update('synchronicities', e.target.value)} placeholder="Notice what the universe is pointing to..." />
              </div>
            </div>

            {/* Mood Tags */}
            <div className="glass" style={{ padding: 28, marginBottom: 24 }}>
              <p className="journal-section-title" style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', marginBottom: 16 }}>
                Current Energy Tags
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {MOOD_OPTIONS.map(mood => (
                  <button key={mood} onClick={() => toggleMood(mood)} style={{
                    background: form.mood_tags.includes(mood) ? 'rgba(123,79,212,0.4)' : 'rgba(15,10,46,0.6)',
                    border: `1px solid ${form.mood_tags.includes(mood) ? 'rgba(123,79,212,0.7)' : 'rgba(167,139,250,0.2)'}`,
                    borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontSize: 12,
                    color: form.mood_tags.includes(mood) ? '#EDE9FE' : 'rgba(167,139,250,0.5)',
                    transition: 'all 0.2s'
                  }}>
                    {mood}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section: Strategy & Authority */}
        {currentSection === 1 && (
          <div className="glass" style={{ padding: 32 }}>
            {/* Strategy check */}
            <div className="journal-section">
              <p className="journal-section-title">Strategy Check</p>
              {typeInfo && (
                <div style={{ background: 'rgba(45,27,105,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, border: '1px solid rgba(123,79,212,0.2)' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Strategy: </span>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: '#D4AF37' }}>{typeInfo.strategy}</span>
                </div>
              )}
              <p className="prompt-text">
                {typeInfo?.journal_prompts[1] || 'Did you follow your strategy today? Where did you honor it, and where did you deviate?'}
              </p>
              <textarea className="textarea-cosmic" rows={5} value={form.strategy_check} onChange={e => update('strategy_check', e.target.value)} placeholder="Reflect on your strategy..." />

              <div style={{ marginTop: 20 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', marginBottom: 12 }}>
                  Did you follow your strategy today?
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[{ val: true, label: 'Yes ✓', color: '#2DD4BF' }, { val: false, label: 'Not entirely ✗', color: '#F87171' }, { val: null, label: 'Unsure ◎', color: '#A78BFA' }].map(opt => (
                    <button key={String(opt.val)} onClick={() => update('followed_strategy', opt.val)} style={{
                      background: form.followed_strategy === opt.val ? `rgba(${opt.color === '#2DD4BF' ? '45,212,191' : opt.color === '#F87171' ? '248,113,113' : '167,139,250'},0.15)` : 'rgba(15,10,46,0.6)',
                      border: `1px solid ${form.followed_strategy === opt.val ? opt.color : 'rgba(167,139,250,0.2)'}`,
                      borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', fontSize: 13,
                      color: form.followed_strategy === opt.val ? opt.color : 'rgba(167,139,250,0.5)',
                      transition: 'all 0.2s'
                    }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <hr className="divider-cosmic" />

            {/* Authority check */}
            <div className="journal-section">
              <p className="journal-section-title">Authority Check</p>
              {authorityInfo && (
                <div style={{ background: 'rgba(45,27,105,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, border: '1px solid rgba(123,79,212,0.2)' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: 'rgba(196,181,253,0.7)' }}>
                    {authorityInfo.how_to_use}
                  </p>
                </div>
              )}
              <p className="prompt-text">
                {authorityInfo?.journal_prompt || 'Did you make decisions from your inner authority, or from conditioning and pressure?'}
              </p>
              <textarea className="textarea-cosmic" rows={5} value={form.authority_check} onChange={e => update('authority_check', e.target.value)} placeholder="How did you access your authority today?" />
            </div>
          </div>
        )}

        {/* Section: Body & Energy */}
        {currentSection === 2 && (
          <div className="glass" style={{ padding: 32 }}>
            {/* Energy Level */}
            <div className="journal-section">
              <p className="journal-section-title">Energy Level Today</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => update('energy_level', n)} style={{
                    width: 40, height: 40, borderRadius: '50%', border: 'none',
                    background: form.energy_level >= n
                      ? `hsl(${260 + n * 8}, 70%, ${40 + n * 3}%)`
                      : 'rgba(45,27,105,0.3)',
                    color: form.energy_level >= n ? '#fff' : 'rgba(167,139,250,0.4)',
                    cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: 14,
                    transition: 'all 0.2s',
                    border: form.energy_level === n ? '2px solid #A78BFA' : '1px solid rgba(123,79,212,0.2)'
                  } as any}>
                    {n}
                  </button>
                ))}
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(167,139,250,0.6)', marginLeft: 8 }}>
                  {form.energy_level}/10
                </span>
              </div>
            </div>

            <hr className="divider-cosmic" />

            {/* Body Awareness */}
            <div className="journal-section">
              <p className="journal-section-title">Body & Sacral Awareness</p>
              <p className="prompt-text">What was your body telling you today? Any gut responses (uh-huh / un-un)? Physical sensations, instincts, or signals?</p>
              <textarea className="textarea-cosmic" rows={5} value={form.body_awareness} onChange={e => update('body_awareness', e.target.value)} placeholder="My body felt... my gut said..." />
            </div>

            <hr className="divider-cosmic" />

            {/* Open Centers log */}
            <div className="journal-section">
              <p className="journal-section-title">Open Centers Log</p>
              <p className="prompt-text">What did you amplify from your open/undefined centers today? What conditioning did you notice? What wisdom did you gain?</p>
              <textarea className="textarea-cosmic" rows={5} value={form.open_centers_log} onChange={e => update('open_centers_log', e.target.value)} placeholder="From my open centers I noticed..." />
            </div>
          </div>
        )}

        {/* Section: Deconditioning */}
        {currentSection === 3 && (
          <div className="glass" style={{ padding: 32 }}>
            {/* Random deconditioning prompt */}
            <div style={{ background: 'rgba(45,27,105,0.4)', borderRadius: 12, padding: '20px 24px', marginBottom: 28, border: '1px solid rgba(123,79,212,0.3)' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: '#A78BFA', textTransform: 'uppercase', marginBottom: 8 }}>
                Deconditioning Prompt
              </p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 20, color: '#EDE9FE', lineHeight: 1.6 }}>
                "{DECONDITIONING_PROMPTS[today.getDate() % DECONDITIONING_PROMPTS.length]}"
              </p>
            </div>

            <div className="journal-section">
              <p className="journal-section-title">Deconditioning Notes</p>
              <p className="prompt-text">Where did you notice the Not-Self today? What patterns are you releasing? What is the authentic Self emerging beneath the conditioning?</p>
              <textarea className="textarea-cosmic" rows={7} value={form.deconditioning_notes} onChange={e => update('deconditioning_notes', e.target.value)} placeholder="Today I noticed my not-self showing up as..." />
            </div>

            {typeInfo && (
              <>
                <hr className="divider-cosmic" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: 'rgba(248,113,113,0.08)', borderRadius: 8, padding: '16px 20px', border: '1px solid rgba(248,113,113,0.2)' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(248,113,113,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Not-Self Theme</p>
                    <p style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#FCA5A5' }}>{typeInfo.not_self_theme}</p>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(248,113,113,0.5)', marginTop: 6 }}>Signal to pause and realign</p>
                  </div>
                  <div style={{ background: 'rgba(45,212,191,0.08)', borderRadius: 8, padding: '16px 20px', border: '1px solid rgba(45,212,191,0.2)' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(45,212,191,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Signature</p>
                    <p style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#2DD4BF' }}>{typeInfo.signature}</p>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(45,212,191,0.5)', marginTop: 6 }}>Your true north today</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Section: Evening */}
        {currentSection === 4 && (
          <div className="glass" style={{ padding: 32 }}>
            <div className="journal-section">
              <p className="journal-section-title">Evening Reflection</p>
              <p className="prompt-text">
                {typeInfo?.journal_prompts[3] || 'As the day closes, what felt aligned? What are you grateful for? What will you do differently tomorrow?'}
              </p>
              <textarea className="textarea-cosmic" rows={6} value={form.evening_reflection} onChange={e => update('evening_reflection', e.target.value)} placeholder="As I close this day..." />
            </div>

            <hr className="divider-cosmic" />

            <div className="journal-section">
              <p className="journal-section-title">Gratitude</p>
              <p className="prompt-text">Three things you are grateful for today, no matter how small.</p>
              <textarea className="textarea-cosmic" rows={4} value={form.gratitude} onChange={e => update('gratitude', e.target.value)} placeholder="I am grateful for..." />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          <button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            className="btn-ghost"
            style={{ opacity: currentSection === 0 ? 0.3 : 1 }}
            disabled={currentSection === 0}
          >
            ← Previous
          </button>
          <button onClick={handleSave} className="btn-cosmic" disabled={saving}>
            {saving ? 'Saving...' : saved ? '✓ Saved!' : '✦ Save Entry'}
          </button>
          <button
            onClick={() => setCurrentSection(Math.min(SECTIONS.length - 1, currentSection + 1))}
            className="btn-ghost"
            style={{ opacity: currentSection === SECTIONS.length - 1 ? 0.3 : 1 }}
            disabled={currentSection === SECTIONS.length - 1}
          >
            Next →
          </button>
        </div>
      </Layout>
    </>
  )
}
