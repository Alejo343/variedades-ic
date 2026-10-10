import Link from 'next/link'
import { PackageX } from 'lucide-react'

export default function ProductNotFound() {
  return (
    <div className="wrap" style={{ padding: '64px 16px 96px' }}>
      <div className="empty">
        <span className="ico"><PackageX aria-hidden="true" /></span>
        <h1 className="display" style={{ margin: 0, fontSize: '2rem' }}>Este producto ya no está</h1>
        <p>Puede que lo hayamos retirado del catálogo. Mira lo que tenemos ahora.</p>
        <Link href="/productos" className="btn btn-ink" style={{ marginTop: 6 }}>Ir al catálogo</Link>
      </div>
    </div>
  )
}
