import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      <Head>
        <title>Sign In — Luminary HD Journal</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <div className="cosmic-bg min-h-screen flex items-center justify-center relative">
        <div className="stars" />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, padding: '0 24px' }}>
          
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, letterSpacing: '0.15em', color: '#EDE9FE' }}>
              LUMINARY
            </h1>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(196,181,253,0.6)', marginTop: 6 }}>
              Return to your experiment
            </p>
          </div>

          {/* Form */}
          <div className="glass" style={{ padding: 36 }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 16, letterSpacing: '0.1em', color: '#C4B5FD', marginBottom: 28, textAlign: 'center' }}>
              SIGN IN
            </h2>

            {error && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#FCA5A5'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Email
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

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Password
                </label>
                <input
                  type="password"
                  className="input-cosmic"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Forgot password link */}
              <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <Link
                  href="/auth/forgot-password"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    color: 'rgba(167,139,250,0.7)',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                  }}
                >
                  Forgot your password?
                </Link>
              </div>

              <button type="submit" className="btn-cosmic" style={{ width: '100%', padding: '14px', fontSize: 13 }} disabled={loading}>
                {loading ? '✦ Entering...' : 'Enter Your Sacred Space →'}
              </button>
            </form>

            <hr className="divider-cosmic" />

            <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(167,139,250,0.5)' }}>
              New to Luminary?{' '}
              <Link href="/auth/register" style={{ color: '#A78BFA', textDecoration: 'none' }}>
                Begin your journey
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
