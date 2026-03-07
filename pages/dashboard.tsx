import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import Layout from '../components/layout/Layout'
import { HD_TYPES, HD_AUTHORITIES, GATES_64, MOON_PHASES } from '../lib/hdData'
import { format } from 'date-fns'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [recentEntries, setRecentEntries] = useState<any[]>([])
  const [todayEntry, setTodayEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
  const gateOfDay = String((dayOfYear % 64) + 1)
  const moonPhaseIndex = Math.floor((today.getDate() / 29.5) * 8) % 8
  const moonPhase = MOON_PHASES[moonPhaseIndex]

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [{ data: prof }, { data: entries }, { data: todayEnt }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('journal_entries').select('*').eq('user_id', session.user.id).order('entry_date', { ascending: false }).limit(5),
        supabase.from('journal_entries').select('*').eq('user_id', session.user.id).eq('entry_date', todayStr).single(),
      ])
      setProfile(prof)
      setRecentEntries(entries || [])
      setTodayEntry(todayEnt)
      setLoading(false)
    }
    load()
  }, [])

  const typeInfo = profile?.hd_type ? HD_TYPES[profile.hd_type as keyof typeof HD_TYPES] : null
  const gateInfo = GATES_64[gateOfDay]

  return (
    <>
      <Head>
        <title>Dashboard — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cinzel:wght@400;500;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <Layout>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 32, color: '#EDE9FE', letterSpacing: '0.05em' }}>
            {loading ? 'Loading...' : `Welcome back, ${profile?.full_name?.split(' ')[0] || 'Starlight'}`}
          </h1>
          {typeInfo && (
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,0.6)', marginTop: 8 }}>
              {profile.hd_type} · {profile.hd_authority} Authority · Profile {profile.hd_profile}
            </p>
          )}
        </div>

        {/* Profile setup CTA */}
        {!loading && !profile?.hd_type && (
          <div className="glass" style={{ padding: 28, marginBottom: 32, borderColor: 'rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 16, color: '#D4AF37', marginBottom: 8 }}>✦ Set Up Your Human Design Chart</h3>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', color: 'rgba(196,181,253,0.7)', fontSize: 17 }}>
                  Add your HD type, authority, profile and centers to unlock personalized prompts and guidance.
                </p>
              </div>
              <Link href="/profile/setup">
                <button className="btn-cosmic">Configure My Chart →</button>
              </Link>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>

          {/* Today's Journal */}
          <div className="glass" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.1em', color: '#A78BFA' }}>TODAY'S JOURNAL</h2>
              <span style={{ fontSize: 20 }}>✍</span>
            </div>
            {todayEntry ? (
              <div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'rgba(196,181,253,0.8)', marginBottom: 16 }}>
                  {todayEntry.title || format(today, 'MMMM d')} — Entry written
                </p>
                {todayEntry.morning_reflection && (
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: 'rgba(167,139,250,0.6)', marginBottom: 16 }}>
                    "{todayEntry.morning_reflection.slice(0, 120)}{todayEntry.morning_reflection.length > 120 ? '...' : ''}"
                  </p>
                )}
                <Link href={`/journal/${todayEntry.id}`}>
                  <button className="btn-ghost" style={{ fontSize: 12 }}>Continue Writing →</button>
                </Link>
              </div>
            ) : (
              <div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(167,139,250,0.5)', marginBottom: 20, fontSize: 17 }}>
                  No entry for today yet. Begin your reflection.
                </p>
                <Link href="/journal/new">
                  <button className="btn-cosmic" style={{ fontSize: 12 }}>Begin Today's Entry →</button>
                </Link>
              </div>
            )}
          </div>

          {/* Gate of the Day */}
          <div className="glass" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.1em', color: '#A78BFA' }}>GATE OF THE DAY</h2>
              <span style={{ fontSize: 20 }}>⬡</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <span className="gate-number" style={{ fontSize: 40 }}>{gateOfDay}</span>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#D4AF37', letterSpacing: '0.05em' }}>
                {gateInfo?.keyword}
              </span>
            </div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, color: '#A78BFA', marginBottom: 8 }}>
              {gateInfo?.name}
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: 'rgba(196,181,253,0.6)', marginBottom: 16 }}>
              {gateInfo?.description}
            </p>
            <div style={{ background: 'rgba(212,175,55,0.08)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(212,175,55,0.2)' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Gift</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: 'rgba(196,181,253,0.8)' }}>{gateInfo?.gift}</p>
            </div>
          </div>

          {/* Moon Phase */}
          <div className="glass" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.1em', color: '#A78BFA' }}>MOON ENERGY</h2>
              <span style={{ fontSize: 20 }}>☽</span>
            </div>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{moonPhase.emoji}</div>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 16, color: '#EDE9FE', letterSpacing: '0.05em', marginBottom: 8 }}>
              {moonPhase.name}
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: 'rgba(196,181,253,0.6)', marginBottom: 16 }}>
              {moonPhase.energy}
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(167,139,250,0.5)' }}>
              {moonPhase.journal_prompt}
            </p>
          </div>

          {/* Type Guidance */}
          {typeInfo && (
            <div className="glass" style={{ padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.1em', color: '#A78BFA' }}>TODAY'S REMINDER</h2>
                <span style={{ fontSize: 20 }}>◎</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase' }}>
                  Your Strategy
                </span>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#D4AF37', marginTop: 4 }}>
                  {typeInfo.strategy}
                </p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase' }}>
                  Signature to Aim For
                </span>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#2DD4BF', marginTop: 4 }}>
                  {typeInfo.signature}
                </p>
              </div>
              <div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase' }}>
                  Watch for Not-Self
                </span>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#F87171', marginTop: 4 }}>
                  {typeInfo.not_self_theme}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Today's Journal Prompt */}
        {typeInfo && (
          <div className="glass" style={{ padding: 28, marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.1em', color: '#A78BFA', marginBottom: 20 }}>
              ✦ TODAY'S REFLECTION PROMPT
            </h2>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 22, color: '#EDE9FE', lineHeight: 1.6, marginBottom: 20 }}>
              "{typeInfo.journal_prompts[today.getDay() % typeInfo.journal_prompts.length]}"
            </p>
            <Link href="/journal/new">
              <button className="btn-cosmic" style={{ fontSize: 12 }}>Write Your Response →</button>
            </Link>
          </div>
        )}

        {/* Recent Entries */}
        {recentEntries.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 16, letterSpacing: '0.1em', color: '#C4B5FD', marginBottom: 20 }}>
              RECENT ENTRIES
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentEntries.map(entry => (
                <Link key={entry.id} href={`/journal/${entry.id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass glass-hover" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#EDE9FE', marginBottom: 4 }}>
                        {entry.title || format(new Date(entry.entry_date), 'MMMM d, yyyy')}
                      </div>
                      {entry.morning_reflection && (
                        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(167,139,250,0.5)' }}>
                          {entry.morning_reflection.slice(0, 80)}...
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {entry.energy_level && (
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(167,139,250,0.5)' }}>
                          Energy: {entry.energy_level}/10
                        </span>
                      )}
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(167,139,250,0.4)' }}>
                        {format(new Date(entry.entry_date), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Layout>
    </>
  )
}
