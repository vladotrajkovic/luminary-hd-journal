import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/chart', label: 'Chart Generator', icon: '✺' },
  { href: '/journal', label: 'Journal', icon: '✍' },
  { href: '/journal/new', label: 'New Entry', icon: '✦' },
  { href: '/profile', label: 'My Chart', icon: '◎' },
  { href: '/centers', label: 'Centers', icon: '◯' },
  { href: '/gates', label: 'Gate Library', icon: '⬡' },
  { href: '/transits', label: 'Moon & Transits', icon: '☽' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      setUser(session.user)
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="cosmic-bg" style={{ minHeight: '100vh' }}>
      <div className="stars" />

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 200,
          background: 'rgba(26,10,62,0.8)', border: '1px solid rgba(167,139,250,0.3)',
          borderRadius: 8, padding: '8px 12px', color: '#C4B5FD', cursor: 'pointer',
          display: 'none', fontSize: 18
        }}
        className="mobile-menu-btn"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ zIndex: 150 }}>
        {/* Logo */}
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(167,139,250,0.1)' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#EDE9FE', letterSpacing: '0.12em' }}>
            ✦ LUMINARY
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(167,139,250,0.5)', marginTop: 4 }}>
            Human Design Journal
          </div>
        </div>

        {/* User info */}
        {profile && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(167,139,250,0.08)' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Experimenter
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: '#EDE9FE' }}>
              {profile.full_name || user?.email}
            </div>
            {profile.hd_type && (
              <div style={{
                display: 'inline-block', marginTop: 6, padding: '3px 10px',
                background: 'rgba(123,79,212,0.3)', borderRadius: 12,
                fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#A78BFA',
                border: '1px solid rgba(123,79,212,0.4)'
              }}>
                {profile.hd_type}
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav style={{ padding: '12px 0', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href}>
              <div
                className={`nav-item ${router.pathname === item.href ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span style={{ fontSize: 16, opacity: 0.8 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(167,139,250,0.1)' }}>
          <button
            onClick={handleSignOut}
            style={{
              background: 'none', border: 'none', color: 'rgba(167,139,250,0.4)',
              fontFamily: 'Inter, sans-serif', fontSize: 12, cursor: 'pointer',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#A78BFA')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(167,139,250,0.4)')}
          >
            ↑ Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 140, display: 'none'
          }}
          className="mobile-overlay"
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  )
}
