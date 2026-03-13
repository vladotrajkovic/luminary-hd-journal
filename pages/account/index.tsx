import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'

// ── Types ────────────────────────────────────────────────────
interface PlaceResult {
  name: string
  admin1?: string
  country: string
  latitude: number
  longitude: number
  timezone: string
}

interface SelectedPlace {
  display: string
  city: string
  country: string
  lat: number
  lon: number
  timezone: string
}

// ── Main page ────────────────────────────────────────────────
export default function AccountPage() {
  const router = useRouter()

  // Identity
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')

  // Additional info
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [address, setAddress] = useState('')

  // Searchable location
  const [locationInput, setLocationInput] = useState('')
  const [locationResults, setLocationResults] = useState<PlaceResult[]>([])
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null)
  const [searchingLocation, setSearchingLocation] = useState(false)
  const locationTimeout = useRef<any>(null)

  // Preferences
  const [emailSubscribed, setEmailSubscribed] = useState(false)

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // ── Username uniqueness check ──────────────────────────────
  const originalUsername = useRef('')
  const usernameTimeout = useRef<any>(null)

  const handleUsernameChange = (val: string) => {
    setUsername(val)
    setUsernameError('')
    clearTimeout(usernameTimeout.current)
    if (val.trim().length < 2) return
    // Skip check if unchanged from saved value
    if (val.trim().toLowerCase() === originalUsername.current.toLowerCase()) return
    usernameTimeout.current = setTimeout(async () => {
      setCheckingUsername(true)
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', val.trim())
        .maybeSingle()
      setCheckingUsername(false)
      if (data) setUsernameError('This username is already taken.')
    }, 500)
  }

  // ── Location search (Open Meteo geocoding, same as Chart Generator) ──
  const searchLocation = async (query: string) => {
    if (query.length < 2) { setLocationResults([]); return }
    setSearchingLocation(true)
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
      )
      const data = await res.json()
      setLocationResults(data.results || [])
    } catch {
      setLocationResults([])
    }
    setSearchingLocation(false)
  }

  const handleLocationInput = (val: string) => {
    setLocationInput(val)
    setSelectedPlace(null)
    clearTimeout(locationTimeout.current)
    locationTimeout.current = setTimeout(() => searchLocation(val), 350)
  }

  const selectLocation = (place: PlaceResult) => {
    const display = `${place.name}, ${place.country}`
    setSelectedPlace({
      display,
      city: place.name,
      country: place.country,
      lat: place.latitude,
      lon: place.longitude,
      timezone: place.timezone || 'UTC',
    })
    setLocationInput(display)
    setLocationResults([])
  }

  // ── Load profile ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      setUserEmail(session.user.email || '')
      setUserId(session.user.id)

      const { data } = await supabase
        .from('profiles')
        .select(
          'first_name, last_name, username, birth_date, birth_time, location, ' +
          'birth_location_lat, birth_location_lon, birth_location_timezone, ' +
          'address, email_subscribed, avatar_url'
        )
        .eq('id', session.user.id)
        .single()

      if (data) {
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
        setUsername(data.username || '')
        originalUsername.current = data.username || ''
        // Pre-fill birth date & time from chart data
        setBirthDate(data.birth_date || '')
        setBirthTime(data.birth_time || '')
        setAddress(data.address || '')
        setEmailSubscribed(data.email_subscribed || false)
        setAvatarUrl(data.avatar_url || null)

        // Restore saved location
        if (data.location) {
          setLocationInput(data.location)
          if (data.birth_location_lat && data.birth_location_lon) {
            // Reconstruct the selected place from saved data
            const [city, ...rest] = data.location.split(', ')
            setSelectedPlace({
              display: data.location,
              city: city || data.location,
              country: rest.join(', ') || '',
              lat: data.birth_location_lat,
              lon: data.birth_location_lon,
              timezone: data.birth_location_timezone || 'UTC',
            })
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  // ── Avatar upload ──────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please upload an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be under 2MB.')
      return
    }

    setUploadingAvatar(true)
    setAvatarError('')

    const ext = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setAvatarError(uploadError.message)
      setUploadingAvatar(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    setAvatarUrl(publicUrl)
    setUploadingAvatar(false)
  }

  // ── Save profile ───────────────────────────────────────────
  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setError('First name, last name and username are required.')
      return
    }
    if (usernameError) {
      setError('Please choose a different username.')
      return
    }

    setSaving(true)
    setError('')
    setSaved(false)

    // Final username uniqueness check (in case the user didn't wait for the async check)
    if (username.trim().toLowerCase() !== originalUsername.current.toLowerCase()) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username.trim())
        .maybeSingle()
      if (existing) {
        setError('That username is already taken. Please choose another.')
        setSaving(false)
        return
      }
    }

    const { error: saveError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        username: username.trim(),
        birth_date: birthDate || null,
        birth_time: birthTime || null,
        location: selectedPlace ? selectedPlace.display : (locationInput.trim() || null),
        birth_location_lat: selectedPlace?.lat ?? null,
        birth_location_lon: selectedPlace?.lon ?? null,
        birth_location_timezone: selectedPlace?.timezone ?? null,
        address: address.trim() || null,
        email_subscribed: emailSubscribed,
      })
      .eq('id', userId)

    if (saveError) {
      setError(saveError.message)
    } else {
      originalUsername.current = username.trim()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  // ── Change password ────────────────────────────────────────
  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSaved(false)

    if (!oldPassword) { setPasswordError('Current password is required.'); return }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return }
    if (oldPassword === newPassword) { setPasswordError('New password must be different from your current password.'); return }

    setSavingPassword(true)

    // Verify old password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: oldPassword,
    })
    if (signInError) {
      setPasswordError('Current password is incorrect.')
      setSavingPassword(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSaved(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setConfirmPasswordError('')
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
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, letterSpacing: '0.12em', color: '#EDE9FE', marginBottom: 8 }}>
              PERSONAL DETAILS
            </h1>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, color: 'rgba(196,181,253,0.5)' }}>
              Manage your account information
            </p>
          </div>

          {/* ── AVATAR ── */}
          <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
            <SectionTitle>Profile Picture</SectionTitle>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {/* Avatar preview */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                  background: avatarUrl ? 'transparent' : 'rgba(123,79,212,0.2)',
                  border: '2px solid rgba(167,139,250,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', overflow: 'hidden', position: 'relative',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(167,139,250,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)')}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 28, color: 'rgba(167,139,250,0.4)' }}>✦</span>
                )}
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <span style={{ fontSize: 18, color: '#EDE9FE' }}>✎</span>
                </div>
              </div>

              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '8px 18px', marginBottom: 8, display: 'block' }}
                >
                  {uploadingAvatar ? 'Uploading...' : avatarUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.35)', lineHeight: 1.5 }}>
                  JPG, PNG or WebP · Max 2MB
                </p>
                {avatarError && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#FCA5A5', marginTop: 4 }}>
                    {avatarError}
                  </p>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* ── IDENTITY ── */}
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
                onChange={e => handleUsernameChange(e.target.value)}
                placeholder="Your display name"
              />
              {checkingUsername && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.4)', marginTop: 5 }}>
                  Checking availability...
                </p>
              )}
              {usernameError && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#FCA5A5', marginTop: 5 }}>
                  ✗ {usernameError}
                </p>
              )}
              {!usernameError && !checkingUsername && username.trim().length >= 2
                && username.trim().toLowerCase() !== originalUsername.current.toLowerCase() && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#2DD4BF', marginTop: 5 }}>
                  ✓ Username available
                </p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <FieldLabel>Email</FieldLabel>
              <div style={{
                background: 'rgba(15,10,46,0.4)', border: '1px solid rgba(167,139,250,0.1)',
                borderRadius: 8, padding: '10px 14px',
                fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(196,181,253,0.5)',
                minHeight: 40, display: 'flex', alignItems: 'center',
              }}>
                {userEmail}
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.3)', marginTop: 5 }}>
                Email cannot be changed here
              </p>
            </div>
          </div>

          {/* ── ADDITIONAL INFO ── */}
          <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
            <SectionTitle>
              Additional Info{' '}
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.4)', fontWeight: 400, letterSpacing: '0.05em', textTransform: 'none' }}>
                — optional
              </span>
            </SectionTitle>

            {/* Birth Date + Birth Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <FieldLabel>Birth Date</FieldLabel>
                <input
                  type="date"
                  className="input-cosmic"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Birth Time (Local)</FieldLabel>
                <input
                  type="time"
                  className="input-cosmic"
                  value={birthTime}
                  onChange={e => setBirthTime(e.target.value)}
                />
              </div>
            </div>

            {/* Searchable Location */}
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <FieldLabel>Location</FieldLabel>
              <input
                type="text"
                className="input-cosmic"
                value={locationInput}
                onChange={e => handleLocationInput(e.target.value)}
                placeholder="Start typing a city..."
                autoComplete="off"
              />

              {/* Dropdown results */}
              {locationResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'rgba(15,10,46,0.97)', border: '1px solid rgba(123,79,212,0.4)',
                  borderRadius: 8, marginTop: 4, overflow: 'hidden',
                  backdropFilter: 'blur(12px)',
                }}>
                  {locationResults.map((place, i) => (
                    <button
                      key={i}
                      onClick={() => selectLocation(place)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 16px', background: 'none', border: 'none',
                        cursor: 'pointer',
                        borderBottom: i < locationResults.length - 1 ? '1px solid rgba(167,139,250,0.08)' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(123,79,212,0.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#EDE9FE' }}>
                        {place.name}
                      </span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.5)', marginLeft: 8 }}>
                        {place.admin1 ? `${place.admin1}, ` : ''}{place.country}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searchingLocation && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(167,139,250,0.4)', marginTop: 6 }}>
                  Searching...
                </p>
              )}
              {selectedPlace && !searchingLocation && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#2DD4BF', marginTop: 6 }}>
                  ✓ {selectedPlace.timezone}
                </p>
              )}
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

          {/* ── PREFERENCES ── */}
          <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
            <SectionTitle>Preferences</SectionTitle>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer', userSelect: 'none' }}>
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

          {/* Error */}
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
              disabled={saving || !!usernameError || checkingUsername}
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

          {/* ── SECURITY ── */}
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
              onClick={() => {
                setShowPasswordSection(!showPasswordSection)
                setPasswordError('')
                setOldPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setConfirmPasswordError('')
              }}
              className="btn-ghost"
              style={{ fontSize: 13, padding: '10px 20px' }}
            >
              {showPasswordSection ? '↑ Cancel' : '🔒 Change Password'}
            </button>

            {showPasswordSection && (
              <div style={{ marginTop: 20 }}>
                {/* Old Password */}
                <div style={{ marginBottom: 16 }}>
                  <FieldLabel required>Current Password</FieldLabel>
                  <input
                    type="password"
                    className="input-cosmic"
                    value={oldPassword}
                    onChange={e => { setOldPassword(e.target.value); setPasswordError('') }}
                    placeholder="Your current password"
                  />
                </div>

                {/* New Password */}
                <div style={{ marginBottom: 16 }}>
                  <FieldLabel required>New Password</FieldLabel>
                  <input
                    type="password"
                    className="input-cosmic"
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value)
                      setPasswordError('')
                      if (confirmPassword && e.target.value !== confirmPassword) {
                        setConfirmPasswordError('Passwords do not match.')
                      } else {
                        setConfirmPasswordError('')
                      }
                    }}
                    placeholder="Min. 8 characters"
                    minLength={8}
                  />
                </div>

                {/* Confirm New Password */}
                <div style={{ marginBottom: 20 }}>
                  <FieldLabel required>Confirm New Password</FieldLabel>
                  <input
                    type="password"
                    className="input-cosmic"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value)
                      setPasswordError('')
                      if (newPassword && e.target.value !== newPassword) {
                        setConfirmPasswordError('Passwords do not match.')
                      } else {
                        setConfirmPasswordError('')
                      }
                    }}
                    placeholder="Repeat new password"
                    style={{
                      borderColor: confirmPasswordError
                        ? 'rgba(248,113,113,0.6)'
                        : confirmPassword && !confirmPasswordError
                          ? 'rgba(45,212,191,0.4)'
                          : undefined,
                    }}
                  />
                  {confirmPasswordError && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#FCA5A5', marginTop: 5 }}>
                      ✗ {confirmPasswordError}
                    </p>
                  )}
                  {confirmPassword && !confirmPasswordError && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#2DD4BF', marginTop: 5 }}>
                      ✓ Passwords match
                    </p>
                  )}
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
                  disabled={savingPassword || !!confirmPasswordError || !oldPassword || !newPassword || !confirmPassword}
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

// ── Sub-components ────────────────────────────────────────────

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
