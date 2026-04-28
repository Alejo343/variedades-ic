'use client'

import Image from 'next/image'
import Link from 'next/link'

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

const socialLinks = [
  { label: 'Instagram', href: '#', icon: <InstagramIcon />, hoverColor: '#e1306c' },
  { label: 'Facebook', href: '#', icon: <FacebookIcon />, hoverColor: '#1877f2' },
  { label: 'WhatsApp', href: '#', icon: <WhatsAppIcon />, hoverColor: '#25d366' },
]

export default function Footer() {
  return (
    <footer className="glass-nav border-t border-[rgba(148,163,184,0.1)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Image
              src="/logo.png"
              alt="IC Variedades"
              width={100}
              height={34}
              className="h-8 w-auto"
            />
            <p className="text-slate-500 text-sm leading-relaxed text-center md:text-left max-w-xs">
              Tu tienda de confianza en tecnología, belleza y hogar.
            </p>
          </div>

          {/* Social */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-slate-400 text-xs tracking-widest uppercase font-medium">Síguenos</p>
            <div className="flex items-center gap-4">
              {socialLinks.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full glass border border-[rgba(148,163,184,0.15)] flex items-center justify-center text-slate-400 transition-all duration-200 hover:scale-110"
                  style={{ '--hover': s.hoverColor } as React.CSSProperties}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = s.hoverColor; (e.currentTarget as HTMLAnchorElement).style.borderColor = s.hoverColor + '55' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = ''; (e.currentTarget as HTMLAnchorElement).style.borderColor = '' }}
                >
                  {s.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-slate-400 text-xs tracking-widest uppercase font-medium">Contacto</p>
            <a
              href="mailto:davidsupremoxd@gmail.com"
              className="text-[#38bdf8] hover:text-[#7dd3fc] transition-colors duration-200 text-sm"
            >
              davidsupremoxd@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[rgba(148,163,184,0.08)] text-center">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} IC Variedades. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
