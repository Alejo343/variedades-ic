'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, Menu, Search, X } from 'lucide-react'
import { InstagramIcon, PlaceholderArt, WhatsAppIcon } from './icons'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, waLink } from '../_lib/shop'

type NavCategory = {
  name: string
  slug: string
  color: string | null
  image: string | null
  productCount: number
}

const countLabel = (n: number) => `${n} producto${n !== 1 ? 's' : ''}`

function SearchForm({ autoFocus = false }: { autoFocus?: boolean }) {
  return (
    <form action="/productos" role="search" className="search">
      <Search aria-hidden="true" />
      <input
        type="search"
        name="q"
        placeholder="Buscar productos…"
        aria-label="Buscar productos"
        autoFocus={autoFocus}
      />
    </form>
  )
}

// Picture for a category in the menu (manual or one of its products'
// photos, resolved on the server), else a line icon.
function CategoryThumb({ category }: { category: NavCategory }) {
  if (!category.image) return <PlaceholderArt />
  return <Image src={category.image} alt="" width={56} height={56} sizes="56px" />
}

// Desktop "Categorías" dropdown. Every category lives here, so the bar keeps
// the same width however many there are. Closes on Esc (focus back to the
// button), outside click, or picking a link.
function CategoriesMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="cat-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="nav-trigger"
        aria-expanded={open}
        aria-controls="menu-categorias"
        onClick={() => setOpen(o => !o)}
      >
        Categorías <ChevronDown aria-hidden="true" />
      </button>

      {open && (
        <div id="menu-categorias" className="cat-panel">
          <ul data-count={categories.length}>
            {categories.map(c => (
              <li key={c.slug}>
                <Link
                  href={`/productos?categoria=${c.slug}`}
                  onClick={() => setOpen(false)}
                  style={{ '--cat': c.color ?? undefined } as React.CSSProperties}
                >
                  <span className="thumb" aria-hidden="true"><CategoryThumb category={c} /></span>
                  <span>
                    <span className="name">{c.name}</span>
                    <span className="count">{countLabel(c.productCount)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/productos" className="cat-panel-all" onClick={() => setOpen(false)}>
            Ver todo el catálogo <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  )
}

export default function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on navigation (render-time reset, no effect needed).
  // A query-only change (?categoria=) keeps the pathname, so the links also
  // close it on click.
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  return (
    <header className="site-header" data-scrolled={scrolled || open}>
      <div className="wrap bar">
        <Link href="/" className="brand" aria-label="IC Variedades — inicio">
          <Image src="/logo.png" alt="" width={84} height={84} priority />
          <span>
            <span className="brand-name">IC Variedades</span>
            <span className="brand-sub">Tecnología · Belleza · Hogar</span>
          </span>
        </Link>

        <nav aria-label="Principal" className="nav-links">
          <Link href="/productos" aria-current={pathname === '/productos' ? 'page' : undefined}>
            Catálogo
          </Link>
          {categories.length > 0 && <CategoriesMenu categories={categories} />}
        </nav>

        <div className="header-search">
          <SearchForm />
        </div>

        <div className="header-actions">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn ig-btn"
            aria-label="Síguenos en Instagram"
            title="Instagram"
          >
            <InstagramIcon />
          </a>
          <a
            href={waLink('Hola! Vengo de la página de IC Variedades.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-wa btn-sm"
            aria-label="Escríbenos por WhatsApp"
          >
            <WhatsAppIcon />
            <span className="header-wa-label">Escríbenos</span>
          </a>
          <button
            type="button"
            className="icon-btn menu-toggle"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="menu-movil" className="mobile-menu">
          <div className="wrap">
            <SearchForm autoFocus />
            <ul>
              <li>
                <Link href="/productos" onClick={() => setOpen(false)}>
                  Todo el catálogo <ArrowRight aria-hidden="true" />
                </Link>
              </li>
              {categories.map(c => (
                <li key={c.slug}>
                  <Link href={`/productos?categoria=${c.slug}`} onClick={() => setOpen(false)}>
                    <span>
                      {c.name}
                      <span className="mm-count">{countLabel(c.productCount)}</span>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="mm-ig">
              <InstagramIcon /> Síguenos en Instagram <span>{INSTAGRAM_HANDLE}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
