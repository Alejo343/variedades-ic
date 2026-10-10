import Link from 'next/link'
import { SearchX } from 'lucide-react'
import ProductCard from '../_components/ProductCard'
import SortSelect from '../_components/SortSelect'
import { WhatsAppIcon } from '../_components/icons'
import { waLink } from '../_lib/shop'
import { getPublicProducts, type PublicProductSort } from '@/lib/db/queries/products'
import { getActiveCategories } from '@/lib/db/queries/categories'

export const metadata = {
  title: 'Catálogo — IC Variedades',
}

const SORTS: PublicProductSort[] = ['recientes', 'precio-asc', 'precio-desc']

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string; orden?: string }>
}) {
  const { categoria, q, orden } = await searchParams
  const search = q?.trim() ?? ''
  const sort = SORTS.find(s => s === orden) ?? 'recientes'

  const [prods, cats] = await Promise.all([
    getPublicProducts(categoria, { search, sort }),
    getActiveCategories(),
  ])
  const activeCat = cats.find(c => c.slug === categoria)

  // Chip links keep the current search and order.
  const hrefFor = (slug?: string) => {
    const params = new URLSearchParams()
    if (slug) params.set('categoria', slug)
    if (search) params.set('q', search)
    if (sort !== 'recientes') params.set('orden', sort)
    const qs = params.toString()
    return qs ? `/productos?${qs}` : '/productos'
  }

  const title = search ? `“${search}”` : activeCat ? activeCat.name : 'Catálogo'

  return (
    <>
      <div className="wrap page-head">
        <span className="eyebrow">{search ? 'Resultados de búsqueda' : activeCat ? 'Categoría' : 'Todo lo que tenemos'}</span>
        <h1 className="display">{title}</h1>
        <p className="count">
          {prods.length} producto{prods.length !== 1 ? 's' : ''}
          {search && activeCat ? ` en ${activeCat.name}` : ''}
        </p>
      </div>

      <div className="toolbar">
        <div className="wrap">
          <form action="/productos" role="search" className="toolbar-row">
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
            <div className="search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input type="search" name="q" defaultValue={search} placeholder="Buscar por nombre…" aria-label="Buscar productos" />
            </div>
            <SortSelect value={sort} />
          </form>

          {cats.length > 0 && (
            <nav className="chips" aria-label="Categorías">
              <Link href={hrefFor()} className="chip" aria-current={!categoria ? 'page' : undefined}>
                Todos
              </Link>
              {cats.map(c => (
                <Link
                  key={c.id}
                  href={hrefFor(c.slug)}
                  className="chip"
                  aria-current={categoria === c.slug ? 'page' : undefined}
                >
                  <span className="dot" style={{ background: c.color ?? 'var(--blue)' }} aria-hidden="true" />
                  {c.name}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 96 }}>
        {prods.length > 0 ? (
          <div className="product-grid">
            {prods.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <span className="ico"><SearchX aria-hidden="true" /></span>
            <h2 className="display">Nada por aquí</h2>
            <p>
              {search
                ? `No encontramos productos con “${search}”${activeCat ? ` en ${activeCat.name}` : ''}.`
                : 'Todavía no hay productos en esta categoría.'}{' '}
              Pregúntanos por WhatsApp, puede que lo tengamos.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 6 }}>
              {(search || categoria) && (
                <Link href="/productos" className="btn btn-ghost">Ver todo el catálogo</Link>
              )}
              <a
                href={waLink(`Hola! Estoy buscando: ${search || activeCat?.name || ''}`.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-wa"
              >
                <WhatsAppIcon /> Preguntar
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
