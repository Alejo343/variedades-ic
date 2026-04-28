'use client'

const TICKER = [
  'Audífonos Bluetooth Pro',
  'Smartwatch Serie 5',
  'Cámara de Seguridad HD',
  'Cepillo Secador 2 en 1',
  'Plancha Iónica Pro',
  'Tablet Android 10"',
  'Envío Rápido',
  'Garantía Incluida',
  'Soporte 24/7',
]

const STATS = [
  { value: '200+', label: 'Productos' },
  { value: '3', label: 'Categorías' },
  { value: '100%', label: 'Garantía' },
]

const BADGES = [
  { label: 'Tecnología', color: '#38bdf8', top: '-20px', left: '50%', transform: 'translateX(-50%)' },
  { label: 'Belleza',    color: '#c084fc', top: '50%',   right: '-56px', transform: 'translateY(-50%)' },
  { label: 'Hogar',      color: '#34d399', bottom: '-20px', left: '50%', transform: 'translateX(-50%)' },
] as const

export default function Hero2() {
  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden pt-16"
      style={{ background: '#050810' }}
      aria-label="Bienvenida"
    >
      {/* Ambient blue glow — top right */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '700px', height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 65%)',
          top: '-120px', right: '-180px',
          pointerEvents: 'none',
        }}
      />
      {/* Ambient blue glow — bottom left */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '480px', height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)',
          bottom: '60px', left: '-80px',
          pointerEvents: 'none',
        }}
      />

      {/* ── Main content ── */}
      <div className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-16 items-center">

            {/* Left: editorial headline — 3 cols */}
            <div className="lg:col-span-3 flex flex-col gap-8">

              {/* Eyebrow */}
              <div className="hero-enter flex items-center gap-3" style={{ animationDelay: '0.1s' }}>
                <div style={{ width: '32px', height: '1px', background: '#3b82f6', flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '11px',
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  color: '#64748b',
                }}>
                  IC Variedades · Colombia
                </span>
              </div>

              {/* Giant serif headline */}
              <h1
                className="hero-enter"
                style={{
                  animationDelay: '0.2s',
                  fontFamily: 'var(--font-playfair)',
                  lineHeight: '1.04',
                  fontWeight: 700,
                }}
              >
                {(['Tecnología.', 'Belleza.'] as const).map((word) => (
                  <span key={word} style={{ display: 'block', fontSize: 'clamp(2.8rem, 6.5vw, 4.75rem)', color: '#e2e8f0' }}>
                    {word}
                  </span>
                ))}
                <span style={{
                  display: 'block',
                  fontSize: 'clamp(2.8rem, 6.5vw, 4.75rem)',
                  fontStyle: 'italic',
                  color: '#60a5fa',
                }}>
                  Hogar.
                </span>
              </h1>

              {/* Blue divider */}
              <div
                className="hero-enter warm-divider"
                style={{ animationDelay: '0.35s', width: '72px' }}
              />

              {/* Tagline */}
              <p
                className="hero-enter"
                style={{
                  animationDelay: '0.45s',
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '1.0625rem',
                  lineHeight: 1.75,
                  color: '#64748b',
                  maxWidth: '380px',
                }}
              >
                Todo lo que necesitas, curado con estilo y entregado con cuidado.
                Tu tienda de confianza.
              </p>

              {/* CTAs */}
              <div
                className="hero-enter flex flex-wrap gap-4"
                style={{ animationDelay: '0.55s' }}
              >
                <a
                  href="#categorias"
                  style={{
                    padding: '14px 32px',
                    borderRadius: '3px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    fontFamily: 'var(--font-dm-sans)',
                    fontWeight: 700,
                    fontSize: '13px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'background 0.2s, transform 0.2s',
                    display: 'inline-block',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.background = '#60a5fa'
                    el.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.background = '#3b82f6'
                    el.style.transform = ''
                  }}
                >
                  Ver Catálogo
                </a>
                <a
                  href="#porque-elegirnos"
                  style={{
                    padding: '14px 32px',
                    borderRadius: '3px',
                    border: '1px solid rgba(59,130,246,0.28)',
                    color: '#60a5fa',
                    fontFamily: 'var(--font-dm-sans)',
                    fontWeight: 600,
                    fontSize: '13px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    display: 'inline-block',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.borderColor = 'rgba(59,130,246,0.6)'
                    el.style.background = 'rgba(59,130,246,0.06)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.borderColor = 'rgba(59,130,246,0.28)'
                    el.style.background = ''
                  }}
                >
                  ¿Por qué elegirnos? →
                </a>
              </div>
            </div>

            {/* Right: concentric ring decoration — 2 cols */}
            <div
              className="hero-enter-right hidden lg:flex items-center justify-center lg:col-span-2"
              style={{ animationDelay: '0.3s' }}
              aria-hidden="true"
            >
              <div style={{ position: 'relative', width: '288px', height: '288px' }}>
                {/* Outer ring */}
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '50%',
                  border: '1px solid rgba(59,130,246,0.13)',
                }} />
                {/* Mid ring */}
                <div style={{
                  position: 'absolute', inset: '32px',
                  borderRadius: '50%',
                  border: '1px solid rgba(59,130,246,0.08)',
                }} />
                {/* Inner glow fill */}
                <div style={{
                  position: 'absolute', inset: '68px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 40% 40%, rgba(59,130,246,0.08) 0%, transparent 70%)',
                  border: '1px solid rgba(59,130,246,0.06)',
                }} />
                {/* Center logotype */}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '3.75rem',
                    fontWeight: 700,
                    fontStyle: 'italic',
                    color: 'rgba(59,130,246,0.11)',
                    lineHeight: 1,
                  }}>
                    IC
                  </span>
                </div>
                {/* Floating category badges */}
                {BADGES.map((badge) => (
                  <div
                    key={badge.label}
                    style={{
                      position: 'absolute',
                      top: 'top' in badge ? badge.top : undefined,
                      bottom: 'bottom' in badge ? badge.bottom : undefined,
                      left: 'left' in badge ? badge.left : undefined,
                      right: 'right' in badge ? badge.right : undefined,
                      transform: badge.transform,
                      padding: '7px 16px',
                      borderRadius: '999px',
                      background: `${badge.color}12`,
                      border: `1px solid ${badge.color}33`,
                      color: badge.color,
                      fontFamily: 'var(--font-dm-sans)',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ borderTop: '1px solid rgba(59,130,246,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  borderLeft: i > 0 ? '1px solid rgba(59,130,246,0.08)' : undefined,
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  color: '#3b82f6',
                  lineHeight: 1,
                  marginBottom: '4px',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#475569',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Marquee ticker ── */}
      <div
        aria-hidden="true"
        style={{
          borderTop: '1px solid rgba(59,130,246,0.06)',
          background: 'rgba(59,130,246,0.02)',
          overflow: 'hidden',
          padding: '11px 0',
        }}
      >
        <div
          className="marquee-scroll"
          style={{ display: 'flex', width: 'max-content' }}
        >
          {[...TICKER, ...TICKER, ...TICKER].map((item, i) => (
            <span
              key={i}
              style={{
                padding: '0 28px',
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: i % 3 === 0 ? 'rgba(59,130,246,0.55)' : 'rgba(71,85,105,0.55)',
                whiteSpace: 'nowrap',
              }}
            >
              {item}
              <span style={{ marginLeft: '28px', color: 'rgba(71,85,105,0.3)' }}>
                {i % 2 === 0 ? '·' : '—'}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
