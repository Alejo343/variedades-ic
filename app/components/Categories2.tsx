'use client'

import { useEffect, useRef } from 'react'

function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return ref
}

function TechIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function BeautyIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

const CATEGORIES = [
  {
    num: '01',
    id: 'tecnologia',
    label: 'Tecnología',
    sub: 'Gadgets & Accesorios',
    description: 'Audífonos, smartwatches, tablets y los mejores gadgets para tu día a día.',
    color: '#38bdf8',
    icon: <TechIcon />,
    accent: 'rgba(56,189,248,0.05)',
  },
  {
    num: '02',
    id: 'belleza',
    label: 'Belleza',
    sub: 'Cuidado Personal',
    description: 'Cepillos secadores, planchas iónicas y herramientas profesionales para tu rutina.',
    color: '#c084fc',
    icon: <BeautyIcon />,
    accent: 'rgba(192,132,252,0.05)',
  },
  {
    num: '03',
    id: 'hogar',
    label: 'Hogar',
    sub: 'Electrodomésticos Inteligentes',
    description: 'Cámaras de seguridad, electrodomésticos y todo para hacer tu hogar más inteligente.',
    color: '#34d399',
    icon: <HomeIcon />,
    accent: 'rgba(52,211,153,0.05)',
  },
]

function CategoryRow({ cat, index }: { cat: typeof CATEGORIES[0]; index: number }) {
  const ref = useScrollReveal()
  const isEven = index % 2 === 0

  return (
    <div
      ref={ref}
      id={cat.id}
      className="fade-in group"
      style={{
        background: isEven ? 'transparent' : 'rgba(59,130,246,0.02)',
        borderTop: '1px solid rgba(59,130,246,0.08)',
        cursor: 'pointer',
        transition: 'background 0.3s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = cat.accent }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isEven ? 'transparent' : 'rgba(59,130,246,0.02)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-4 items-center py-10 lg:py-14">

          {/* Number + Icon — 2 cols */}
          <div className="col-span-3 lg:col-span-2 flex items-center gap-4 lg:gap-6">
            <span style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: 'rgba(59,130,246,0.18)',
              lineHeight: 1,
              flexShrink: 0,
            }}>
              {cat.num}
            </span>
            <div style={{ color: cat.color, opacity: 0.7 }}>
              {cat.icon}
            </div>
          </div>

          {/* Category name — 4 cols on lg */}
          <div className="col-span-9 lg:col-span-4">
            <h3 style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 700,
              color: '#e2e8f0',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}>
              {cat.label}
            </h3>
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '12px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: cat.color,
              opacity: 0.75,
            }}>
              {cat.sub}
            </p>
          </div>

          {/* Description + CTA — 6 cols on lg */}
          <div className="hidden lg:flex col-span-6 items-center justify-between gap-8">
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '0.9375rem',
              lineHeight: 1.65,
              color: '#475569',
              maxWidth: '340px',
            }}>
              {cat.description}
            </p>
            <span
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '12px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: cat.color,
                flexShrink: 0,
                transition: 'letter-spacing 0.25s ease',
              }}
              className="group-hover:[letter-spacing:0.25em]"
            >
              Explorar →
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Categories2() {
  const headerRef = useScrollReveal()

  return (
    <section
      className="py-20"
      style={{ background: '#050810' }}
      aria-labelledby="categories2-heading"
    >
      {/* Section header */}
      <div ref={headerRef} className="fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-end justify-between">
          <div>
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '11px',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: '#475569',
              marginBottom: '10px',
            }}>
              Lo que ofrecemos
            </p>
            <h2
              id="categories2-heading"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                fontWeight: 700,
                color: '#e2e8f0',
                lineHeight: 1.1,
              }}
            >
              Nuestras{' '}
              <span className="text-warm-gradient">Categorías</span>
            </h2>
          </div>
          <div className="hidden sm:block" style={{ height: '1px', flex: 1, background: 'rgba(59,130,246,0.08)', marginLeft: '40px', marginBottom: '8px' }} />
        </div>
      </div>

      {/* Category rows */}
      <div style={{ borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
        {CATEGORIES.map((cat, i) => (
          <CategoryRow key={cat.id} cat={cat} index={i} />
        ))}
      </div>
    </section>
  )
}
