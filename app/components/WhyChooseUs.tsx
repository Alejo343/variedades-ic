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

function ShippingIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function SupportIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

const reasons = [
  {
    icon: <ShippingIcon />,
    title: 'Envío Rápido',
    description: 'Recibe tus pedidos en tiempo récord. Envíos a todo el país.',
    color: '#38bdf8',
  },
  {
    icon: <ShieldIcon />,
    title: 'Garantía',
    description: 'Todos nuestros productos cuentan con garantía y respaldo oficial.',
    color: '#34d399',
  },
  {
    icon: <StarIcon />,
    title: 'Calidad',
    description: 'Solo trabajamos con marcas y productos de alta calidad verificada.',
    color: '#f59e0b',
  },
  {
    icon: <SupportIcon />,
    title: 'Soporte',
    description: 'Nuestro equipo está disponible para ayudarte antes y después de tu compra.',
    color: '#c084fc',
  },
]

function ReasonCard({ reason, delay }: { reason: typeof reasons[0]; delay: number }) {
  const ref = useFadeIn(delay)
  return (
    <div
      ref={ref}
      className="fade-in glass rounded-2xl p-7 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:scale-[1.03]"
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 32px ${reason.color}33` }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: `${reason.color}14`, color: reason.color }}
      >
        {reason.icon}
      </div>
      <h3 className="text-white font-bold text-lg">{reason.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{reason.description}</p>
    </div>
  )
}

export default function WhyChooseUs() {
  return (
    <section id="porque-elegirnos" className="py-24 px-4 sm:px-6 lg:px-8" aria-labelledby="why-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 id="why-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">
            ¿Por qué <span className="text-gradient">elegirnos?</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Nos comprometemos a ofrecerte la mejor experiencia de compra.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r, i) => (
            <ReasonCard key={r.title} reason={r} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  )
}
