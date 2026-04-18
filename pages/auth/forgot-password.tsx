import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/reset-password`
        : undefined

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  // ── Success state ─────────────────────────────────────────
  if (sent) {
    return (
      <>
        <Head>
          <title>Check Your Email — Luminary</title>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
        </Head>
        <div className="cosmic-bg min-h-screen flex items-center justify-center relative">
          <div className="stars" />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, padding: '0 24px', textAlign: 'center' }}>
            <div className="animate-float" style={{ fontSize: 56, marginBottom: 24 }}>✦</div>
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, letterSpacing: '0.12em', color: '#EDE9FE', marginBottom: 16 }}>
              CHECK YOUR EMAIL
            </h1>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,0.7)', marginBottom: 12, lineHeight: 1.6 }}>
              If an account exists for <strong style={{ color: '#C4B5FD', fontStyle: 'normal' }}>{email}</strong>, a reset link is on its way.
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(167,139,250,0.55)', marginBottom: 32, lineHeight: 1.7 }}>
              The link will expire in one hour. Be sure to check your spam folder if you don't see it soon.
            </p>

            <Link href="/auth/login">
              <button className="btn-cosmic" style={{ padding: '14px 36px', fontSize: 13 }}>
                Return to Sign In →
              </button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  // ── Form ──────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Reset Password — Luminary HD Journal</title>
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
              We'll send you back to yourself
            </p>
          </div>

          {/* Form */}
          <div className="glass" style={{ padding: 36 }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 16, letterSpacing: '0.1em', color: '#C4B5FD', marginBottom: 12, textAlign: 'center' }}>
              RESET PASSWORD
            </h2>

            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(196,181,253,0.55)', textAlign: 'center', marginBottom: 28, lineHeight: 1.5 }}>
              Enter the email linked to your account and we'll send you a secure reset link.
            </p>

            {error && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#FCA5A5'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
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
                  autoFocus
                />
              </div>

              <button type="submit" className="btn-cosmic" style={{ width: '100%', padding: '14px', fontSize: 13 }} disabled={loading || !email.trim()}>
                {loading ? '✦ Sending...' : 'Send Reset Link →'}
              </button>
            </form>

            <hr className="divider-cosmic" />

            <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(167,139,250,0.5)' }}>
              Remembered it?{' '}
              <Link href="/auth/login" style={{ color: '#A78BFA', textDecoration: 'none' }}>
                Back to sign in
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
