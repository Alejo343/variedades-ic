import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, Truck } from "lucide-react";
import ProductCard from "./_components/ProductCard";
import { InstagramIcon, PlaceholderArt, WhatsAppIcon } from "./_components/icons";
import {
  FREE_DELIVERY_LIST,
  FREE_DELIVERY_TOWNS,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  formatCOP,
  waLink,
} from "./_lib/shop";
import { CUTOUTS, TICKER_CUTOUTS } from "./_lib/vitrina";
import { getCategoriesWithCount } from "@/lib/db/queries/categories";
import {
  countPublicProducts,
  getFeaturedProducts,
  getHeroProducts,
} from "@/lib/db/queries/products";

const HELLO = "Hola! Vengo de la página de IC Variedades.";

// Hero collage; positions live in globals.css (.hv-*).
const HERO_CUTOUTS = [
  { c: CUTOUTS.parlante, cls: "hv-main", priority: true },
  { c: CUTOUTS.camara, cls: "hv-camara", priority: false },
  { c: CUTOUTS.audifonos, cls: "hv-audifonos", priority: false },
  { c: CUTOUTS.plancha, cls: "hv-plancha", priority: false },
  { c: CUTOUTS.difusor, cls: "hv-difusor", priority: false },
  { c: CUTOUTS.tirasLed, cls: "hv-led", priority: false },
];

