import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'

export default function JournalList() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('entry_date', { ascending: false })
      setEntries(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Group by month
  const grouped = entries.reduce((acc: any, entry) => {
    const month = format(new Date(entry.entry_date), 'MMMM yyyy')
    if (!acc[month]) acc[month] = []
    acc[month].push(entry)
    return acc
  }, {})

  return (
    <>
      <Head>
        <title>Journal — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
              Your Archive
            </p>
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 32, color: '#EDE9FE', letterSpacing: '0.05em' }}>
              Journal Entries
            </h1>
          </div>
          <Link href="/journal/new">
            <button className="btn-cosmic">✦ New Entry</button>
          </Link>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(167,139,250,0.5)' }}>
            Loading your entries...
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="glass" style={{ padding: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✦</div>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#C4B5FD', marginBottom: 12 }}>Begin Your Experiment</h2>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(167,139,250,0.6)', marginBottom: 28 }}>
              Your journal is empty. Start tracking your Human Design experiment today.
            </p>
            <Link href="/journal/new">
              <button className="btn-cosmic">Write Your First Entry →</button>
            </Link>
          </div>
        )}

        {Object.entries(grouped).map(([month, monthEntries]: [string, any]) => (
          <div key={month} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 16 }}>
              {month}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {monthEntries.map((entry: any) => (
                <Link key={entry.id} href={`/journal/${entry.id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass glass-hover" style={{ padding: '20px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: '#EDE9FE' }}>
                            {entry.title || format(new Date(entry.entry_date), 'EEEE, MMMM d')}
                          </span>
                          {entry.gate_of_the_day && (
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.05em' }}>
                              Gate {entry.gate_of_the_day}
                            </span>
                          )}
                        </div>
                        {entry.morning_reflection && (
                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: 'rgba(167,139,250,0.5)' }}>
                            {entry.morning_reflection.slice(0, 100)}{entry.morning_reflection.length > 100 ? '...' : ''}
                          </p>
                        )}
                        {entry.mood_tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                            {entry.mood_tags.slice(0, 4).map((tag: string) => (
                              <span key={tag} style={{
                                background: 'rgba(123,79,212,0.2)', border: '1px solid rgba(123,79,212,0.3)',
                                borderRadius: 12, padding: '3px 10px',
                                fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#A78BFA'
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(167,139,250,0.4)' }}>
                          {format(new Date(entry.entry_date), 'MMM d')}
                        </span>
                        {entry.energy_level && (
                          <span style={{
                            fontFamily: 'Inter, sans-serif', fontSize: 11,
                            color: entry.energy_level >= 7 ? '#2DD4BF' : entry.energy_level >= 4 ? '#A78BFA' : '#F87171',
                            background: `rgba(${entry.energy_level >= 7 ? '45,212,191' : entry.energy_level >= 4 ? '167,139,250' : '248,113,113'},0.1)`,
                            padding: '3px 10px', borderRadius: 12,
                          }}>
                            ⚡ {entry.energy_level}/10
                          </span>
                        )}
                        {entry.followed_strategy === true && (
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#2DD4BF' }}>✓ Strategy</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </Layout>
    </>
  )
}
