import { Archivo, Hanken_Grotesk } from 'next/font/google'
import SiteHeader from './_components/SiteHeader'
import SiteFooter from './_components/SiteFooter'
import { getCategoriesWithCount } from '@/lib/db/queries/categories'

// Every public page reads the DB (the header lists live categories):
// render per request, never freeze it at build time.
export const dynamic = 'force-dynamic'

const display = Archivo({
  variable: '--font-site-display',
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
})

const body = Hanken_Grotesk({
  variable: '--font-site-body',
  subsets: ['latin'],
  display: 'swap',
})

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategoriesWithCount()
  const nav = categories.map(c => ({
    name: c.name,
    slug: c.slug,
    color: c.color,
    image: c.image,
    productCount: c.productCount,
  }))

  return (
    <div className={`site ${display.variable} ${body.variable}`}>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <SiteHeader categories={nav} />
      <main id="contenido" className="site-main">{children}</main>
      <SiteFooter categories={nav} />
    </div>
  )
}