export default async function Home() {
  const [cats, featured, productCount, heroProducts] = await Promise.all([
    getCategoriesWithCount(),
    getFeaturedProducts(),
    countPublicProducts(),
    getHeroProducts(2),
  ]);

  const tickerWords =
    cats.length > 0
      ? cats.map((c) => c.name)
      : ["Tecnología", "Belleza", "Hogar"];
  const ticker = [...tickerWords, "Pide por WhatsApp"];

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow rise">
              Tienda virtual · envíos a todo el país
            </span>
            <h1 id="hero-title" className="display rise rise-2">
              Lo que buscas, <span className="marker">a un mensaje</span> de
              distancia.
            </h1>
            <p className="hero-lead rise rise-3">
              Tecnología, belleza y hogar en un solo lugar. Elige en el catálogo
              y te atendemos directo por WhatsApp.
            </p>
            <div className="hero-ctas rise rise-3">
              <Link href="/productos" className="btn btn-ink btn-lg">
                Ver catálogo <ArrowRight aria-hidden="true" />
              </Link>
              <a
                href={waLink(HELLO)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-lg"
              >
                <WhatsAppIcon /> Escríbenos
              </a>
            </div>
            <dl className="hero-stats rise rise-4">
              <div>
                <dt>productos en catálogo</dt>
                <dd>{productCount}</dd>
              </div>
              <div>
                <dt>categorías</dt>
                <dd>{cats.length}</dd>
              </div>
              <div>
                <dt>para pedir</dt>
                <dd>1 mensaje</dd>
              </div>
            </dl>
          </div>

          <div className="hero-stage rise rise-3">
            <div className="hero-sun" aria-hidden="true" />
            <div className="hero-orbit" aria-hidden="true" />
            <div className="hero-floor" aria-hidden="true" />

            <div aria-hidden="true">
              {HERO_CUTOUTS.map(({ c, cls, priority }) => (
                <div key={cls} className={`hv ${cls}`}>
                  <Image
                    src={c.src}
                    width={c.w}
                    height={c.h}
                    alt=""
                    sizes="(max-width: 1024px) 60vw, 360px"
                    priority={priority}
                  />
                </div>
              ))}
            </div>

            {heroProducts.map((p, i) => (
              <Link
                key={p.id}
                href={`/productos/${p.slug}`}
                className={`hero-pick hero-pick-${i + 1}`}
              >
                <span className="img">
                  <Image
                    src={p.primaryImage!}
                    alt=""
                    fill
                    sizes="72px"
                    style={{ objectFit: "contain" }}
                  />
                </span>
                <span className="txt">
                  <span className="kicker">
                    {p.featured ? "Destacado" : "Nuevo en tienda"}
                  </span>
                  <span className="name">{p.name}</span>
                  <span className="tag">{formatCOP(p.price)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((copy) => (
            <div key={copy} style={{ display: "flex" }}>
              {[...ticker, ...ticker].map((w, i) => {
                const c = TICKER_CUTOUTS[i % TICKER_CUTOUTS.length];
                return (
                  <span key={i} className="ticker-item">
                    {w}
                    <Image
                      src={c.src}
                      width={c.w}
                      height={c.h}
                      alt=""
                      sizes="48px"
                      className="ticker-cut"
                    />
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Delivery ── */}
      <section className="section-tight" aria-labelledby="delivery-title">
        <div className="wrap">
          <div className="delivery reveal">
            <div className="delivery-free">
              <span className="delivery-badge">Domicilio gratis</span>
              <h2 id="delivery-title" className="display">Te lo llevamos sin costo</h2>
              <ul className="delivery-towns" aria-label="Municipios con domicilio gratis">
                {FREE_DELIVERY_TOWNS.map(t => (
                  <li key={t}><MapPin aria-hidden="true" /> {t}</li>
                ))}
              </ul>
            </div>
            <div className="delivery-country">
              <span className="delivery-ico" aria-hidden="true"><Truck /></span>
              <div>
                <h3 className="display">Envíos a todo el país</h3>
                <p>¿Estás en otra ciudad? Escríbenos y te contamos cómo llega tu pedido.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      {cats.length > 0 && (
        <section className="section" aria-labelledby="cats-title">
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="eyebrow">Explora</span>
                <h2 id="cats-title" className="display">
                  Compra por categoría
                </h2>
              </div>
              <Link href="/productos" className="link-arrow">
                Todo el catálogo <ArrowRight aria-hidden="true" />
              </Link>
            </div>

            <div className="cat-grid" data-count={cats.length}>
              {cats.map((c) => (
                <Link
                  key={c.id}
                  href={`/productos?categoria=${c.slug}`}
                  className="cat-tile reveal"
                  style={
                    { "--cat": c.color ?? undefined } as React.CSSProperties
                  }
                >
                  <span className="count">
                    {c.productCount} producto{c.productCount !== 1 ? "s" : ""}
                  </span>
                  <div>
                    <h3 className="display">{c.name}</h3>
                    {c.description && <p className="desc">{c.description}</p>}
                  </div>
                  <CategoryTileArt image={c.image} />
                  <span className="go" aria-hidden="true">
                    <ArrowUpRight />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured ── */}
      {featured.length > 0 && (
        <section
          className="section"
          style={{ paddingTop: 0 }}
          aria-labelledby="featured-title"
        >
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="eyebrow">Lo más pedido</span>
                <h2 id="featured-title" className="display">
                  Destacados
                </h2>
              </div>
              <Link href="/productos" className="link-arrow">
                Ver todo <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className="product-grid">
              {featured.map((p) => (
                <div
                  key={p.id}
                  className="reveal"
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How to buy ── */}
      <section
        className="section"
        style={{ background: "var(--paper-2)" }}
        aria-labelledby="how-title"
      >
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Así de fácil</span>
              <h2 id="how-title" className="display">
                Cómo comprar
              </h2>
              <p>
                Sin carritos ni registros: hablas con una persona de la tienda.
              </p>
            </div>
          </div>
          <ol
            className="steps"
            style={{ listStyle: "none", margin: 0, padding: 0 }}
          >
            <li className="step reveal">
              <span className="step-num">1</span>
              <h3 className="display">Elige</h3>
              <p>
                Busca en el catálogo y abre el producto que te gusta para ver
                fotos, precio y disponibilidad.
              </p>
            </li>
            <li className="step reveal">
              <span className="step-num">2</span>
              <h3 className="display">Escríbenos</h3>
              <p>
                Toca «Pedir por WhatsApp». El mensaje sale listo con el producto
                y el precio.
              </p>
            </li>
            <li className="step reveal">
              <span className="step-num">3</span>
              <h3 className="display">Recíbelo</h3>
              <p>
                Confirmamos tu pedido y acordamos el pago. Domicilio gratis en{" "}
                {FREE_DELIVERY_LIST}; al resto del país te lo enviamos.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section" aria-labelledby="cta-title">
        <div className="wrap">
          <div className="cta-band reveal">
            <div>
              <h2 id="cta-title" className="display">
                ¿No encuentras lo que buscas?
              </h2>
              <p>
                Pregúntanos por WhatsApp o mira las novedades en Instagram.
              </p>
            </div>
            <div className="cta-actions">
              <a
                href={waLink(HELLO + " Estoy buscando: ")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-wa btn-lg"
              >
                <WhatsAppIcon /> Preguntar por WhatsApp
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ig btn-lg"
              >
                <InstagramIcon /> {INSTAGRAM_HANDLE}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// Category picture (already resolved by getCategoriesWithCount: manual
// image, else a photo of one of its products), else a line icon.
function CategoryTileArt({ image }: { image: string | null }) {
  if (!image) {
    return (
      <span className="art-photo art-photo-none" aria-hidden="true">
        <PlaceholderArt />
      </span>
    );
  }
  return (
    <span className="art-photo" aria-hidden="true">
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 640px) 45vw, 240px"
        style={{ objectFit: "contain" }}
      />
    </span>
  );
}
