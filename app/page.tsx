import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Categories from './components/Categories'
import FeaturedProducts from './components/FeaturedProducts'
import WhyChooseUs from './components/WhyChooseUs'
import Footer from './components/Footer'
import { getCategoriesWithCount } from '@/lib/db/queries/categories'
import { getFeaturedProducts } from '@/lib/db/queries/products'

export default async function Home() {
  const [cats, featuredProds] = await Promise.all([
    getCategoriesWithCount(),
    getFeaturedProducts(),
  ])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:font-semibold"
      >
        Saltar al contenido principal
      </a>

      <Navbar />

      <main id="main-content">
        <Hero />
        <Categories categories={cats} />
        <FeaturedProducts products={featuredProds} />
        <WhyChooseUs />
      </main>

      <Footer />
    </>
  )
}
