'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useFont } from '../context/FontContext'

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const navLinks = [
  { label: 'Tecnología', href: '#tecnologia' },
  { label: 'Belleza', href: '#belleza' },
  { label: 'Hogar', href: '#hogar' },
]

export default function Navbar() {
  const { font, toggleFont } = useFont()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="glass-nav fixed top-0 left-0 right-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" role="navigation" aria-label="Navegación principal">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="IC Variedades - Inicio">
          <Image
            src="/logo.png"
            alt="IC Variedades"
            width={120}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-8" role="list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-slate-300 hover:text-[#38bdf8] transition-colors duration-200 text-sm font-medium tracking-wide"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Font toggle */}
          <button
            onClick={toggleFont}
            aria-label={`Cambiar fuente a ${font === 'outfit' ? 'Orbitron' : 'Outfit'}`}
            title={`Fuente activa: ${font === 'outfit' ? 'Outfit' : 'Orbitron'}`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-[rgba(14,165,233,0.25)] text-xs text-slate-300 hover:text-[#38bdf8] hover:border-[rgba(56,189,248,0.45)] transition-all duration-200 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
            <span>{font === 'outfit' ? 'Outfit' : 'Orbitron'}</span>
          </button>

          {/* Cart */}
          <button
            aria-label="Ver carrito de compras"
            className="relative p-2 rounded-full glass border border-[rgba(148,163,184,0.15)] text-slate-300 hover:text-[#38bdf8] hover:border-[rgba(56,189,248,0.35)] transition-all duration-200 cursor-pointer"
          >
            <CartIcon />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#0ea5e9] rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none">
              0
            </span>
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-full glass border border-[rgba(148,163,184,0.15)] text-slate-300 hover:text-[#38bdf8] transition-colors duration-200 cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass-nav border-t border-[rgba(148,163,184,0.1)] px-4 py-4">
          <ul className="flex flex-col gap-4" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block text-slate-300 hover:text-[#38bdf8] transition-colors duration-200 font-medium py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => { toggleFont(); setMenuOpen(false) }}
                className="text-slate-400 text-sm hover:text-[#38bdf8] transition-colors duration-200 cursor-pointer"
                aria-label={`Cambiar fuente a ${font === 'outfit' ? 'Orbitron' : 'Outfit'}`}
              >
                Fuente: {font === 'outfit' ? 'Outfit (geométrica)' : 'Orbitron (display)'}
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
