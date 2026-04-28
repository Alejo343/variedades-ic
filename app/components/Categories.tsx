'use client'

import { useEffect, useRef } from 'react'

function useFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect() } },
        { threshold: 0.15 }
      )
      observer.observe(el)
      return () => observer.disconnect()
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])
  return ref
}

function TechIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function BeautyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l2.4 4.8L20 8l-4 3.9.94 5.5L12 15l-4.94 2.4.94-5.5L4 8l5.6-1.2z" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

const categories = [
  {
    id: 'tecnologia',
    label: 'Tecnología',
    description: 'Gadgets, audífonos, smartwatches, tablets y más accesorios tech.',
    icon: <TechIcon />,
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.25)',
  },
  {
    id: 'belleza',
    label: 'Belleza',
    description: 'Cepillos secadores, planchas iónicas y herramientas de cuidado personal.',
    icon: <BeautyIcon />,
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.25)',
  },
  {
    id: 'hogar',
    label: 'Hogar',
    description: 'Cámaras de seguridad, electrodomésticos inteligentes y más para tu casa.',
    icon: <HomeIcon />,
    color: '#34d399',
    glow: 'rgba(52,211,153,0.25)',
  },
]

function CategoryCard({ cat, delay }: { cat: typeof categories[0]; delay: number }) {
  const ref = useFadeIn(delay)
  return (
    <div
      ref={ref}
      id={cat.id}
      className="fade-in glass-card rounded-2xl p-8 flex flex-col items-center text-center gap-4 cursor-pointer group transition-all duration-300 hover:scale-[1.03]"
      style={{ '--glow': cat.glow } as React.CSSProperties}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${cat.glow}` }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: `rgba(${cat.color === '#38bdf8' ? '56,189,248' : cat.color === '#c084fc' ? '192,132,252' : '52,211,153'},0.12)`, color: cat.color }}
      >
        {cat.icon}
      </div>
      <h3 className="text-xl font-bold text-white">{cat.label}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{cat.description}</p>
      <span className="text-xs font-semibold tracking-widest uppercase mt-1 transition-all duration-200 group-hover:tracking-[0.2em]" style={{ color: cat.color }}>
        Explorar →
      </span>
    </div>
  )
}

export default function Categories() {
  return (
    <section id="categorias" className="py-24 px-4 sm:px-6 lg:px-8" aria-labelledby="categories-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 id="categories-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Nuestras <span className="text-gradient">Categorías</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Explora nuestra selección de productos organizados por categoría.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.id} cat={cat} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  )
}
