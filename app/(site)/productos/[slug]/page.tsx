import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ChevronRight, MessageCircle, PackageCheck, ShieldCheck, Clock, Truck } from 'lucide-react'
import ProductGallery from '../../_components/ProductGallery'
import ProductCard from '../../_components/ProductCard'
import { WhatsAppIcon } from '../../_components/icons'
import { FREE_DELIVERY_LIST, formatCOP, waLink } from '../../_lib/shop'
import { getProductBySlug, getRelatedProducts } from '@/lib/db/queries/products'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}
  return {
    title: `${product.name} — IC Variedades`,
    description: product.description?.slice(0, 160) ?? `${product.name} a ${formatCOP(product.price)} en IC Variedades.`,
  }
}

function warrantyLabel(months: number) {
  if (months % 12 === 0) {
    const years = months / 12
    return `${years} año${years !== 1 ? 's' : ''} de garantía`
  }
  return `${months} mes${months !== 1 ? 'es' : ''} de garantía`
}

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const related = product.categoryId
    ? await getRelatedProducts(product.categoryId, product.id)
    : []

  const inStock = product.stock > 0
  const orderUrl = waLink(
    product.whatsappText ??
      `Hola! Me interesa el producto: *${product.name}* — Precio: ${formatCOP(product.price)}`
  )
  const askUrl = waLink(`Hola! ¿Cuándo vuelve a estar disponible *${product.name}*?`)
  const ctaUrl = inStock ? orderUrl : askUrl
  const ctaLabel = inStock ? 'Pedir por WhatsApp' : 'Avísame cuando llegue'

  return (
    <div className="has-buy-bar">
      <div className="wrap">
        <nav aria-label="Ruta de navegación" className="crumbs">
          <Link href="/">Inicio</Link>
          <ChevronRight aria-hidden="true" />
          <Link href="/productos">Catálogo</Link>
          {product.categoryName && (
            <>
              <ChevronRight aria-hidden="true" />
              <Link href={`/productos?categoria=${product.categorySlug}`}>{product.categoryName}</Link>
            </>
          )}
          <ChevronRight aria-hidden="true" />
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="pd">
          <ProductGallery
            images={product.images}
            productName={product.name}
            categorySlug={product.categorySlug}
          />

          <div className="pd-info">
            {product.categoryName && (
              <Link href={`/productos?categoria=${product.categorySlug}`} className="pd-cat">
                <span className="dot" aria-hidden="true" />
                {product.categoryName}
              </Link>
            )}

            <h1 className="display">{product.name}</h1>

            <div className="pd-price-row">
              <span className="tag tag-lg">{formatCOP(product.price)}</span>
              {inStock ? (
                <span className="stock-pill" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>
                  <span className="pulse" aria-hidden="true" />
                  {product.stock <= 3
                    ? `¡Quedan ${product.stock}!`
                    : 'Disponible'}
                </span>
              ) : (
                <span className="stock-pill" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                  Agotado por ahora
                </span>
              )}
            </div>

            <ul className="pd-facts">
              <li>
                <span className="ico"><MessageCircle aria-hidden="true" /></span>
                Pides por WhatsApp y te atiende una persona
              </li>
              {product.warrantyMonths ? (
                <li>
                  <span className="ico"><ShieldCheck aria-hidden="true" /></span>
                  {warrantyLabel(product.warrantyMonths)}
                </li>
              ) : null}
              <li>
                <span className="ico">{inStock ? <PackageCheck aria-hidden="true" /> : <Clock aria-hidden="true" />}</span>
                {inStock ? 'Pago y entrega se acuerdan contigo' : 'Escríbenos y te avisamos cuando vuelva'}
              </li>
              <li>
                <span className="ico"><Truck aria-hidden="true" /></span>
                <span>
                  Domicilio gratis en {FREE_DELIVERY_LIST}
                  <span className="sub">Envíos a todo el país</span>
                </span>
              </li>
            </ul>

            <div className="pd-actions">
              <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-lg btn-block">
                <WhatsAppIcon /> {ctaLabel}
              </a>
              {product.categorySlug && (
                <Link href={`/productos?categoria=${product.categorySlug}`} className="btn btn-ghost btn-block">
                  Ver más de {product.categoryName} <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </div>

            {product.description && (
              <div className="pd-desc" style={{ marginTop: 30 }}>
                <h2>Descripción</h2>
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related" aria-labelledby="related-title">
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="eyebrow">También te puede gustar</span>
                <h2 id="related-title" className="display">Más de {product.categoryName}</h2>
              </div>
              <Link href={`/productos?categoria=${product.categorySlug}`} className="link-arrow">
                Ver todos <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className="product-grid">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      <div className="buy-bar">
        <span className="price">{formatCOP(product.price)}</span>
        <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-wa">
          <WhatsAppIcon /> {inStock ? 'Pedir' : 'Avísame'}
        </a>
      </div>
    </div>
  )
}
