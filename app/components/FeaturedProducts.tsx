'use client'

import { useEffect, useRef, useState } from 'react'

function useFadeIn(delay = 0) {
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

function HeadphonesIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  )
}

function WatchIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="7" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function HairDryerIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
      <path d="M6 12a6 6 0 0 1 6-6h6a3 3 0 0 1 0 6H12" />
      <path d="M9 17l-2 4" />
      <path d="M15 17l2 4" />
    </svg>
  )
}

function IronIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5H5v5z" />
      <path d="M19 15H5l2-9h8l4 9z" />
      <line x1="10" y1="6" x2="10" y2="9" />
      <line x1="14" y1="6" x2="14" y2="9" />
    </svg>
  )
}

function TabletIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}

const products = [
  { id: 1, name: 'Audífonos Bluetooth Pro', price: '$89.900', category: 'Tecnología', icon: <HeadphonesIcon />, color: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
  { id: 2, name: 'Smartwatch Serie 5', price: '$129.900', category: 'Tecnología', icon: <WatchIcon />, color: '#7dd3fc', bg: 'rgba(125,211,252,0.08)' },
  { id: 3, name: 'Cámara de Seguridad HD', price: '$75.900', category: 'Hogar', icon: <CameraIcon />, color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  { id: 4, name: 'Cepillo Secador 2 en 1', price: '$95.900', category: 'Belleza', icon: <HairDryerIcon />, color: '#c084fc', bg: 'rgba(192,132,252,0.08)' },
  { id: 5, name: 'Plancha Iónica Pro', price: '$68.900', category: 'Belleza', icon: <IronIcon />, color: '#f472b6', bg: 'rgba(244,114,182,0.08)' },
  { id: 6, name: 'Tablet Android 10"', price: '$199.900', category: 'Tecnología', icon: <TabletIcon />, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
]

function ProductCard({ product, delay }: { product: typeof products[0]; delay: number }) {
  const ref = useFadeIn(delay)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <article ref={ref} className="fade-in glass rounded-2xl overflow-hidden group transition-all duration-300 hover:scale-[1.02] glow-blue-hover flex flex-col">
      {/* Product image area */}
      <div
        className="h-44 flex items-center justify-center relative"
        style={{ background: `linear-gradient(135deg, ${product.bg}, rgba(5,11,24,0.4))`, color: product.color }}
        aria-hidden="true"
      >
        {product.icon}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: `${product.bg}`, color: product.color, border: `1px solid ${product.color}33` }}>
            {product.category}
          </span>
        </div>
      </div>

      {/* Product info */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-white font-semibold text-base leading-snug">{product.name}</h3>
        <p className="text-2xl font-bold" style={{ color: product.color }}>{product.price}</p>
        <button
          onClick={handleAdd}
          className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
          style={{
            background: added ? `rgba(52,211,153,0.15)` : `rgba(14,165,233,0.12)`,
            border: added ? `1px solid rgba(52,211,153,0.5)` : `1px solid rgba(14,165,233,0.3)`,
            color: added ? '#34d399' : '#38bdf8',
          }}
          aria-label={`${added ? 'Agregado' : 'Agregar'} ${product.name} al carrito`}
        >
          {added ? '✓ Agregado' : 'Agregar al carrito'}
        </button>
      </div>
    </article>
  )
}

export default function FeaturedProducts() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-[#050b18] to-transparent" aria-labelledby="products-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 id="products-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Productos <span className="text-gradient">Destacados</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Una selección de nuestros artículos más populares.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  )
}
