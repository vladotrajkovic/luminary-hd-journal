import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { HD_TYPES, HD_AUTHORITIES, HD_CENTERS, HD_PROFILES } from '../../lib/hdData'

const HD_TYPE_LIST = ['Manifestor', 'Generator', 'Manifesting Generator', 'Projector', 'Reflector']
const HD_AUTH_LIST = ['Sacral', 'Emotional/Solar Plexus', 'Splenic', 'Ego/Heart', 'G Center/Self', 'Mental/Environment', 'Lunar', 'None/Outer Authority']
const HD_PROFILE_LIST = ['1/3', '1/4', '2/4', '2/5', '3/5', '3/6', '4/6', '4/1', '5/1', '5/2', '6/2', '6/3']
const HD_DEF_LIST = ['Single', 'Split', 'Triple Split', 'Quadruple Split']
const CENTER_NAMES = HD_CENTERS.map(c => c.name)

export default function ProfileSetup() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    hd_type: '',
    hd_authority: '',
    hd_profile: '',
    hd_definition: '',
    hd_incarnation_cross: '',
    birth_date: '',
    birth_time: '',
    birth_city: '',
    birth_country: '',
    defined_centers: [] as string[],
    active_gates: [] as string[],
    notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) {
        setProfile(data)
        setForm({
          full_name: data.full_name || '',
          hd_type: data.hd_type || '',
          hd_authority: data.hd_authority || '',
          hd_profile: data.hd_profile || '',
          hd_definition: data.hd_definition || '',
          hd_incarnation_cross: data.hd_incarnation_cross || '',
          birth_date: data.birth_date || '',
          birth_time: data.birth_time || '',
          birth_city: data.birth_city || '',
          birth_country: data.birth_country || '',
          defined_centers: data.defined_centers || [],
          active_gates: data.active_gates || [],
          notes: data.notes || '',
        })
      }
    }
    load()
  }, [])

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleCenter = (center: string) => {
    setForm(prev => ({
      ...prev,
      defined_centers: prev.defined_centers.includes(center)
        ? prev.defined_centers.filter(c => c !== center)
        : [...prev.defined_centers, center]
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('profiles').update(form).eq('id', session.user.id)
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const typeInfo = form.hd_type ? HD_TYPES[form.hd_type as keyof typeof HD_TYPES] : null
  const profileInfo = form.hd_profile ? HD_PROFILES[form.hd_profile as keyof typeof HD_PROFILES] : null

  return (
    <>
      <Head>
        <title>My Chart — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <Layout>
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

        {/* Birth Data */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 24 }}>BIRTH DATA</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Your Name</label>
              <input className="input-cosmic" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Birth Date</label>
              <input type="date" className="input-cosmic" value={form.birth_date} onChange={e => update('birth_date', e.target.value)} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Birth Time</label>
              <input type="time" className="input-cosmic" value={form.birth_time} onChange={e => update('birth_time', e.target.value)} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Birth City</label>
              <input className="input-cosmic" value={form.birth_city} onChange={e => update('birth_city', e.target.value)} placeholder="City" />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Country</label>
              <input className="input-cosmic" value={form.birth_country} onChange={e => update('birth_country', e.target.value)} placeholder="Country" />
            </div>
          </div>

        </div>

        {/* Core HD Data */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 24 }}>CORE DESIGN</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Energy Type</label>
              <select className="select-cosmic" value={form.hd_type} onChange={e => update('hd_type', e.target.value)}>
                <option value="">Select type...</option>
                {HD_TYPE_LIST.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Inner Authority</label>
              <select className="select-cosmic" value={form.hd_authority} onChange={e => update('hd_authority', e.target.value)}>
                <option value="">Select authority...</option>
                {HD_AUTH_LIST.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Profile</label>
              <select className="select-cosmic" value={form.hd_profile} onChange={e => update('hd_profile', e.target.value)}>
                <option value="">Select profile...</option>
                {HD_PROFILE_LIST.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Definition</label>
              <select className="select-cosmic" value={form.hd_definition} onChange={e => update('hd_definition', e.target.value)}>
                <option value="">Select definition...</option>
                {HD_DEF_LIST.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Incarnation Cross</label>
              <input className="input-cosmic" value={form.hd_incarnation_cross} onChange={e => update('hd_incarnation_cross', e.target.value)} placeholder="e.g. Right Angle Cross of Planning" />
            </div>
          </div>

          {/* Type + Profile Info Cards */}
          {(typeInfo || profileInfo) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 28 }}>
              {typeInfo && (
                <div style={{ background: 'rgba(123,79,212,0.1)', borderRadius: 12, padding: '20px 24px', border: '1px solid rgba(123,79,212,0.25)' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    {form.hd_type} · {typeInfo.population}
                  </p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'rgba(196,181,253,0.8)', lineHeight: 1.6 }}>
                    {typeInfo.description}
                  </p>
                </div>
              )}
              {profileInfo && (
                <div style={{ background: 'rgba(212,175,55,0.06)', borderRadius: 12, padding: '20px 24px', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    Profile {form.hd_profile} · {profileInfo.name}
                  </p>
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#D4AF37', marginBottom: 8 }}>{profileInfo.theme}</p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'rgba(196,181,253,0.7)', lineHeight: 1.6 }}>
                    {profileInfo.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Centers */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 8 }}>CENTERS</h2>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(167,139,250,0.5)', fontSize: 16, marginBottom: 24 }}>
            Select your defined (colored) centers. Unselected = open/undefined.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {HD_CENTERS.map(center => {
              const isDefined = form.defined_centers.includes(center.name)
              return (
                <div
                  key={center.name}
                  onClick={() => toggleCenter(center.name)}
                  style={{
                    padding: '16px 20px', borderRadius: 12, cursor: 'pointer',
                    background: isDefined ? `rgba(${center.color === '#8B5CF6' ? '139,92,246' : '123,79,212'},0.15)` : 'rgba(15,10,46,0.5)',
                    border: `1px solid ${isDefined ? center.color + '60' : 'rgba(167,139,250,0.15)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: isDefined ? '#EDE9FE' : 'rgba(167,139,250,0.6)' }}>
                      {center.name}
                    </span>
                    <span className={`center-badge ${isDefined ? 'center-defined' : 'center-open'}`}>
                      {isDefined ? 'Defined' : 'Open'}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14, color: 'rgba(167,139,250,0.5)', lineHeight: 1.4 }}>
                    {isDefined ? center.defined_gift : center.open_gift}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Active Gates */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 8 }}>ACTIVE GATES</h2>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(167,139,250,0.5)', fontSize: 16, marginBottom: 16 }}>
            Enter your active gate numbers separated by commas (e.g. 1, 8, 13, 25...)
          </p>
          <input
            className="input-cosmic"
            value={form.active_gates.join(', ')}
            onChange={e => update('active_gates', e.target.value.split(',').map(g => g.trim()).filter(Boolean))}
            placeholder="1, 8, 13, 25, 46..."
          />
        </div>

        {/* Personal Notes */}
        <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 14, letterSpacing: '0.12em', color: '#A78BFA', marginBottom: 16 }}>PERSONAL CHART NOTES</h2>
          <textarea
            className="textarea-cosmic"
            rows={6}
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="Any additional notes about your chart, channels, splits, or things you want to remember..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving} className="btn-cosmic" style={{ padding: '14px 40px' }}>
            {saving ? 'Saving...' : saved ? '✓ Saved!' : '✦ Save My Chart'}
          </button>
        </div>
      </Layout>
    </>
  )
}
