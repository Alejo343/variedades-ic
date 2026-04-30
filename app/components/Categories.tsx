'use client'

import { useEffect, useRef } from 'react'

type CategoryWithCount = {
  id: number
  name: string
  slug: string
  description: string | null
  color: string | null
  imageUrl: string | null
  productCount: number
}

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

function MonitorIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function DiamondIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function getCategoryIcon(slug: string) {
  const s = slug.toLowerCase()
  if (s.includes('tecnol') || s.includes('tech') || s.includes('electr')) return <MonitorIcon />
  if (s.includes('belleza') || s.includes('beauty') || s.includes('cosmet') || s.includes('cuidado')) return <DiamondIcon />
  if (s.includes('hogar') || s.includes('home') || s.includes('casa')) return <HomeIcon />
  return <GridIcon />
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function makeCatGradient(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  const d1 = `rgb(${Math.floor(r * 0.14)},${Math.floor(g * 0.14)},${Math.floor(b * 0.14)})`
  const d2 = `rgb(${Math.floor(r * 0.05)},${Math.floor(g * 0.05)},${Math.floor(b * 0.05)})`
  return `linear-gradient(145deg, ${d1} 0%, ${d2} 60%, #020c1b 100%)`
}

function CategoryCard({ cat, delay }: { cat: CategoryWithCount; delay: number }) {
  const ref = useScrollReveal(delay)
  const color = cat.color ?? '#3b82f6'
  const colorDim = `${color}1e`
  const bg = makeCatGradient(color)
  const icon = getCategoryIcon(cat.slug)
  const countLabel = cat.productCount > 0 ? `${cat.productCount} producto${cat.productCount !== 1 ? 's' : ''}` : 'Sin productos aún'

  return (
    <div
      ref={ref}
      className="scroll-reveal"
      style={{ borderRadius: '3px', overflow: 'hidden', border: `1px solid ${colorDim}`, position: 'relative', cursor: 'pointer' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = `0 0 48px ${color}20`
        el.style.borderColor = `${color}40`
        const img = el.querySelector('.cat-img') as HTMLElement | null
        if (img) img.style.transform = 'scale(1.04)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = ''
        el.style.borderColor = colorDim
        const img = el.querySelector('.cat-img') as HTMLElement | null
        if (img) img.style.transform = 'scale(1)'
      }}
    >
      <a href={`/productos?categoria=${cat.slug}`} style={{ textDecoration: 'none', display: 'block' }} aria-label={`Ver categoría ${cat.name}`}>

        {/* Visual area */}
        <div
          className="cat-img"
          style={{
            height: '260px', background: cat.imageUrl ? undefined : bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
          }}
        >
          {cat.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cat.imageUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  backgroundImage: `radial-gradient(${color}18 1px, transparent 1px)`,
                  backgroundSize: '22px 22px',
                }}
              />
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  width: '160px', height: '160px', borderRadius: '50%',
                  background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
                  border: `1px solid ${color}20`,
                }}
              />
              <span style={{ color, opacity: 0.75, position: 'relative', zIndex: 1 }}>
                {icon}
              </span>
            </>
          )}
          {/* Product count badge */}
          <div style={{
            position: 'absolute', top: '16px', left: '16px',
            padding: '4px 12px', borderRadius: '2px',
            background: `${color}14`, border: `1px solid ${color}2a`,
            fontFamily: 'var(--font-outfit)', fontSize: '11px',
            letterSpacing: '0.1em', color,
          }}>
            {countLabel}
          </div>
          {/* Bottom gradient */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
              background: 'linear-gradient(to top, #060f1d, transparent)',
            }}
          />
        </div>

        {/* Text area */}
        <div style={{
          background: '#060f1d', padding: '22px 24px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1px solid ${colorDim}`,
        }}>
          <div>
            <h3 style={{
              fontFamily: 'var(--font-orbitron)', fontSize: '1rem',
              fontWeight: 700, color: '#e2e8f0', marginBottom: '4px',
            }}>
              {cat.name}
            </h3>
            {cat.description && (
              <p style={{
                fontFamily: 'var(--font-outfit)', fontSize: '12px',
                letterSpacing: '0.08em', color: '#475569',
              }}>
                {cat.description}
              </p>
            )}
          </div>
          <span style={{
            fontFamily: 'var(--font-orbitron)', fontSize: '11px',
            fontWeight: 600, letterSpacing: '0.08em', color,
            textTransform: 'uppercase',
          }}>
            Explorar →
          </span>
        </div>
      </a>
    </div>
  )
}

export default function Categories({ categories }: { categories: CategoryWithCount[] }) {
  const headerRef = useScrollReveal()

  return (
    <section
      id="categorias"
      style={{ background: '#020c1b', padding: '96px 0' }}
      aria-labelledby="categories3-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div ref={headerRef} className="scroll-reveal" style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '3px', height: '28px', background: 'linear-gradient(to bottom, #3b82f6, #06b6d4)', borderRadius: '999px', flexShrink: 0 }} aria-hidden="true" />
            <span style={{
              fontFamily: 'var(--font-outfit)', fontSize: '11px',
              letterSpacing: '0.32em', textTransform: 'uppercase', color: '#475569',
            }}>
              Lo que ofrecemos
            </span>
          </div>
          <h2
            id="categories3-heading"
            style={{
              fontFamily: 'var(--font-orbitron)', fontWeight: 800,
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: '#f1f5f9', lineHeight: 1.1,
            }}
          >
            Nuestras{' '}
            <span style={{
              background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Categorías
            </span>
          </h2>
        </div>

        {/* Grid */}
        {categories.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {categories.map((cat, i) => (
              <CategoryCard key={cat.id} cat={cat} delay={i * 80} />
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--font-outfit)', color: '#475569', fontSize: '14px' }}>
            Próximamente más categorías.
          </p>
        )}
      </div>
    </section>
  )
}
