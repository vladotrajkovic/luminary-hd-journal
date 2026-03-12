import Head from 'next/head'
import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { HD_CENTERS } from '../../lib/hdData'

// Maps HD_CENTERS display names → internal DB keys stored in profile.defined_centers
// HD_CENTERS uses human-readable names; the DB stores internal Center keys
const CENTER_NAME_TO_KEY: Record<string, string> = {
  'Solar Plexus': 'SolarPlexus',
  'G Center':     'G',
  'Heart/Ego':    'Heart',
}

export default function Centers() {
  const [profile, setProfile]       = useState<any>(null)
  const [reflections, setReflections] = useState<any[]>([])
  const [selected, setSelected]     = useState<string | null>(null)
  const [notes, setNotes]           = useState<Record<string, string>>({})
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const [{ data: prof }, { data: refs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('center_reflections').select('*').eq('user_id', session.user.id),
      ])
      setProfile(prof)
      setReflections(refs || [])
      const notesMap: Record<string, string> = {}
      refs?.forEach((r: any) => { notesMap[r.center_name] = r.reflection_notes || '' })
      setNotes(notesMap)
    }
    load()
  }, [])

  const definedCenters: string[] = profile?.defined_centers || []

  // Resolve whether a center (by display name) is defined
  const isCenterDefined = (displayName: string) => {
    const key = CENTER_NAME_TO_KEY[displayName] ?? displayName
    return definedCenters.includes(key)
  }

  const handleSaveReflection = async (centerName: string) => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const existing = reflections.find(r => r.center_name === centerName)
    // FIX: normalise display name before checking defined status
    const isDefined = isCenterDefined(centerName)

    if (existing) {
      await supabase.from('center_reflections')
        .update({ reflection_notes: notes[centerName] })
        .eq('id', existing.id)
    } else {
      await supabase.from('center_reflections').insert({
        user_id: session.user.id,
        center_name: centerName,
        is_defined: isDefined,
        reflection_notes: notes[centerName] || '',
      })
    }
    setSaving(false)
  }

  return (
    <>
      <Head>
        <title>Centers — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <Layout>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
            The Body Graph
          </p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 32, color: '#EDE9FE', letterSpacing: '0.05em' }}>
            The 9 Centers
          </h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,0.6)', marginTop: 8 }}>
            Your defined centers are consistent energy. Your open centers are wisdom and amplification.
          </p>
        </div>

        {!profile?.defined_centers?.length && (
          <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: '16px 24px', marginBottom: 24 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: 'rgba(212,175,55,0.7)' }}>
              ✦ Set up your chart first to see which centers are defined or open for you.{' '}
              <a href="/profile" style={{ color: '#D4AF37' }}>Go to My Chart →</a>
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {HD_CENTERS.map(center => {
            // FIX: normalise display name → internal key before comparing with DB values
            const isDefined  = isCenterDefined(center.name)
            const isOpen     = !isDefined
            const isSelected = selected === center.name

            return (
              <div key={center.name}>
                <div
                  onClick={() => setSelected(isSelected ? null : center.name)}
                  className="glass glass-hover"
                  style={{
                    padding: '22px 24px', cursor: 'pointer',
                    borderColor: isSelected ? 'rgba(167,139,250,0.4)' : undefined,
                    borderLeft: `3px solid ${isDefined ? '#7B4FD4' : '#2DD4BF'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 16, color: '#EDE9FE', letterSpacing: '0.05em' }}>
                      {center.name}
                    </h3>
                    <span className={`center-badge ${isDefined ? 'center-defined' : 'center-open'}`}>
                      {isDefined ? 'Defined' : 'Open'}
                    </span>
                  </div>

                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'rgba(196,181,253,0.7)', marginBottom: 12, lineHeight: 1.5 }}>
                    {isDefined ? center.defined_gift : center.open_gift}
                  </p>

                  <div style={{
                    background: isOpen ? 'rgba(248,113,113,0.06)' : 'rgba(123,79,212,0.08)',
                    borderRadius: 8, padding: '10px 14px',
                    border: `1px solid ${isOpen ? 'rgba(248,113,113,0.15)' : 'rgba(123,79,212,0.15)'}`,
                  }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: isOpen ? 'rgba(248,113,113,0.6)' : 'rgba(167,139,250,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      {isOpen ? 'Watch for conditioning' : 'Your consistent gift'}
                    </p>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, color: isOpen ? 'rgba(248,113,113,0.8)' : 'rgba(167,139,250,0.7)' }}>
                      {isOpen ? center.not_self_question : center.defined_gift}
                    </p>
                  </div>
                </div>

                {/* Expanded Reflection */}
                {isSelected && (
                  <div className="glass" style={{ padding: 24, marginTop: -1, borderRadius: '0 0 12px 12px', borderTop: '1px solid rgba(167,139,250,0.1)' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', marginBottom: 12 }}>
                      My Reflection on the {center.name} Center
                    </p>
                    <textarea
                      className="textarea-cosmic"
                      rows={4}
                      value={notes[center.name] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [center.name]: e.target.value }))}
                      placeholder={`How does your ${isDefined ? 'defined' : 'open'} ${center.name} center show up in your life? What patterns have you noticed?`}
                    />
                    <button
                      onClick={() => handleSaveReflection(center.name)}
                      disabled={saving}
                      className="btn-cosmic"
                      style={{ marginTop: 12, fontSize: 12 }}
                    >
                      {saving ? 'Saving...' : '✦ Save Reflection'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Layout>
    </>
  )
}
