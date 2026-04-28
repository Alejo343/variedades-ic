import Navbar from './components/Navbar'
import Hero2 from './components/Hero2'
import Categories2 from './components/Categories2'
import FeaturedProducts2 from './components/FeaturedProducts2'
import WhyChooseUs2 from './components/WhyChooseUs2'
import Footer2 from './components/Footer2'

export default function Home() {
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
        <Hero2 />
        <Categories2 />
        <FeaturedProducts2 />
        <WhyChooseUs2 />
      </main>

      <Footer2 />
    </>
  )
}
