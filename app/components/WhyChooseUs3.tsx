'use client'

import { useEffect, useRef } from 'react'

function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect() } },
        { threshold: 0.1 }
      )
      observer.observe(el)
      return () => observer.disconnect()
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])
  return ref
}

const REASONS = [
  {
    num: '01',
    color: '#3b82f6',
    title: 'Calidad Garantizada',
    description: 'Curados manualmente. Solo trabajamos con productos de alto estándar, verificados antes de llegar a tus manos.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    num: '02',
    color: '#06b6d4',
    title: 'Envío Rápido',
    description: 'Despacho en 24h. Recibe tu pedido en 1–3 días hábiles con seguimiento en tiempo real a toda Colombia.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    num: '03',
    color: '#a78bfa',
    title: 'Precios Justos',
    description: 'Directo al consumidor. Sin intermediarios innecesarios, ofrecemos los mejores precios del mercado colombiano.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    num: '04',
    color: '#38bdf8',
    title: 'Soporte Real',
    description: 'Personas reales, no bots. Nuestro equipo responde antes, durante y después de tu compra — siempre disponible.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
]

function ReasonCard({ reason, delay }: { reason: typeof REASONS[0]; delay: number }) {
  const ref = useScrollReveal(delay)

  return (
    <div
      ref={ref}
      className="v3-scroll-reveal"
      style={{
        padding: '32px 28px',
        borderLeft: `3px solid ${reason.color}`,
        background: '#060f1d',
        borderRadius: '0 3px 3px 0',
        transition: 'background 0.25s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `#060f1d` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#060f1d' }}
    >
      {/* Big faint number */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: '-12px', right: '20px',
          fontFamily: 'var(--font-orbitron)', fontSize: '6rem',
          fontWeight: 800, color: `${reason.color}08`, lineHeight: 1, pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {reason.num}
      </div>

      {/* Icon */}
      <div style={{ color: reason.color, marginBottom: '20px', opacity: 0.85 }}>
        {reason.icon}
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-orbitron)', fontSize: '0.9375rem',
        fontWeight: 700, color: '#e2e8f0', marginBottom: '12px', lineHeight: 1.2,
      }}>
        {reason.title}
      </h3>

      {/* Description */}
      <p style={{
        fontFamily: 'var(--font-outfit)', fontSize: '0.875rem',
        lineHeight: 1.7, color: '#475569',
      }}>
        {reason.description}
      </p>
    </div>
  )
}

export default function WhyChooseUs3() {
  const headerRef = useScrollReveal()

  return (
    <section
      id="porque-elegirnos"
      style={{
        background: '#020c1b', padding: '96px 0',
        borderTop: '1px solid rgba(59,130,246,0.06)',
      }}
      aria-labelledby="why3-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div ref={headerRef} className="v3-scroll-reveal" style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '3px', height: '28px', background: 'linear-gradient(to bottom, #3b82f6, #06b6d4)', borderRadius: '999px', flexShrink: 0 }} aria-hidden="true" />
            <span style={{
              fontFamily: 'var(--font-outfit)', fontSize: '11px',
              letterSpacing: '0.32em', textTransform: 'uppercase', color: '#475569',
            }}>
              Nuestro compromiso
            </span>
          </div>
          <h2
            id="why3-heading"
            style={{
              fontFamily: 'var(--font-orbitron)', fontWeight: 800,
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: '#f1f5f9', lineHeight: 1.1,
            }}
          >
            ¿Por qué{' '}
            <span style={{
              background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              elegirnos?
            </span>
          </h2>
        </div>

        {/* 2×2 grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '2px',
          background: 'rgba(59,130,246,0.05)',
          border: '1px solid rgba(59,130,246,0.08)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          {REASONS.map((r, i) => (
            <ReasonCard key={r.num} reason={r} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  )
}
