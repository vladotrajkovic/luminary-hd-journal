import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'

export default function AccountPage() {
  const router = useRouter()

  // Profile fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [location, setLocation] = useState('')
  const [address, setAddress] = useState('')
  const [emailSubscribed, setEmailSubscribed] = useState(false)

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      setUserEmail(session.user.email || '')

      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, username, birth_date, location, address, email_subscribed')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
        setUsername(data.username || '')
        setBirthDate(data.birth_date || '')
        setLocation(data.location || '')
        setAddress(data.address || '')
        setEmailSubscribed(data.email_subscribed || false)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setError('First name, last name and username are required.')
      return
    }
    setSaving(true)
    setError('')
    setSaved(false)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error: saveError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        username: username.trim(),
        birth_date: birthDate || null,
        location: location.trim() || null,
        address: address.trim() || null,
        email_subscribed: emailSubscribed,
      })
      .eq('id', session.user.id)

    if (saveError) {
      setError(saveError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSaved(false)

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSaved(true)
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordSection(false)
      setTimeout(() => setPasswordSaved(false), 4000)
    }
    setSavingPassword(false)
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ fontFamily: 'Cinzel, serif', color: 'rgba(167,139,250,0.5)', letterSpacing: '0.1em' }}>
            ✦ Loading...
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <>
      <Head>
        <title>Personal Details — Luminary</title>
      </Head>
      <Layout>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Page Header */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{
              fontFamily: 'Cinzel, serif', fontSize: 22, letterSpacing: '0.12em',
              color: '#EDE9FE', marginBottom: 8,
            }}>
              PERSONAL DETAILS
            </h1>
            <p style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 17, color: 'rgba(196,181,253,0.5)',
            }}>
              Manage your account information
            </p>
          </div>

          {/* ── IDENTITY SECTION ── */}
          <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
            <SectionTitle>Identity</SectionTitle>

            {/* First + Last Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <FieldLabel required>First Name</FieldLabel>
                <input
                  type="text"
                  className="input-cosmic"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <FieldLabel required>Last Name</FieldLabel>
                <input
                  type="text"
                  className="input-cosmic"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Username */}
            <div style={{ marginBottom: 20 }}>
              <FieldLabel required>Username</FieldLabel>
              <input
                type="text"
                className="input-cosmic"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <FieldLabel>Email</FieldLabel>
              <div style={{
                background: 'rgba(15,10,46,0.4)',
                border: '1px solid rgba(167,139,250,0.1)',
                borderRadius: 8, padding: '10px 14px',
                fontFamily: 'Inter, sans-serif', fontSize: 14,
                color: 'rgba(196,181,253,0.5)',
                minHeight: 40, display: 'flex', alignItems: 'center',
              }}>
                {userEmail}
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.3)', marginTop: 5 }}>
                Email cannot be changed here
              </p>
            </div>
          </div>

          {/* ── ADDITIONAL INFO SECTION ── */}
          <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
            <SectionTitle>Additional Info <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.4)', fontWeight: 400, letterSpacing: '0.05em', textTransform: 'none' }}>— optional</span></SectionTitle>

            {/* Birth Date */}
            <div style={{ marginBottom: 20 }}>
              <FieldLabel>Birth Date</FieldLabel>
              <input
                type="date"
                className="input-cosmic"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
              />
            </div>

            {/* Location */}
            <div style={{ marginBottom: 20 }}>
              <FieldLabel>Location</FieldLabel>
              <input
                type="text"
                className="input-cosmic"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="City, Country"
              />
            </div>

            {/* Address */}
            <div>
              <FieldLabel>Address</FieldLabel>
              <input
                type="text"
                className="input-cosmic"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Your street address"
              />
            </div>
          </div>

          {/* ── PREFERENCES SECTION ── */}
          <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
            <SectionTitle>Preferences</SectionTitle>

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              cursor: 'pointer', userSelect: 'none',
            }}>
              <div
                onClick={() => setEmailSubscribed(!emailSubscribed)}
                style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                  background: emailSubscribed ? 'rgba(123,79,212,0.6)' : 'rgba(15,10,46,0.6)',
                  border: emailSubscribed ? '1px solid rgba(167,139,250,0.6)' : '1px solid rgba(167,139,250,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {emailSubscribed && (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l3.5 3.5L11 1" stroke="#EDE9FE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#C4B5FD', marginBottom: 3 }}>
                  Subscribe to email updates
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(167,139,250,0.4)', lineHeight: 1.5 }}>
                  Receive occasional news, tips, and updates about Luminary
                </div>
              </div>
            </label>
          </div>

          {/* ── ERROR / SUCCESS ── */}
          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 8, padding: '12px 16px', marginBottom: 16,
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#FCA5A5',
            }}>
              {error}
            </div>
          )}

          {/* Save Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-cosmic"
              style={{ padding: '12px 32px' }}
            >
              {saving ? '✦ Saving...' : '✦ Save Changes'}
            </button>
            {saved && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#2DD4BF', display: 'flex', alignItems: 'center', gap: 6 }}>
                ✓ Saved successfully
              </span>
            )}
          </div>

          {/* ── SECURITY SECTION ── */}
          <div className="glass" style={{ padding: 28, marginBottom: 40 }}>
            <SectionTitle>Security</SectionTitle>

            {passwordSaved && (
              <div style={{
                background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#2DD4BF',
              }}>
                ✓ Password updated successfully
              </div>
            )}

            <button
              onClick={() => { setShowPasswordSection(!showPasswordSection); setPasswordError(''); }}
              className="btn-ghost"
              style={{ fontSize: 13, padding: '10px 20px' }}
            >
              {showPasswordSection ? '↑ Cancel' : '🔒 Change Password'}
            </button>

            {showPasswordSection && (
              <div style={{ marginTop: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <FieldLabel>New Password</FieldLabel>
                  <input
                    type="password"
                    className="input-cosmic"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    minLength={8}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <FieldLabel>Confirm New Password</FieldLabel>
                  <input
                    type="password"
                    className="input-cosmic"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>

                {passwordError && (
                  <div style={{
                    background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                    fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#FCA5A5',
                  }}>
                    {passwordError}
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                  className="btn-cosmic"
                  style={{ padding: '11px 28px', fontSize: 13 }}
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>

        </div>
      </Layout>
    </>
  )
}

// ── Sub-components ──────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'Cinzel, serif', fontSize: 12, letterSpacing: '0.12em',
      color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase',
      marginBottom: 20, paddingBottom: 10,
      borderBottom: '1px solid rgba(167,139,250,0.1)',
    }}>
      {children}
    </h2>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{
      fontFamily: 'Inter, sans-serif', fontSize: 11,
      letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)',
      textTransform: 'uppercase', display: 'block', marginBottom: 8,
    }}>
      {children}
      {required && <span style={{ color: '#A78BFA', marginLeft: 4 }}>*</span>}
    </label>
  )
}
