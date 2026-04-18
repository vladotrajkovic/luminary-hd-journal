import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function ResetPassword() {
  const router = useRouter()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Gate state: true once we confirm a recovery session (from email link)
  // OR we detect the user already has a session.
  const [ready, setReady] = useState(false)
  const [linkInvalid, setLinkInvalid] = useState(false)

  useEffect(() => {
    let resolved = false

    // Supabase fires PASSWORD_RECOVERY when the user arrives via the email link.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        resolved = true
        setReady(true)
      }
    })

    // Also check for an existing session (e.g. user refreshed the page
    // or is already signed in and navigated here directly).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        resolved = true
        setReady(true)
      }
    })

    // If neither path resolves within a short grace period, treat the link
    // as invalid/expired. 2.5s is enough for Supabase to parse the URL hash.
    const timer = setTimeout(() => {
      if (!resolved) setLinkInvalid(true)
    }, 2500)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Sign the user out of the recovery session so they log in cleanly with
    // the new password. Then redirect after a short beat.
    setTimeout(async () => {
      await supabase.auth.signOut()
      router.push('/auth/login')
    }, 2200)
  }

  // ── Expired/invalid link state ────────────────────────────
  if (linkInvalid && !ready) {
    return (
      <>
        <Head>
          <title>Link Expired — Luminary</title>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
        </Head>
        <div className="cosmic-bg min-h-screen flex items-center justify-center relative">
          <div className="stars" />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, padding: '0 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.6 }}>✦</div>
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 20, letterSpacing: '0.12em', color: '#EDE9FE', marginBottom: 16 }}>
              THIS LINK HAS EXPIRED
            </h1>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, color: 'rgba(196,181,253,0.65)', marginBottom: 32, lineHeight: 1.6 }}>
              Password reset links are valid for one hour. Please request a new one to continue.
            </p>
            <Link href="/auth/forgot-password">
              <button className="btn-cosmic" style={{ padding: '14px 32px', fontSize: 13 }}>
                Request a New Link →
              </button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  // ── Loading state (while we confirm the recovery session) ─
  if (!ready && !linkInvalid) {
    return (
      <div className="cosmic-bg min-h-screen flex items-center justify-center relative">
        <div className="stars" />
        <div style={{ position: 'relative', zIndex: 1, fontFamily: 'Cinzel, serif', color: 'rgba(167,139,250,0.5)', letterSpacing: '0.1em' }}>
          ✦ Verifying your link...
        </div>
      </div>
    )
  }

  // ── Success state ─────────────────────────────────────────
  if (success) {
    return (
      <>
        <Head>
          <title>Password Updated — Luminary</title>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
        </Head>
        <div className="cosmic-bg min-h-screen flex items-center justify-center relative">
          <div className="stars" />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, padding: '0 24px', textAlign: 'center' }}>
            <div className="animate-float" style={{ fontSize: 56, marginBottom: 24 }}>✦</div>
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, letterSpacing: '0.12em', color: '#EDE9FE', marginBottom: 16 }}>
              PASSWORD UPDATED
            </h1>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,0.7)', lineHeight: 1.6 }}>
              Redirecting you to sign in...
            </p>
          </div>
        </div>
      </>
    )
  }

  // ── Form ──────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Set New Password — Luminary HD Journal</title>
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
              Choose a new password
            </p>
          </div>

          {/* Form */}
          <div className="glass" style={{ padding: 36 }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 16, letterSpacing: '0.1em', color: '#C4B5FD', marginBottom: 28, textAlign: 'center' }}>
              SET NEW PASSWORD
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

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  New Password
                </label>
                <input
                  type="password"
                  className="input-cosmic"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setError('') }}
                  placeholder="Min. 8 characters"
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="input-cosmic"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  placeholder="Re-enter your new password"
                  required
                />
              </div>

              <button type="submit" className="btn-cosmic" style={{ width: '100%', padding: '14px', fontSize: 13 }} disabled={loading}>
                {loading ? '✦ Updating...' : 'Update Password →'}
              </button>
            </form>

            <hr className="divider-cosmic" />

            <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(167,139,250,0.5)' }}>
              <Link href="/auth/login" style={{ color: '#A78BFA', textDecoration: 'none' }}>
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
