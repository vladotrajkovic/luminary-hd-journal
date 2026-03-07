import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      <Head>
        <title>Luminary — Human Design Journal</title>
        <meta name="description" content="Your sacred space for Human Design exploration, journaling, and self-discovery" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Cinzel:wght@400;500;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <div className="cosmic-bg min-h-screen relative overflow-hidden">
        {/* Stars Background */}
        <div className="stars" />

        {/* Decorative orbs */}
        <div style={{
          position: 'fixed', top: '10%', right: '10%', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(76,42,158,0.2) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'fixed', bottom: '20%', left: '5%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', filter: 'blur(30px)'
        }} />

        {/* Nav */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(3, 2, 10, 0.4)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(167,139,250,0.1)'
        }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#EDE9FE', letterSpacing: '0.1em' }}>
            ✦ LUMINARY
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/auth/login">
              <button className="btn-ghost" style={{ fontFamily: 'Cinzel, serif', fontSize: 12 }}>
                Sign In
              </button>
            </Link>
            <Link href="/auth/register">
              <button className="btn-cosmic" style={{ fontSize: 12 }}>
                Begin Your Journey
              </button>
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <main style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', textAlign: 'center', padding: '0 24px', position: 'relative', zIndex: 1
        }}>
          {/* Symbol */}
          <div className="animate-float" style={{ fontSize: 64, marginBottom: 32, opacity: 0.85 }}>
            ✦
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'Cinzel, serif', fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 400, letterSpacing: '0.08em', color: '#EDE9FE',
            lineHeight: 1.2, marginBottom: 24, maxWidth: 800
          }}>
            YOUR COSMIC<br />
            <span style={{ color: '#A78BFA' }}>HUMAN DESIGN</span><br />
            JOURNAL
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontStyle: 'italic',
            color: 'rgba(196, 181, 253, 0.7)', maxWidth: 560, marginBottom: 16, lineHeight: 1.6
          }}>
            A sacred space to explore your unique blueprint, track your experiment, and deepen your self-knowledge.
          </p>

          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: 13, letterSpacing: '0.15em',
            color: 'rgba(167, 139, 250, 0.5)', textTransform: 'uppercase', marginBottom: 48
          }}>
            All 64 Gates · 9 Centers · Type & Authority · Moon Transits
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/auth/register">
              <button className="btn-cosmic" style={{ padding: '14px 36px', fontSize: 14 }}>
                Start Your Experiment →
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="btn-ghost" style={{ padding: '14px 36px', fontSize: 14 }}>
                I Already Have an Account
              </button>
            </Link>
          </div>

          {/* Feature Pills */}
          <div style={{ display: 'flex', gap: 12, marginTop: 64, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              '✦ Daily Journal Prompts',
              '◈ Gate Reference Library',
              '◯ Centers Tracker',
              '☽ Moon & Transit Log',
              '✧ Type-Specific Guidance',
              '◎ Deconditioning Tools',
            ].map(feat => (
              <span key={feat} style={{
                background: 'rgba(45, 27, 105, 0.4)',
                border: '1px solid rgba(167, 139, 250, 0.2)',
                borderRadius: 20, padding: '8px 16px',
                fontFamily: 'Inter, sans-serif', fontSize: 12,
                color: 'rgba(196, 181, 253, 0.7)',
                letterSpacing: '0.05em'
              }}>
                {feat}
              </span>
            ))}
          </div>
        </main>

        {/* How it Works */}
        <section style={{ padding: '80px 24px', maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: 'Cinzel, serif', textAlign: 'center', fontSize: 28,
            letterSpacing: '0.1em', color: '#C4B5FD', marginBottom: 16
          }}>
            YOUR EXPERIMENT AWAITS
          </h2>
          <p style={{
            textAlign: 'center', fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic', color: 'rgba(196,181,253,0.6)', fontSize: 18, marginBottom: 56
          }}>
            Human Design is not a belief system — it is a lived experiment. Begin here.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                icon: '①',
                title: 'Set Up Your Chart',
                text: 'Enter your birth data and configure your HD Type, Authority, Profile, and Centers. Your blueprint becomes your personal compass.'
              },
              {
                icon: '②',
                title: 'Journal Daily',
                text: 'Write reflections guided by your specific Type and Authority. Track your strategy, open centers, synchronicities, and deconditioning progress.'
              },
              {
                icon: '③',
                title: 'Explore Your Design',
                text: 'Dive into all 64 gates, your channels, centers, and the moon transits affecting your energy field each day.'
              },
            ].map(step => (
              <div key={step.icon} className="glass glass-hover" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 40, color: '#D4AF37', marginBottom: 16, fontFamily: 'Cinzel, serif' }}>
                  {step.icon}
                </div>
                <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 16, letterSpacing: '0.08em', color: '#EDE9FE', marginBottom: 12 }}>
                  {step.title}
                </h3>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'rgba(196,181,253,0.6)', lineHeight: 1.6 }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: 'center', padding: '32px 24px',
          borderTop: '1px solid rgba(167, 139, 250, 0.1)',
          fontFamily: 'Inter, sans-serif', fontSize: 12,
          color: 'rgba(167,139,250,0.3)', letterSpacing: '0.1em',
          position: 'relative', zIndex: 1
        }}>
          ✦ LUMINARY — HUMAN DESIGN JOURNAL ✦
        </footer>
      </div>
    </>
  )
}
