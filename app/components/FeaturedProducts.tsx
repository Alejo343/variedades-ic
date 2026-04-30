'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type FeaturedProduct = {
  id: number
  name: string
  slug: string
  price: number
  stock: number
  featured: boolean
  categoryName: string | null
  categorySlug: string | null
  primaryImage: string | null
}

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

/* ── Fallback icons by category slug ── */
function HeadphonesIcon() {
  return <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
}
function BrushIcon() {
  return <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
}
function HomeAppIcon() {
  return <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
function BoxIcon() {
  return <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
}

function getCategoryIcon(slug: string | null) {
  if (!slug) return <BoxIcon />
  const s = slug.toLowerCase()
  if (s.includes('tecnol') || s.includes('tech') || s.includes('electr')) return <HeadphonesIcon />
  if (s.includes('belleza') || s.includes('beauty') || s.includes('cosmet')) return <BrushIcon />
  if (s.includes('hogar') || s.includes('home') || s.includes('casa')) return <HomeAppIcon />
  return <BoxIcon />
}

function getCategoryColor(slug: string | null): string {
  if (!slug) return '#3b82f6'
  const s = slug.toLowerCase()
  if (s.includes('tecnol') || s.includes('tech') || s.includes('electr')) return '#3b82f6'
  if (s.includes('belleza') || s.includes('beauty') || s.includes('cosmet')) return '#a78bfa'
  if (s.includes('hogar') || s.includes('home') || s.includes('casa')) return '#06b6d4'
  return '#3b82f6'
}

function getCategoryBg(slug: string | null): string {
  if (!slug) return 'linear-gradient(145deg, #0d1e3f, #041020)'
  const s = slug.toLowerCase()
  if (s.includes('tecnol') || s.includes('tech') || s.includes('electr')) return 'linear-gradient(145deg, #0d1e3f, #041020)'
  if (s.includes('belleza') || s.includes('beauty') || s.includes('cosmet')) return 'linear-gradient(145deg, #1a0d35, #0c0520)'
  if (s.includes('hogar') || s.includes('home') || s.includes('casa')) return 'linear-gradient(145deg, #041c25, #021018)'
  return 'linear-gradient(145deg, #0d1e3f, #041020)'
}

function formatPrice(cents: number): string {
  return '$' + cents.toLocaleString('es-CO')
}

function ProductCard({ product, delay }: { product: FeaturedProduct; delay: number }) {
  const ref = useScrollReveal(delay)
  const color = getCategoryColor(product.categorySlug)
  const bg = getCategoryBg(product.categorySlug)
  const icon = getCategoryIcon(product.categorySlug)

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
        el.style.borderColor = `${color}35`
        el.style.boxShadow = `0 0 40px ${color}10`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(59,130,246,0.09)'
        el.style.boxShadow = ''
      }}
    >
      {/* Image area */}
      <div style={{
        height: '190px', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {product.primaryImage ? (
          <Image
            src={product.primaryImage}
            alt={product.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, 260px"
          />
        ) : (
          <>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: `radial-gradient(${color}12 1px, transparent 1px)`,
                backgroundSize: '18px 18px',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                width: '100px', height: '100px', borderRadius: '50%',
                background: `radial-gradient(circle, ${color}14 0%, transparent 70%)`,
              }}
            />
            <span style={{ color, opacity: 0.8, position: 'relative', zIndex: 1 }}>
              {icon}
            </span>
          </>
        )}

        {/* Category badge */}
        {product.categoryName && (
          <div style={{
            position: 'absolute', top: '12px', left: '12px',
            padding: '3px 10px', borderRadius: '2px',
            background: `${color}12`, border: `1px solid ${color}28`,
            fontFamily: 'var(--font-outfit)', fontSize: '10px',
            letterSpacing: '0.12em', textTransform: 'uppercase', color,
          }}>
            {product.categoryName}
          </div>
        )}

        {/* Featured badge */}
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          padding: '3px 10px', borderRadius: '2px',
          background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
          fontFamily: 'var(--font-orbitron)', fontSize: '9px',
          fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#60a5fa',
        }}>
          Destacado
        </div>
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
            fontWeight: 800, color,
          }}>
            {formatPrice(product.price)}
          </span>
          <Link
            href={`/productos/${product.slug}`}
            style={{
              padding: '9px 18px', borderRadius: '2px',
              background: 'transparent',
              border: `1px solid ${color}30`,
              color,
              fontFamily: 'var(--font-orbitron)', fontSize: '11px',
              fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              textDecoration: 'none', transition: 'all 0.2s',
              display: 'inline-block',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = `${color}12`
              el.style.borderColor = `${color}50`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'transparent'
              el.style.borderColor = `${color}30`
            }}
            aria-label={`Ver ${product.name}`}
          >
            Ver →
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function FeaturedProducts({ products }: { products: FeaturedProduct[] }) {
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
          <Link
            href="/productos"
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
          </Link>
        </div>

        {/* Grid */}
        {products.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '14px',
          }}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} delay={i * 60} />
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--font-outfit)', color: '#475569', fontSize: '14px' }}>
            Próximamente productos destacados.
          </p>
        )}
      </div>
    </section>
  )
}
