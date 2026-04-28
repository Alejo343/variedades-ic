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

function HeadphonesIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  )
}
function WatchIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="7" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}
function CameraIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
function HairDryerIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
      <path d="M6 12a6 6 0 0 1 6-6h6a3 3 0 0 1 0 6H12" />
      <path d="M9 17l-2 4" />
      <path d="M15 17l2 4" />
    </svg>
  )
}
function IronIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5H5v5z" />
      <path d="M19 15H5l2-9h8l4 9z" />
      <line x1="10" y1="6" x2="10" y2="9" />
      <line x1="14" y1="6" x2="14" y2="9" />
    </svg>
  )
}
function TabletIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}

const PRODUCTS = [
  { id: 1, name: 'Audífonos Bluetooth Pro',  price: '$89.900',  category: 'Tecnología', icon: <HeadphonesIcon />, color: '#38bdf8', span: 2 },
  { id: 2, name: 'Smartwatch Serie 5',        price: '$129.900', category: 'Tecnología', icon: <WatchIcon />,      color: '#7dd3fc', span: 1 },
  { id: 3, name: 'Cámara de Seguridad HD',    price: '$75.900',  category: 'Hogar',      icon: <CameraIcon />,    color: '#34d399', span: 1 },
  { id: 4, name: 'Cepillo Secador 2 en 1',    price: '$95.900',  category: 'Belleza',    icon: <HairDryerIcon />, color: '#c084fc', span: 2 },
  { id: 5, name: 'Plancha Iónica Pro',        price: '$68.900',  category: 'Belleza',    icon: <IronIcon />,      color: '#f472b6', span: 1 },
  { id: 6, name: 'Tablet Android 10"',        price: '$199.900', category: 'Tecnología', icon: <TabletIcon />,    color: '#60a5fa', span: 2 },
]

function ProductCard({ product, delay }: { product: typeof PRODUCTS[0]; delay: number }) {
  const ref = useScrollReveal(delay)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const isWide = product.span === 2

  return (
    <article
      ref={ref}
      className="fade-in flex flex-col group"
      style={{
        gridColumn: isWide ? 'span 2' : 'span 1',
        background: '#070d1c',
        border: '1px solid rgba(59,130,246,0.09)',
        borderRadius: '4px',
        overflow: 'hidden',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = `${product.color}33`
        el.style.boxShadow = `0 0 40px ${product.color}0d`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(59,130,246,0.09)'
        el.style.boxShadow = ''
      }}
    >
      {/* Icon area */}
      <div
        style={{
          height: isWide ? '180px' : '160px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: `linear-gradient(135deg, ${product.color}0a 0%, #050810 100%)`,
          color: product.color,
        }}
        aria-hidden="true"
      >
        {product.icon}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          padding: '4px 10px',
          borderRadius: '2px',
          background: `${product.color}14`,
          border: `1px solid ${product.color}2a`,
          color: product.color,
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          {product.category}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
        <h3 style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '1.0625rem',
          fontWeight: 600,
          color: '#e2e8f0',
          lineHeight: 1.3,
        }}>
          {product.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '1.375rem',
            fontWeight: 700,
            color: product.color,
          }}>
            {product.price}
          </span>

          <button
            onClick={handleAdd}
            style={{
              padding: '9px 20px',
              borderRadius: '2px',
              background: added ? 'rgba(52,211,153,0.1)' : 'rgba(59,130,246,0.08)',
              border: added ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(59,130,246,0.2)',
              color: added ? '#34d399' : '#60a5fa',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            aria-label={`${added ? 'Agregado' : 'Agregar'} ${product.name} al carrito`}
          >
            {added ? '✓ Agregado' : '+ Agregar'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function FeaturedProducts2() {
  const headerRef = useScrollReveal()

  return (
    <section
      style={{ background: '#050810', padding: '80px 0 96px' }}
      aria-labelledby="products2-heading"
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
              Más populares
            </p>
            <h2
              id="products2-heading"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                fontWeight: 700,
                color: '#e2e8f0',
                lineHeight: 1.1,
              }}
            >
              Productos{' '}
              <span className="text-warm-gradient">Destacados</span>
            </h2>
          </div>
          <div className="hidden sm:block" style={{ height: '1px', flex: 1, background: 'rgba(59,130,246,0.08)', marginLeft: '40px', marginBottom: '8px' }} />
        </div>

        {/* Bento grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}
        >
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i * 60} />
          ))}
        </div>
      </div>
    </section>
  )
}
