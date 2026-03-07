import Head from 'next/head'
import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import { GATES_64 } from '../../lib/hdData'

export default function GateLibrary() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'detail'>('grid')

  const filtered = Object.entries(GATES_64).filter(([num, gate]) =>
    search === '' ||
    num.includes(search) ||
    gate.name.toLowerCase().includes(search.toLowerCase()) ||
    gate.keyword.toLowerCase().includes(search.toLowerCase())
  )

  const selectedGate = selected ? GATES_64[selected] : null

  return (
    <>
      <Head>
        <title>Gate Library — Luminary</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <Layout>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
            I Ching · Gene Keys · Human Design
          </p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 32, color: '#EDE9FE', letterSpacing: '0.05em' }}>
            The 64 Gates
          </h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(196,181,253,0.6)', marginTop: 8 }}>
            The genetic code of consciousness — 64 archetypes corresponding to the 64 hexagrams of the I Ching
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 28 }}>
          <input
            className="input-cosmic"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by gate number, name, or keyword..."
            style={{ maxWidth: 400 }}
          />
        </div>

        {/* Gate Detail Panel */}
        {selected && selectedGate && (
          <div className="glass" style={{ padding: 32, marginBottom: 32, borderColor: 'rgba(212,175,55,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: 56, color: '#D4AF37', lineHeight: 1 }}>{selected}</span>
                <div>
                  <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#EDE9FE', letterSpacing: '0.05em' }}>{selectedGate.name}</h2>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18, color: '#A78BFA' }}>{selectedGate.keyword}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost" style={{ fontSize: 12 }}>× Close</button>
            </div>

            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'rgba(196,181,253,0.8)', marginBottom: 24, lineHeight: 1.7 }}>
              {selectedGate.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Shadow', value: selectedGate.shadow, color: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
                { label: 'Gift', value: selectedGate.gift, color: '#2DD4BF', bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.2)' },
                { label: 'Siddhi', value: selectedGate.siddhi, color: '#D4AF37', bg: 'rgba(212,175,55,0.08)', border: 'rgba(212,175,55,0.2)' },
              ].map(item => (
                <div key={item.label} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: item.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, opacity: 0.7 }}>{item.label}</p>
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gate Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {filtered.map(([num, gate]) => (
            <div
              key={num}
              className="glass gate-card"
              onClick={() => setSelected(selected === num ? null : num)}
              style={{
                padding: '18px 20px', cursor: 'pointer',
                borderColor: selected === num ? 'rgba(212,175,55,0.5)' : 'rgba(167,139,250,0.15)',
                background: selected === num ? 'rgba(212,175,55,0.06)' : undefined
              }}
            >
              <div className="gate-number" style={{ fontSize: 28, marginBottom: 6 }}>{num}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#A78BFA', letterSpacing: '0.05em', marginBottom: 4 }}>
                {gate.keyword}
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(196,181,253,0.5)', lineHeight: 1.3 }}>
                {gate.name}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  { label: gate.shadow, color: 'rgba(248,113,113,0.6)' },
                  { label: gate.gift, color: 'rgba(45,212,191,0.6)' },
                  { label: gate.siddhi, color: 'rgba(212,175,55,0.6)' },
                ].map(item => (
                  <span key={item.label} style={{
                    fontSize: 10, fontFamily: 'Inter, sans-serif',
                    color: item.color, background: `${item.color.replace('0.6', '0.1')}`,
                    padding: '2px 6px', borderRadius: 4,
                  }}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Layout>
    </>
  )
}
