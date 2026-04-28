'use client'

import { useEffect, useRef } from 'react'

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

export default function Hero() {
  const ref = useFadeIn()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16" aria-label="Bienvenida">

      {/* Decorative orbs */}
      <div className="orb w-96 h-96 bg-[#0ea5e9] opacity-10 top-10 -left-32" style={{ animationDelay: '0s' }} />
      <div className="orb w-80 h-80 bg-[#38bdf8] opacity-8 bottom-20 right-10" style={{ animationDelay: '4s' }} />
      <div className="orb w-64 h-64 bg-[#7dd3fc] opacity-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '8s' }} />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(56,189,248,1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div ref={ref} className="fade-in relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-[rgba(14,165,233,0.3)] text-xs text-[#7dd3fc] mb-6 tracking-widest uppercase font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" aria-hidden="true" />
          Tecnología · Belleza · Hogar
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6">
          <span className="text-white">Bienvenidos a </span>
          <span className="text-gradient">IC Variedades</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Encuentra los mejores gadgets, herramientas de belleza y dispositivos para el hogar.
          Calidad premium al mejor precio.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#categorias"
            className="btn-primary px-8 py-3.5 rounded-full text-white font-semibold text-base tracking-wide"
          >
            Ver Catálogo
          </a>
          <a
            href="#porque-elegirnos"
            className="px-8 py-3.5 rounded-full glass border border-[rgba(148,163,184,0.25)] text-slate-300 hover:text-white hover:border-[rgba(56,189,248,0.35)] font-medium text-base transition-all duration-300"
          >
            ¿Por qué elegirnos?
          </a>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050b18] to-transparent" aria-hidden="true" />
    </section>
  )
}
