import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function Register() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Check username availability as the user types (debounced inline)
  let usernameTimeout: any = null
  const handleUsernameChange = (val: string) => {
    setUsername(val)
    setUsernameError('')
    clearTimeout(usernameTimeout)
    if (val.trim().length < 2) return
    usernameTimeout = setTimeout(async () => {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameError) return
    setLoading(true)
    setError('')

    // Final uniqueness check before submitting
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username.trim())
      .maybeSingle()

    if (existing) {
      setError('That username is already taken. Please choose another.')
      setLoading(false)
      return
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <>
        <Head>
          <title>Welcome — Luminary HD Journal</title>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
        </Head>
        <div className="cosmic-bg min-h-screen flex items-center justify-center">
          <div className="stars" />
          <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px', position: 'relative', zIndex: 1 }}>
            <div className="animate-float" style={{ fontSize: 64, marginBottom: 24 }}>✦</div>
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 28, letterSpacing: '0.1em', color: '#EDE9FE', marginBottom: 16 }}>
              WELCOME, STARLIGHT
            </h1>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 20, color: 'rgba(196,181,253,0.7)', marginBottom: 32, lineHeight: 1.6 }}>
              Your account has been created. Check your email to confirm your address, then begin your experiment.
            </p>
            <Link href="/auth/login">
              <button className="btn-cosmic" style={{ padding: '14px 36px' }}>
                Sign In →
              </button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Begin Your Journey — Luminary HD Journal</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <div className="cosmic-bg min-h-screen flex items-center justify-center relative py-12">
        <div className="stars" />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, padding: '0 24px' }}>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, letterSpacing: '0.15em', color: '#EDE9FE' }}>
              LUMINARY
            </h1>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(196,181,253,0.6)', marginTop: 6 }}>
              Begin your Human Design experiment
            </p>
          </div>

          <div className="glass" style={{ padding: 36 }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 16, letterSpacing: '0.1em', color: '#C4B5FD', marginBottom: 28, textAlign: 'center' }}>
              CREATE YOUR ACCOUNT
            </h2>

            {error && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#FCA5A5',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister}>

              {/* First + Last Name */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  Your First &amp; Last Name <span style={{ color: '#A78BFA' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input
                    type="text"
                    className="input-cosmic"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="First name"
                    required
                  />
                  <input
                    type="text"
                    className="input-cosmic"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  Your Username <span style={{ color: '#A78BFA' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-cosmic"
                  value={username}
                  onChange={e => handleUsernameChange(e.target.value)}
                  placeholder="How you wish to be called"
                  required
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
                {!usernameError && !checkingUsername && username.trim().length >= 2 && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#2DD4BF', marginTop: 5 }}>
                    ✓ Username available
                  </p>
                )}
              </div>

              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  Email <span style={{ color: '#A78BFA' }}>*</span>
                </label>
                <input
                  type="email"
                  className="input-cosmic"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>
                  Password <span style={{ color: '#A78BFA' }}>*</span>
                </label>
                <input
                  type="password"
                  className="input-cosmic"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-cosmic"
                style={{ width: '100%', padding: '14px', fontSize: 13 }}
                disabled={loading || !!usernameError || checkingUsername}
              >
                {loading ? '✦ Creating your space...' : 'Begin My Experiment →'}
              </button>
            </form>

            <hr className="divider-cosmic" />

            <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(167,139,250,0.5)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: '#A78BFA', textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: 24 }}>
            <Link href="/" style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(167,139,250,0.4)', textDecoration: 'none' }}>
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  letterSpacing: '0.1em',
  color: 'rgba(167,139,250,0.7)',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 8,
}
