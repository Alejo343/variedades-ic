import Navbar from './components/Navbar'
import Hero3 from './components/Hero3'
import Categories3 from './components/Categories3'
import FeaturedProducts3 from './components/FeaturedProducts3'
import WhyChooseUs3 from './components/WhyChooseUs3'
import Footer3 from './components/Footer3'

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
        <Hero3 />
        <Categories3 />
        <FeaturedProducts3 />
        <WhyChooseUs3 />
      </main>

      <Footer3 />
    </>
  )
}
