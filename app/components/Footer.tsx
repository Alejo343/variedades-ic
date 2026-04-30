'use client'

const LINKS = {
  tienda: [
    { label: 'Tecnología', href: '#tecnologia' },
    { label: 'Belleza', href: '#belleza' },
    { label: 'Hogar', href: '#hogar' },
    { label: 'Destacados', href: '#productos' },
  ],
  info: [
    { label: 'Quiénes somos', href: '#' },
    { label: 'Envíos', href: '#' },
    { label: 'Devoluciones', href: '#' },
    { label: 'Garantía', href: '#' },
  ],
  contacto: [
    { label: 'Colombia', href: '#' },
    { label: 'Soporte 24/7', href: '#' },
    { label: 'WhatsApp', href: '#' },
    { label: 'Instagram', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer
      style={{
        background: '#010810',
        borderTop: '1px solid rgba(59,130,246,0.08)',
      }}
      aria-label="Pie de página"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '40px',
          padding: '64px 0 48px',
        }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ marginBottom: '16px' }}>
              <span style={{
                fontFamily: 'var(--font-orbitron)',
                fontSize: '1.125rem', fontWeight: 800,
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                IC Variedades
              </span>
            </div>
            <p style={{
              fontFamily: 'var(--font-outfit)',
              fontSize: '0.8125rem', lineHeight: 1.7,
              color: '#334155', maxWidth: '200px',
            }}>
              Tecnología, belleza y hogar. Tu tienda de confianza en Colombia.
            </p>
          </div>

          {/* Tienda */}
          <div>
            <h3 style={{
              fontFamily: 'var(--font-orbitron)',
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#3b82f6', marginBottom: '20px',
            }}>
              Tienda
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {LINKS.tienda.map(l => (
                <li key={l.label}>
                  <a href={l.href} style={{
                    fontFamily: 'var(--font-outfit)', fontSize: '0.875rem',
                    color: '#334155', textDecoration: 'none', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#334155' }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 style={{
              fontFamily: 'var(--font-orbitron)',
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#3b82f6', marginBottom: '20px',
            }}>
              Información
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {LINKS.info.map(l => (
                <li key={l.label}>
                  <a href={l.href} style={{
                    fontFamily: 'var(--font-outfit)', fontSize: '0.875rem',
                    color: '#334155', textDecoration: 'none', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#334155' }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 style={{
              fontFamily: 'var(--font-orbitron)',
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#3b82f6', marginBottom: '20px',
            }}>
              Contacto
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {LINKS.contacto.map(l => (
                <li key={l.label}>
                  <a href={l.href} style={{
                    fontFamily: 'var(--font-outfit)', fontSize: '0.875rem',
                    color: '#334155', textDecoration: 'none', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#334155' }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(59,130,246,0.07)',
          padding: '20px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <p style={{
            fontFamily: 'var(--font-outfit)', fontSize: '12px',
            color: '#1e293b', letterSpacing: '0.04em',
          }}>
            © 2025 IC Variedades. Todos los derechos reservados.
          </p>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1d4ed8', display: 'inline-block' }} aria-hidden="true" />
            <span style={{
              fontFamily: 'var(--font-orbitron)', fontSize: '9px',
              fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Colombia
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
