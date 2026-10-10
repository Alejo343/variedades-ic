import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Star } from 'lucide-react'
import { PlaceholderArt } from './icons'
import { formatCOP } from '../_lib/shop'

export type ProductCardData = {
  id: number
  name: string
  slug: string
  price: number
  stock: number
  featured: boolean
  categoryName: string | null
  categorySlug: string | null
  primaryImage: string | null
}

// Stock at or below this shows a "quedan N" hint.
const LOW_STOCK = 3

export default function ProductCard({
  product: p,
  priority = false,
}: {
  product: ProductCardData
  priority?: boolean
}) {
  const soldOut = p.stock <= 0

  return (
    <Link href={`/productos/${p.slug}`} className="pc" data-soldout={soldOut}>
      <div className="pc-img">
        {p.primaryImage ? (
          <Image
            src={p.primaryImage}
            alt={p.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1100px) 33vw, 290px"
            style={{ objectFit: 'contain', padding: '8%' }}
            priority={priority}
          />
        ) : (
          <div className="img-fallback"><PlaceholderArt /></div>
        )}
        <div className="pc-badges">
          {soldOut ? (
            <span className="badge badge-ink">Agotado</span>
          ) : p.stock <= LOW_STOCK ? (
            <span className="badge badge-danger">Quedan {p.stock}</span>
          ) : null}
          {p.featured && !soldOut && (
            <span className="badge badge-sun"><Star aria-hidden="true" fill="currentColor" /> Destacado</span>
          )}
        </div>
      </div>

      <div className="pc-body">
        {p.categoryName && <span className="pc-cat">{p.categoryName}</span>}
        <h3 className="pc-name">{p.name}</h3>
        <div className="pc-foot">
          <span className="pc-price">{formatCOP(p.price)}</span>
          <span className="pc-go" aria-hidden="true"><ArrowUpRight /></span>
        </div>
      </div>
    </Link>
  )
}
