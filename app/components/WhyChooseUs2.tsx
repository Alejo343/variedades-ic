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

function ShippingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}
function StarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function SupportIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

const REASONS = [
  {
    num: '01',
    icon: <ShippingIcon />,
    title: 'Envío Rápido',
    description: 'Recibe tus pedidos en tiempo récord. Envíos a todo el país con seguimiento en tiempo real.',
  },
  {
    num: '02',
    icon: <ShieldIcon />,
    title: 'Garantía',
    description: 'Todos nuestros productos cuentan con garantía y respaldo oficial del fabricante.',
  },
  {
    num: '03',
    icon: <StarIcon />,
    title: 'Calidad',
    description: 'Solo trabajamos con marcas y productos de alta calidad verificada y probada.',
  },
  {
    num: '04',
    icon: <SupportIcon />,
    title: 'Soporte',
    description: 'Nuestro equipo está disponible para ayudarte antes y después de tu compra.',
  },
]

function ReasonCard({ reason, index }: { reason: typeof REASONS[0]; index: number }) {
  const ref = useScrollReveal(index * 90)

  return (
    <div
      ref={ref}
      className="fade-in"
      style={{
        padding: '32px 28px',
        borderLeft: index > 0 ? '1px solid rgba(59,130,246,0.08)' : undefined,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Decorative number */}
      <div style={{
        fontFamily: 'var(--font-playfair)',
        fontSize: '2.5rem',
        fontWeight: 700,
        fontStyle: 'italic',
        color: 'rgba(59,130,246,0.12)',
        lineHeight: 1,
        marginBottom: '20px',
      }}>
        {reason.num}
      </div>

      {/* Icon */}
      <div style={{ color: '#3b82f6', marginBottom: '16px', opacity: 0.8 }}>
        {reason.icon}
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-playfair)',
        fontSize: '1.1875rem',
        fontWeight: 700,
        color: '#e2e8f0',
        marginBottom: '10px',
        lineHeight: 1.2,
      }}>
        {reason.title}
      </h3>

      {/* Description */}
      <p style={{
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '0.875rem',
        lineHeight: 1.65,
        color: '#475569',
      }}>
        {reason.description}
      </p>
    </div>
  )
}

export default function WhyChooseUs2() {
  const headerRef = useScrollReveal()

  return (
    <section
      id="porque-elegirnos"
      style={{ background: '#060b18', borderTop: '1px solid rgba(59,130,246,0.06)', padding: '80px 0 96px' }}
      aria-labelledby="why2-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div ref={headerRef} className="fade-in mb-12 flex items-end justify-between">
          <div>
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '11px',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: '#475569',
              marginBottom: '10px',
            }}>
              Nuestro compromiso
            </p>
            <h2
              id="why2-heading"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                fontWeight: 700,
                color: '#e2e8f0',
                lineHeight: 1.1,
              }}
            >
              ¿Por qué{' '}
              <span className="text-warm-gradient" style={{ fontStyle: 'italic' }}>elegirnos?</span>
            </h2>
          </div>
          <div className="hidden sm:block" style={{ height: '1px', flex: 1, background: 'rgba(59,130,246,0.08)', marginLeft: '40px', marginBottom: '8px' }} />
        </div>

        {/* Reasons strip */}
        <div
          style={{
            border: '1px solid rgba(59,130,246,0.08)',
            borderRadius: '4px',
            background: '#070d1c',
          }}
        >
          <div className="flex flex-col sm:flex-row">
            {REASONS.map((reason, i) => (
              <ReasonCard key={reason.title} reason={reason} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
