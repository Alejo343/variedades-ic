'use client'

import { useState } from 'react'

const TRUST = [
  {
    label: 'Envío Rápido',
    sub: '1–3 días hábiles',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    label: 'Garantía',
    sub: '12 meses incluidos',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    label: 'Devoluciones',
    sub: '30 días sin costo',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 14 4 9 9 4" />
        <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
      </svg>
    ),
  },
  {
    label: 'Soporte',
    sub: '24 / 7 disponible',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
]

function HeadphonesIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  )
}

export default function Hero3() {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden pt-16"
      style={{ background: '#020c1b' }}
      aria-label="Bienvenida"
    >
      {/* Dot grid texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(59,130,246,0.14) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Ambient top-right glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: '-200px', right: '-120px', pointerEvents: 'none',
          width: '800px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(ellipse at 60% 40%, rgba(29,86,232,0.11) 0%, transparent 60%)',
        }}
      />

      {/* Main content */}
      <div className="flex-1 flex items-center relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-20">
          <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-12 lg:gap-16 items-center">

            {/* LEFT */}
            <div className="v3-in-left">

              {/* Eyebrow */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '6px 18px',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '2px',
                background: 'rgba(59,130,246,0.04)',
                marginBottom: '32px',
              }}>
                <span
                  className="v3-pulse-dot"
                  style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0, display: 'block' }}
                  aria-hidden="true"
                />
                <span style={{
                  fontFamily: 'var(--font-outfit)',
                  fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#60a5fa',
                }}>
                  IC Variedades · Colombia
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily: 'var(--font-orbitron)',
                fontWeight: 800, lineHeight: 1.05, marginBottom: '24px',
              }}>
                <span style={{ display: 'block', fontSize: 'clamp(2rem, 4.8vw, 3.5rem)', color: '#f1f5f9' }}>
                  Todo lo que
                </span>
                <span style={{ display: 'block', fontSize: 'clamp(2rem, 4.8vw, 3.5rem)', color: '#f1f5f9' }}>
                  necesitas,
                </span>
                <span style={{
                  display: 'block', fontSize: 'clamp(2rem, 4.8vw, 3.5rem)',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  en un lugar.
                </span>
              </h1>

              {/* Divider line */}
              <div style={{ width: '56px', height: '2px', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', marginBottom: '24px' }} aria-hidden="true" />

              <p style={{
                fontFamily: 'var(--font-outfit)',
                fontSize: '1.0625rem', lineHeight: 1.75, color: '#64748b',
                maxWidth: '420px', marginBottom: '40px',
              }}>
                Tecnología, belleza y hogar. Productos curados con calidad garantizada y envío rápido a toda Colombia.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '56px' }}>
                <a
                  href="#categorias"
                  style={{
                    padding: '14px 36px', borderRadius: '2px',
                    background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                    color: '#fff', textDecoration: 'none',
                    fontFamily: 'var(--font-orbitron)', fontSize: '12px',
                    fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    boxShadow: '0 0 28px rgba(59,130,246,0.35)',
                    transition: 'box-shadow 0.2s, transform 0.2s', display: 'inline-block',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = '0 0 48px rgba(59,130,246,0.6)'
                    el.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = '0 0 28px rgba(59,130,246,0.35)'
                    el.style.transform = ''
                  }}
                >
                  Ver Catálogo
                </a>
                <a
                  href="#productos"
                  style={{
                    padding: '14px 36px', borderRadius: '2px',
                    border: '1px solid rgba(59,130,246,0.25)',
                    color: '#94a3b8', textDecoration: 'none',
                    fontFamily: 'var(--font-orbitron)', fontSize: '12px',
                    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    transition: 'all 0.2s', display: 'inline-block',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(59,130,246,0.55)'
                    el.style.color = '#e2e8f0'
                    el.style.background = 'rgba(59,130,246,0.05)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(59,130,246,0.25)'
                    el.style.color = '#94a3b8'
                    el.style.background = ''
                  }}
                >
                  Ver Productos →
                </a>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '40px' }}>
                {[
                  { value: '200+', label: 'Productos' },
                  { value: '3', label: 'Categorías' },
                  { value: '100%', label: 'Garantía' },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{
                      fontFamily: 'var(--font-orbitron)', fontSize: '1.5rem',
                      fontWeight: 800, color: '#3b82f6', lineHeight: 1,
                    }}>
                      {s.value}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-outfit)', fontSize: '11px',
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: '#475569', marginTop: '4px',
                    }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: featured product card */}
            <div className="v3-in-right hidden lg:block" aria-label="Producto destacado">
              {/* Gradient border wrapper */}
              <div
                className="v3-hero-card"
                style={{
                  padding: '1px', borderRadius: '4px',
                  background: 'linear-gradient(145deg, rgba(59,130,246,0.5) 0%, rgba(6,182,212,0.25) 50%, rgba(59,130,246,0.08) 100%)',
                }}
              >
                <div style={{ background: '#060f1d', borderRadius: '3px', overflow: 'hidden' }}>

                  {/* Placeholder image */}
                  <div style={{
                    height: '260px', position: 'relative',
                    background: 'linear-gradient(135deg, #0d1e38 0%, #041020 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        backgroundImage: 'radial-gradient(rgba(59,130,246,0.08) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }}
                    />
                    {/* Rings */}
                    <div style={{ position: 'relative', width: '170px', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(59,130,246,0.14)' }} aria-hidden="true" />
                      <div style={{ position: 'absolute', inset: '24px', borderRadius: '50%', border: '1px solid rgba(59,130,246,0.22)', background: 'rgba(59,130,246,0.03)' }} aria-hidden="true" />
                      <div style={{ position: 'absolute', inset: '50px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }} aria-hidden="true" />
                      <HeadphonesIcon />
                    </div>
                    {/* Badge */}
                    <div style={{
                      position: 'absolute', top: '16px', right: '16px',
                      padding: '5px 12px', borderRadius: '2px',
                      background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                      fontFamily: 'var(--font-orbitron)', fontSize: '9px',
                      fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#60a5fa',
                    }}>
                      ★ Más Vendido
                    </div>
                    <div
                      aria-hidden="true"
                      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '72px', background: 'linear-gradient(to top, #060f1d, transparent)' }}
                    />
                  </div>

                  {/* Product details */}
                  <div style={{ padding: '24px 24px 28px' }}>
                    <p style={{
                      fontFamily: 'var(--font-outfit)', fontSize: '10px',
                      letterSpacing: '0.26em', textTransform: 'uppercase',
                      color: '#06b6d4', marginBottom: '8px',
                    }}>
                      Tecnología
                    </p>
                    <h2 style={{
                      fontFamily: 'var(--font-orbitron)', fontSize: '0.9375rem',
                      fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3, marginBottom: '14px',
                    }}>
                      Audífonos Bluetooth Pro X
                    </h2>

                    {/* Specs */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                      {['40h batería', 'ANC activo', 'IP54'].map(spec => (
                        <span key={spec} style={{
                          padding: '3px 10px', borderRadius: '999px',
                          background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.14)',
                          fontFamily: 'var(--font-outfit)', fontSize: '11px', color: '#64748b',
                        }}>
                          {spec}
                        </span>
                      ))}
                    </div>

                    {/* Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
                      <div style={{ display: 'flex', gap: '2px' }} aria-label="4.8 de 5 estrellas">
                        {[1, 2, 3, 4, 5].map(i => (
                          <svg key={i} width="13" height="13" viewBox="0 0 24 24"
                            fill={i <= 4 ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2" aria-hidden="true">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                          </svg>
                        ))}
                      </div>
                      <span style={{ fontFamily: 'var(--font-outfit)', fontSize: '11px', color: '#475569' }}>
                        4.8 · 124 reseñas
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{
                        fontFamily: 'var(--font-orbitron)', fontSize: '1.625rem',
                        fontWeight: 800, color: '#3b82f6', lineHeight: 1,
                      }}>
                        $89.900
                      </span>
                      <button
                        onClick={handleAdd}
                        style={{
                          flex: 1, padding: '13px 0',
                          background: added ? 'linear-gradient(135deg, #065f46, #059669)' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                          border: 'none', borderRadius: '2px',
                          color: '#fff', fontFamily: 'var(--font-orbitron)',
                          fontSize: '11px', fontWeight: 700,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          cursor: 'pointer', transition: 'all 0.2s',
                          boxShadow: added ? '0 0 20px rgba(5,150,105,0.4)' : '0 0 20px rgba(59,130,246,0.35)',
                        }}
                        onMouseEnter={e => {
                          if (!added) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 36px rgba(59,130,246,0.6)'
                        }}
                        onMouseLeave={e => {
                          if (!added) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(59,130,246,0.35)'
                        }}
                        aria-label={`${added ? 'Agregado' : 'Agregar'} Audífonos Bluetooth Pro X al carrito`}
                      >
                        {added ? '✓ Agregado' : '+ Agregar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div style={{
        borderTop: '1px solid rgba(59,130,246,0.08)',
        background: 'rgba(2,8,20,0.85)',
        backdropFilter: 'blur(12px)',
        position: 'relative', zIndex: 10,
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden sm:grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {TRUST.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '20px 0',
                borderLeft: i > 0 ? '1px solid rgba(59,130,246,0.07)' : undefined,
                paddingLeft: i > 0 ? '24px' : undefined,
              }}>
                <span style={{ color: '#3b82f6', flexShrink: 0 }}>{t.icon}</span>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-orbitron)', fontSize: '11px',
                    fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.04em',
                  }}>
                    {t.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-outfit)', fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                    {t.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Mobile: 2-col trust */}
          <div className="sm:hidden grid grid-cols-2 gap-0">
            {TRUST.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 0',
                borderLeft: i % 2 === 1 ? '1px solid rgba(59,130,246,0.07)' : undefined,
                paddingLeft: i % 2 === 1 ? '16px' : undefined,
                borderTop: i >= 2 ? '1px solid rgba(59,130,246,0.07)' : undefined,
              }}>
                <span style={{ color: '#3b82f6', flexShrink: 0 }}>{t.icon}</span>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
