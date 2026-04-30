import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { getPublicProducts } from '@/lib/db/queries/products'
import { getActiveCategories } from '@/lib/db/queries/categories'

export const metadata = {
  title: 'Catálogo — IC Variedades',
}

function formatCOP(price: number) {
  return '$' + price.toLocaleString('es-CO')
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const { categoria } = await searchParams
  const [prods, cats] = await Promise.all([
    getPublicProducts(categoria),
    getActiveCategories(),
  ])

  const activeCat = cats.find(c => c.slug === categoria)

  return (
    <>
      <Navbar />

      <main style={{ minHeight: '100vh', background: '#020c1b' }}>

        {/* ── Page header ── */}
        <div
          style={{
            paddingTop: '104px',
            paddingBottom: '52px',
            position: 'relative',
            overflow: 'hidden',
            borderBottom: '1px solid rgba(59,130,246,0.06)',
          }}
        >
          {/* Dot grid */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: 'radial-gradient(rgba(59,130,246,0.07) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {/* Ambient top glow */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: '700px', height: '320px',
              background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />
          {/* Left accent line */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: '3px',
              background: 'linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.4) 50%, transparent 100%)',
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div
                aria-hidden="true"
                style={{
                  width: '4px', height: '18px', borderRadius: '2px',
                  background: 'linear-gradient(180deg, #3b82f6, #06b6d4)',
                }}
              />
              <span style={{
                fontFamily: 'var(--font-outfit)', fontSize: '11px',
                letterSpacing: '0.28em', textTransform: 'uppercase', color: '#3b82f6',
              }}>
                IC Variedades · Catálogo
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-orbitron)', fontWeight: 800,
              fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
              color: '#f1f5f9', lineHeight: 1.1, letterSpacing: '-0.01em',
              margin: '0 0 10px 0',
            }}>
              {activeCat ? activeCat.name : 'Catálogo Completo'}
            </h1>

            <p style={{
              fontFamily: 'var(--font-outfit)', fontSize: '13px',
              color: '#475569', letterSpacing: '0.02em', margin: 0,
            }}>
              {prods.length} producto{prods.length !== 1 ? 's' : ''} disponible{prods.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* ── Filters + Grid ── */}
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ paddingTop: '40px', paddingBottom: '96px' }}
        >

          {/* Category filters */}
          {cats.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
              <Link
                href="/productos"
                className={`fchip${!categoria ? ' active' : ''}`}
              >
                Todos
              </Link>
              {cats.map(cat => {
                const isActive = categoria === cat.slug
                return (
                  <Link
                    key={cat.id}
                    href={`/productos?categoria=${cat.slug}`}
                    className="fchip"
                    style={isActive ? {
                      borderColor: cat.color ?? '#3b82f6',
                      color: cat.color ?? '#60a5fa',
                      background: `${cat.color ?? '#3b82f6'}1a`,
                    } : undefined}
                  >
                    {cat.name}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Product grid */}
          {prods.length > 0 ? (
            <div
              className="catalog-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(248px, 1fr))',
                gap: '16px',
              }}
            >
              {prods.map((p, idx) => (
                <Link
                  key={p.id}
                  href={`/productos/${p.slug}`}
                  style={{ textDecoration: 'none', display: 'flex' }}
                >
                  <article className="pcard" style={{ flex: 1 }}>

                    {/* Image area */}
                    <div className="pcard-img-wrap" style={{ height: '210px' }}>
                      <div className="pcard-img-inner">
                        {p.primaryImage ? (
                          <Image
                            src={p.primaryImage}
                            alt={p.name}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 248px"
                            priority={idx < 4}
                            loading={idx < 4 ? 'eager' : 'lazy'}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%', height: '100%',
                              background: 'linear-gradient(145deg, #0a1e3d, #030e1a)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <div
                              style={{
                                width: '52px', height: '52px', borderRadius: '50%',
                                border: '1px solid rgba(59,130,246,0.18)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'rgba(59,130,246,0.28)',
                              }}
                            >
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Gradient fade bottom */}
                      <div
                        aria-hidden="true"
                        style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          height: '64px', zIndex: 2, pointerEvents: 'none',
                          background: 'linear-gradient(to top, #060f1d, transparent)',
                        }}
                      />

                      {/* Badges */}
                      {p.featured && (
                        <div
                          style={{
                            position: 'absolute', top: '10px', right: '10px', zIndex: 3,
                            padding: '3px 9px', borderRadius: '2px',
                            background: 'rgba(59,130,246,0.12)',
                            border: '1px solid rgba(59,130,246,0.3)',
                            fontFamily: 'var(--font-orbitron)', fontSize: '8px',
                            fontWeight: 700, color: '#60a5fa', letterSpacing: '0.12em',
                          }}
                        >
                          ★ DESTACADO
                        </div>
                      )}

                      {p.stock === 0 && (
                        <div
                          style={{
                            position: 'absolute', inset: 0, zIndex: 4,
                            background: 'rgba(2,8,20,0.68)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-orbitron)', fontSize: '9px',
                              fontWeight: 700, letterSpacing: '0.22em',
                              color: '#ef4444', padding: '5px 14px',
                              border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: '2px', background: 'rgba(239,68,68,0.07)',
                            }}
                          >
                            AGOTADO
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div
                      style={{
                        padding: '16px 18px 20px',
                        flex: 1, display: 'flex', flexDirection: 'column', gap: '7px',
                      }}
                    >
                      {p.categoryName && (
                        <span
                          style={{
                            fontFamily: 'var(--font-outfit)', fontSize: '10px',
                            letterSpacing: '0.18em', textTransform: 'uppercase',
                            color: '#3b82f6',
                          }}
                        >
                          {p.categoryName}
                        </span>
                      )}

                      <h2
                        style={{
                          fontFamily: 'var(--font-orbitron)', fontSize: '0.8125rem',
                          fontWeight: 700, color: '#e2e8f0', lineHeight: 1.35,
                          margin: 0, flex: 1,
                        }}
                      >
                        {p.name}
                      </h2>

                      <div
                        style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '12px', marginTop: '4px',
                          borderTop: '1px solid rgba(59,130,246,0.07)',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-orbitron)', fontSize: '1.1rem',
                            fontWeight: 800, color: '#3b82f6',
                          }}
                        >
                          {formatCOP(p.price)}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-outfit)', fontSize: '11px',
                            letterSpacing: '0.06em', color: '#334155',
                            transition: 'color 0.15s',
                          }}
                        >
                          Ver →
                        </span>
                      </div>
                    </div>

                  </article>
                </Link>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div
              style={{
                paddingTop: '80px', paddingBottom: '80px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '20px', textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  border: '1px solid rgba(59,130,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(59,130,246,0.22)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-orbitron)', fontSize: '12px',
                    letterSpacing: '0.18em', color: '#1e3a5f', margin: '0 0 8px 0',
                  }}
                >
                  SIN RESULTADOS
                </p>
                <p style={{ fontFamily: 'var(--font-outfit)', fontSize: '14px', color: '#334155', margin: 0 }}>
                  No hay productos disponibles{categoria ? ' en esta categoría' : ''}.
                </p>
              </div>
              {categoria && (
                <Link
                  href="/productos"
                  style={{
                    fontFamily: 'var(--font-outfit)', fontSize: '13px',
                    color: '#3b82f6', textDecoration: 'none',
                  }}
                >
                  ← Ver todos los productos
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
