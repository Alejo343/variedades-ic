'use client'

import { useEffect, useRef, useState } from 'react'

function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect() } },
        { threshold: 0.08 }
      )
      observer.observe(el)
      return () => observer.disconnect()
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])
  return ref
}

/* ── Icons ── */
function HeadphonesIcon() {
  return <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
}
function WatchIcon() {
  return <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v6l4 2"/></svg>
}
function CameraIcon() {
  return <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
}
function BrushIcon() {
  return <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
}
function ZapIcon() {
  return <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
}
function TabletIcon() {
  return <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
}

const PRODUCTS = [
  {
    id: 1, name: 'Audífonos Bluetooth Pro X', price: '$89.900', category: 'Tecnología',
    color: '#3b82f6', bg: 'linear-gradient(145deg, #0d1e3f, #041020)',
    icon: <HeadphonesIcon />, badge: 'Más Vendido',
  },
  {
    id: 2, name: 'Smartwatch Serie 5', price: '$129.900', category: 'Tecnología',
    color: '#60a5fa', bg: 'linear-gradient(145deg, #0a1835, #030e20)',
    icon: <WatchIcon />, badge: null,
  },
  {
    id: 3, name: 'Cámara de Seguridad HD', price: '$75.900', category: 'Hogar',
    color: '#06b6d4', bg: 'linear-gradient(145deg, #041c25, #021018)',
    icon: <CameraIcon />, badge: 'Nuevo',
  },
  {
    id: 4, name: 'Cepillo Secador 2 en 1', price: '$95.900', category: 'Belleza',
    color: '#a78bfa', bg: 'linear-gradient(145deg, #1a0d35, #0c0520)',
    icon: <BrushIcon />, badge: null,
  },
  {
    id: 5, name: 'Plancha Iónica Pro', price: '$68.900', category: 'Belleza',
    color: '#c084fc', bg: 'linear-gradient(145deg, #160a28, #090318)',
    icon: <ZapIcon />, badge: null,
  },
  {
    id: 6, name: 'Tablet Android 10"', price: '$199.900', category: 'Tecnología',
    color: '#38bdf8', bg: 'linear-gradient(145deg, #0c1d3a, #041020)',
    icon: <TabletIcon />, badge: 'Destacado',
  },
]

function ProductCard({ product, delay }: { product: typeof PRODUCTS[0]; delay: number }) {
  const ref = useScrollReveal(delay)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <article
      ref={ref}
      className="scroll-reveal group"
      style={{
        background: '#060f1d',
        border: '1px solid rgba(59,130,246,0.09)',
        borderRadius: '3px', overflow: 'hidden',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = `${product.color}35`
        el.style.boxShadow = `0 0 40px ${product.color}10`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(59,130,246,0.09)'
        el.style.boxShadow = ''
      }}
    >
      {/* Image area */}
      <div style={{
        height: '190px', background: product.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `radial-gradient(${product.color}12 1px, transparent 1px)`,
            backgroundSize: '18px 18px',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: '100px', height: '100px', borderRadius: '50%',
            background: `radial-gradient(circle, ${product.color}14 0%, transparent 70%)`,
          }}
        />
        <span style={{ color: product.color, opacity: 0.8, position: 'relative', zIndex: 1 }}>
          {product.icon}
        </span>

        {/* Category badge */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          padding: '3px 10px', borderRadius: '2px',
          background: `${product.color}12`, border: `1px solid ${product.color}28`,
          fontFamily: 'var(--font-outfit)', fontSize: '10px',
          letterSpacing: '0.12em', textTransform: 'uppercase', color: product.color,
        }}>
          {product.category}
        </div>

        {/* Special badge */}
        {product.badge && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            padding: '3px 10px', borderRadius: '2px',
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
            fontFamily: 'var(--font-orbitron)', fontSize: '9px',
            fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#60a5fa',
          }}>
            {product.badge}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
        <h3 style={{
          fontFamily: 'var(--font-orbitron)', fontSize: '0.875rem',
          fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3,
        }}>
          {product.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{
            fontFamily: 'var(--font-orbitron)', fontSize: '1.25rem',
            fontWeight: 800, color: product.color,
          }}>
            {product.price}
          </span>
          <button
            onClick={handleAdd}
            style={{
              padding: '9px 18px', borderRadius: '2px',
              background: added ? 'rgba(5,150,105,0.1)' : 'transparent',
              border: added ? '1px solid rgba(5,150,105,0.4)' : `1px solid ${product.color}30`,
              color: added ? '#34d399' : product.color,
              fontFamily: 'var(--font-orbitron)', fontSize: '11px',
              fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (!added) {
                const el = e.currentTarget as HTMLElement
                el.style.background = `${product.color}12`
                el.style.borderColor = `${product.color}50`
              }
            }}
            onMouseLeave={e => {
              if (!added) {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'transparent'
                el.style.borderColor = `${product.color}30`
              }
            }}
            aria-label={`${added ? 'Agregado' : 'Agregar'} ${product.name} al carrito`}
          >
            {added ? '✓' : '+'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function FeaturedProducts() {
  const headerRef = useScrollReveal()

  return (
    <section
      id="productos"
      style={{ background: '#010a16', padding: '96px 0', borderTop: '1px solid rgba(59,130,246,0.06)' }}
      aria-labelledby="products3-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div ref={headerRef} className="scroll-reveal" style={{ marginBottom: '48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '3px', height: '28px', background: 'linear-gradient(to bottom, #3b82f6, #06b6d4)', borderRadius: '999px', flexShrink: 0 }} aria-hidden="true" />
              <span style={{
                fontFamily: 'var(--font-outfit)', fontSize: '11px',
                letterSpacing: '0.32em', textTransform: 'uppercase', color: '#475569',
              }}>
                Más populares
              </span>
            </div>
            <h2
              id="products3-heading"
              style={{
                fontFamily: 'var(--font-orbitron)', fontWeight: 800,
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: '#f1f5f9', lineHeight: 1.1,
              }}
            >
              Productos{' '}
              <span style={{
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Destacados
              </span>
            </h2>
          </div>
          <a
            href="#categorias"
            style={{
              fontFamily: 'var(--font-orbitron)', fontSize: '11px',
              fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#3b82f6', textDecoration: 'none', flexShrink: 0, marginBottom: '6px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#06b6d4' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3b82f6' }}
          >
            Ver todo →
          </a>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '14px',
        }}>
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i * 60} />
          ))}
        </div>
      </div>
    </section>
  )
}
