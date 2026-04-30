import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import ProductImageGallery from '@/app/components/ProductImageGallery'
import { getProductBySlug } from '@/lib/db/queries/products'

const WA_NUMBER = '573176642382'

function formatCOP(price: number) {
  return '$' + price.toLocaleString('es-CO')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}
  return { title: `${product.name} — IC Variedades` }
}

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const waText =
    product.whatsappText ??
    `Hola! Me interesa el producto: *${product.name}* — Precio: ${formatCOP(product.price)}`
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`
  const inStock = product.stock > 0

  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: '100vh',
          background: '#020c1b',
          paddingTop: '96px',
          paddingBottom: '96px',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav
            aria-label="Ruta de navegación"
            style={{
              marginBottom: '44px',
              fontFamily: 'var(--font-outfit)',
              fontSize: '12px',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/" className="breadcrumb-link" style={{ color: '#334155', textDecoration: 'none' }}>
              Inicio
            </Link>
            <span style={{ color: '#1e3a5f', fontSize: '14px' }}>›</span>
            <Link href="/productos" className="breadcrumb-link" style={{ color: '#334155', textDecoration: 'none' }}>
              Productos
            </Link>
            {product.categoryName && (
              <>
                <span style={{ color: '#1e3a5f', fontSize: '14px' }}>›</span>
                <Link
                  href={`/productos?categoria=${product.categorySlug}`}
                  className="breadcrumb-link"
                  style={{ color: '#334155', textDecoration: 'none' }}
                >
                  {product.categoryName}
                </Link>
              </>
            )}
            <span style={{ color: '#1e3a5f', fontSize: '14px' }}>›</span>
            <span style={{ color: '#64748b' }}>{product.name}</span>
          </nav>

          {/* Main 2-col layout */}
          <div className="product-detail-grid">

            {/* Left: image gallery */}
            <ProductImageGallery
              images={product.images}
              productName={product.name}
            />

            {/* Right: product info */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>

              {/* Category badge */}
              {product.categoryName && (
                <Link
                  href={`/productos?categoria=${product.categorySlug}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontFamily: 'var(--font-outfit)',
                    fontSize: '11px',
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: '#3b82f6',
                    textDecoration: 'none',
                    marginBottom: '16px',
                    alignSelf: 'flex-start',
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: '3px', height: '12px',
                      background: 'linear-gradient(180deg, #3b82f6, #06b6d4)',
                      borderRadius: '2px',
                    }}
                  />
                  {product.categoryName}
                </Link>
              )}

              {/* Product name */}
              <h1
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontWeight: 800,
                  fontSize: 'clamp(1.375rem, 2.5vw, 1.875rem)',
                  color: '#f1f5f9',
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                  margin: '0 0 28px 0',
                }}
              >
                {product.name}
              </h1>

              {/* Divider */}
              <div
                aria-hidden="true"
                style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, rgba(59,130,246,0.35) 0%, transparent 80%)',
                  marginBottom: '28px',
                }}
              />

              {/* Price */}
              <div style={{ marginBottom: '28px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-orbitron)',
                    fontWeight: 800,
                    fontSize: 'clamp(2rem, 4vw, 2.625rem)',
                    background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1,
                  }}
                >
                  {formatCOP(product.price)}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <>
                  <p
                    style={{
                      fontFamily: 'var(--font-outfit)',
                      fontSize: '14px',
                      color: '#64748b',
                      lineHeight: 1.8,
                      margin: '0 0 28px 0',
                    }}
                  >
                    {product.description}
                  </p>
                </>
              )}

              {/* Divider */}
              <div
                aria-hidden="true"
                style={{
                  height: '1px',
                  background: 'rgba(59,130,246,0.08)',
                  marginBottom: '24px',
                }}
              />

              {/* Stock indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '28px',
                  padding: '13px 16px',
                  borderRadius: '3px',
                  background: inStock ? 'rgba(52,211,153,0.04)' : 'rgba(239,68,68,0.04)',
                  border: `1px solid ${inStock ? 'rgba(52,211,153,0.18)' : 'rgba(239,68,68,0.18)'}`,
                }}
              >
                {inStock ? (
                  <>
                    <span className="stock-dot" aria-hidden="true" />
                    <span
                      style={{
                        fontFamily: 'var(--font-outfit)',
                        fontSize: '13px',
                        color: '#34d399',
                      }}
                    >
                      En stock —{' '}
                      {product.stock} disponible{product.stock !== 1 ? 's' : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      style={{
                        width: '7px', height: '7px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        flexShrink: 0,
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-outfit)',
                        fontSize: '13px',
                        color: '#ef4444',
                      }}
                    >
                      Agotado — próximamente disponible
                    </span>
                  </>
                )}
              </div>

              {/* WhatsApp CTA */}
              <a
                href={inStock ? waUrl : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!inStock}
                className={inStock ? 'wa-btn' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '17px 28px',
                  borderRadius: '3px',
                  background: inStock
                    ? 'linear-gradient(135deg, #1a9e4f 0%, #25d366 100%)'
                    : 'rgba(255,255,255,0.04)',
                  border: inStock ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: inStock ? '#fff' : '#334155',
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  boxShadow: inStock ? '0 0 32px rgba(37,211,102,0.28)' : 'none',
                  marginBottom: '10px',
                  pointerEvents: inStock ? 'auto' : 'none',
                  cursor: inStock ? 'pointer' : 'not-allowed',
                }}
              >
                <WhatsAppIcon />
                Pedir por WhatsApp
              </a>

              {/* Back to catalog */}
              <Link
                href="/productos"
                className="back-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '13px 28px',
                  borderRadius: '3px',
                  border: '1px solid rgba(59,130,246,0.12)',
                  fontFamily: 'var(--font-outfit)',
                  fontSize: '13px',
                  color: '#475569',
                  textDecoration: 'none',
                }}
              >
                ← Volver al catálogo
              </Link>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
