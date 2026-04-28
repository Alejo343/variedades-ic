'use client'

import Image from 'next/image'
import Link from 'next/link'

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  )
}
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}
function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

const SOCIAL = [
  { label: 'Instagram', href: '#', icon: <InstagramIcon />, hoverColor: '#e1306c' },
  { label: 'Facebook',  href: '#', icon: <FacebookIcon />,  hoverColor: '#1877f2' },
  { label: 'WhatsApp',  href: '#', icon: <WhatsAppIcon />,  hoverColor: '#25d366' },
]

const NAV_LINKS = [
  { label: 'Tecnología',          href: '#tecnologia' },
  { label: 'Belleza',             href: '#belleza' },
  { label: 'Hogar',               href: '#hogar' },
  { label: '¿Por qué elegirnos?', href: '#porque-elegirnos' },
]

export default function Footer2() {
  return (
    <footer
      style={{
        background: '#040810',
        borderTop: '1px solid rgba(59,130,246,0.07)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-5">
            <Image
              src="/logo.png"
              alt="IC Variedades"
              width={110}
              height={36}
              className="h-9 w-auto"
            />
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '0.875rem',
              lineHeight: 1.7,
              color: '#334155',
              maxWidth: '240px',
            }}>
              Tu tienda de confianza en tecnología, belleza y hogar. Calidad curada para tu vida.
            </p>
          </div>

          {/* Nav */}
          <div className="flex flex-col gap-5">
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '11px',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#475569',
            }}>
              Explorar
            </p>
            <ul className="flex flex-col gap-3" role="list">
              {NAV_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: 'var(--font-dm-sans)',
                      fontSize: '0.875rem',
                      color: '#334155',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#60a5fa' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#334155' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Social */}
          <div className="flex flex-col gap-5">
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '11px',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#475569',
            }}>
              Contacto
            </p>
            <a
              href="mailto:davidsupremoxd@gmail.com"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '0.875rem',
                color: '#3b82f6',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#60a5fa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#3b82f6' }}
            >
              davidsupremoxd@gmail.com
            </a>

            <div className="flex items-center gap-3 mt-2">
              {SOCIAL.map(s => (
                <Link
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '3px',
                    border: '1px solid rgba(59,130,246,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#334155',
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.color = s.hoverColor
                    el.style.borderColor = s.hoverColor + '55'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.color = '#334155'
                    el.style.borderColor = 'rgba(59,130,246,0.12)'
                  }}
                >
                  {s.icon}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          marginTop: '56px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(59,130,246,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <p style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '12px',
            color: '#1e293b',
          }}>
            © {new Date().getFullYear()} IC Variedades. Todos los derechos reservados.
          </p>
          <p style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '12px',
            fontStyle: 'italic',
            color: 'rgba(59,130,246,0.2)',
          }}>
            Tecnología · Belleza · Hogar
          </p>
        </div>
      </div>
    </footer>
  )
}
