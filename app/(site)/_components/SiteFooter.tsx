import Link from 'next/link'
import { InstagramIcon, WhatsAppIcon } from './icons'
import { FREE_DELIVERY_LIST, INSTAGRAM_HANDLE, INSTAGRAM_URL, WA_NUMBER, waLink } from '../_lib/shop'

type NavCategory = { name: string; slug: string }

// 573176642382 → +57 317 664 2382
const WA_DISPLAY = `+${WA_NUMBER.slice(0, 2)} ${WA_NUMBER.slice(2, 5)} ${WA_NUMBER.slice(5, 8)} ${WA_NUMBER.slice(8)}`

export default function SiteFooter({ categories }: { categories: NavCategory[] }) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="top">
          <div>
            <p className="big">
              Todo en<br />un solo <span>lugar.</span>
            </p>
            <p style={{ margin: 0, maxWidth: '36ch' }}>
              Tienda virtual de tecnología, belleza y hogar. Domicilio gratis en{' '}
              {FREE_DELIVERY_LIST}, y envíos a todo el país.
            </p>
          </div>

          <nav aria-label="Tienda">
            <h3>Tienda</h3>
            <ul>
              <li><Link href="/productos">Todo el catálogo</Link></li>
              {categories.map(c => (
                <li key={c.slug}>
                  <Link href={`/productos?categoria=${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3>Contacto</h3>
            <ul>
              <li>
                <a
                  href={waLink('Hola! Vengo de la página de IC Variedades.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-line"
                >
                  <WhatsAppIcon />
                  {WA_DISPLAY}
                </a>
              </li>
              <li>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="wa-line ig-line">
                  <InstagramIcon />
                  {INSTAGRAM_HANDLE}
                </a>
              </li>
              <li>Pedidos y preguntas por WhatsApp</li>
            </ul>
          </div>
        </div>

        <div className="bottom">
          <span>© {new Date().getFullYear()} IC Variedades</span>
          <span>Hecho en Colombia</span>
        </div>
      </div>
    </footer>
  )
}
