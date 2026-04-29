'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useFont } from '../context/FontContext'

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const navLinks = [
  { label: 'Tecnología', href: '#tecnologia' },
  { label: 'Belleza', href: '#belleza' },
  { label: 'Hogar', href: '#hogar' },
  { label: 'Productos', href: '#productos' },
]

export default function Navbar() {
  const { font, toggleFont } = useFont()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartHover, setCartHover] = useState(false)

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(2,12,27,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(59,130,246,0.1)',
      }}
    >
      {/* Subtle top accent line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.5) 30%, rgba(6,182,212,0.4) 70%, transparent 100%)',
        }}
      />

      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        role="navigation"
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}
          aria-label="IC Variedades - Inicio"
        >
          <Image
            src="/logo.png"
            alt="IC Variedades"
            width={120}
            height={40}
            style={{ height: '36px', width: 'auto' }}
            priority
          />
        </Link>

        {/* Desktop nav links */}
        <ul
          className="hidden md:flex"
          style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', gap: '2px' }}
          role="list"
        >
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#475569',
                  textDecoration: 'none',
                  borderRadius: '2px',
                  transition: 'color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.color = '#60a5fa'
                  el.style.background = 'rgba(59,130,246,0.06)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.color = '#475569'
                  el.style.background = ''
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Font toggle */}
          <button
            onClick={toggleFont}
            aria-label={`Cambiar fuente a ${font === 'outfit' ? 'Orbitron' : 'Outfit'}`}
            title={`Fuente activa: ${font === 'outfit' ? 'Outfit' : 'Orbitron'}`}
            className="hidden sm:flex"
            style={{
              alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '2px',
              border: '1px solid rgba(59,130,246,0.18)',
              background: 'transparent',
              fontFamily: 'var(--font-orbitron)', fontSize: '10px',
              fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#334155', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.color = '#60a5fa'
              el.style.borderColor = 'rgba(59,130,246,0.4)'
              el.style.background = 'rgba(59,130,246,0.05)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.color = '#334155'
              el.style.borderColor = 'rgba(59,130,246,0.18)'
              el.style.background = 'transparent'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
            <span>{font === 'outfit' ? 'Aa' : 'Aa'}</span>
          </button>

          {/* Cart */}
          <button
            aria-label="Ver carrito de compras"
            style={{
              position: 'relative',
              padding: '8px 10px', borderRadius: '2px',
              border: cartHover ? '1px solid rgba(59,130,246,0.45)' : '1px solid rgba(59,130,246,0.18)',
              background: cartHover ? 'rgba(59,130,246,0.08)' : 'transparent',
              color: cartHover ? '#60a5fa' : '#475569',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={() => setCartHover(true)}
            onMouseLeave={() => setCartHover(false)}
          >
            <CartIcon />
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              width: '16px', height: '16px',
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              borderRadius: '2px',
              fontFamily: 'var(--font-orbitron)', fontSize: '9px',
              fontWeight: 700, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}>
              0
            </span>
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden"
            style={{
              padding: '8px', borderRadius: '2px',
              border: menuOpen ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(59,130,246,0.18)',
              background: menuOpen ? 'rgba(59,130,246,0.08)' : 'transparent',
              color: menuOpen ? '#60a5fa' : '#475569',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
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
        <div
          className="md:hidden"
          style={{
            background: 'rgba(2,12,27,0.98)',
            borderTop: '1px solid rgba(59,130,246,0.1)',
            padding: '16px',
          }}
        >
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }} role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    display: 'block', padding: '12px 16px', borderRadius: '2px',
                    fontFamily: 'var(--font-orbitron)', fontSize: '12px',
                    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: '#475569', textDecoration: 'none',
                    transition: 'all 0.2s', borderLeft: '2px solid transparent',
                  }}
                  onClick={() => setMenuOpen(false)}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.color = '#60a5fa'
                    el.style.borderLeftColor = '#3b82f6'
                    el.style.background = 'rgba(59,130,246,0.05)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.color = '#475569'
                    el.style.borderLeftColor = 'transparent'
                    el.style.background = ''
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div style={{ borderTop: '1px solid rgba(59,130,246,0.08)', marginTop: '12px', paddingTop: '12px' }}>
            <button
              onClick={() => { toggleFont(); setMenuOpen(false) }}
              style={{
                fontFamily: 'var(--font-outfit)', fontSize: '12px',
                color: '#334155', background: 'none', border: 'none',
                cursor: 'pointer', letterSpacing: '0.04em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#60a5fa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#334155' }}
              aria-label={`Cambiar fuente a ${font === 'outfit' ? 'Orbitron' : 'Outfit'}`}
            >
              Fuente: {font === 'outfit' ? 'Outfit' : 'Orbitron'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
