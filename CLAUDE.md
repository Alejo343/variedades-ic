# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # start dev server at localhost:3000
npm run build     # production build
npm run lint      # ESLint (Next.js + TypeScript rules)
```

There is no test suite.

## Architecture

Single-page marketing site for **IC Variedades** (a Colombian store selling tech, beauty, and home goods). Built with Next.js 16, React 19, Tailwind CSS v4, TypeScript.

### Components

`app/components/` contains: `Hero`, `Categories`, `FeaturedProducts`, `WhyChooseUs`, `Footer`, and `Navbar`. All are rendered by `app/page.tsx`.

### Font system

`app/context/FontContext.tsx` provides a global font toggle (Outfit ↔ Orbitron) via React context. The `FontProvider` wraps the app in `layout.tsx`. The Navbar exposes a toggle button that calls `useFont().toggleFont()`. Two Google Fonts are registered as CSS variables in `layout.tsx`: `--font-outfit`, `--font-orbitron`.

### Styling

`app/globals.css` uses Tailwind v4's `@import "tailwindcss"` and `@theme inline` for design tokens. Custom CSS animation classes:

- `.slide-in-left`, `.slide-in-right` — entrance animations
- `.pulse-dot`, `.hero-card` — ambient animations
- `.scroll-reveal` — scroll-triggered fade-in (add `.visible` to activate)

All animations respect `prefers-reduced-motion`.

### Next.js version note

This project uses Next.js **16** (see `package.json`). APIs and conventions may differ from your training data — consult `node_modules/next/dist/docs/` for the authoritative reference before writing Next.js-specific code.

## Roadmap: ecommerce + admin panel

**Objetivo:** convertir la landing estática en una tienda con catálogo público y panel de administración de inventario, compras a distribuidores y ventas a clientes.

**Decisiones clave:**

- PostgreSQL 18 + Drizzle ORM — DB local `variedades_ic`, psql en `C:/Program Files/PostgreSQL/18/bin/psql`
- Migración con `DATABASE_URL=... npx drizzle-kit generate` + `npx drizzle-kit migrate` (el shell no carga `.env.local` automáticamente)
- NextAuth v5 beta.31 (Credentials) protege `/admin` vía `middleware.ts`
- Un solo admin: `admin@icvariedades.com` / contraseña en `.env.local` (hash bcrypt)
- Imágenes subidas al servidor en `public/uploads/products/` (convertidas a WebP con sharp, max 10 MB)
- Sin pagos, sin cuentas de clientes, sin variantes de producto
- Pedidos de clientes vía WhatsApp — número: 573176642382
- El dueño viaja a otra ciudad a recoger pedidos de distribuidores (flujo: pendiente → en_viaje → recibido)
- Al marcar compra como "recibido", el stock se actualiza automáticamente en transacción

**Estado actual:**

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Dependencias instaladas (drizzle-orm, next-auth, sharp, zod…) | ✅ listo |
| 2 | `.env.local` + DB `variedades_ic` creada en PostgreSQL | ✅ listo |
| 3 | Schema Drizzle (`lib/db/schema.ts`) + migración aplicada | ✅ listo |
| 4 | Auth: `lib/auth.ts`, API route NextAuth, `middleware.ts`, `/admin/login` | ✅ listo |
| 5 | API routes CRUD: categorías, productos, upload, distribuidores, compras, ventas | ✅ listo |
| 6 | Panel admin: categorías, productos, distribuidores, pedidos de compra, pedidos de venta | ✅ listo |
| 7 | Conectar página principal (`app/page.tsx`) a la BD | ✅ listo |
| 8 | Páginas públicas: catálogo `/productos`, detalle `/productos/[slug]`, filtro por categoría | ✅ listo |
| 9 | Botón WhatsApp en detalle de producto | ✅ listo |
| 10 | Poblar BD con productos reales | ⬜ pendiente |

**Archivos clave del backend:**
- `lib/db/schema.ts` — tablas: `categories`, `products`, `product_images`, `distributors`, `purchase_orders`, `purchase_order_items`, `sales_orders`, `sales_order_items`
- `lib/db/queries/categories.ts` / `products.ts` / `distributors.ts` / `purchase-orders.ts` / `sales-orders.ts` — queries Drizzle
- `lib/validations.ts` — schemas Zod + función `toSlug()`
- `lib/auth.ts` — configuración NextAuth
- `app/admin/` — panel admin completo

**Módulo de pedidos:**

Flujo compras a distribuidores (`purchase_orders`):
- Estados: `pendiente` → `en_viaje` → `recibido` | `cancelado`
- Al recibir: transacción que suma `quantity` al `stock` de cada producto (bandera `stockUpdated` evita duplicados)
- API: `POST /api/admin/purchase-orders/{id}/receive`

Flujo ventas a clientes (`sales_orders`):
- Estados: `pendiente` → `confirmado` → `entregado` | `cancelado`
- Precio de cada item queda guardado al momento del pedido (`unitPrice`)

**Patrón de API routes (seguir siempre):**
1. `auth()` al inicio — devolver 401 si no hay sesión
2. `schema.safeParse(body)` — devolver 400 con `error.flatten()` si falla
3. Parámetros dinámicos: `const { id } = await ctx.params` (son `Promise` en Next.js 16)
4. Soft delete para catálogos (categorías, distribuidores): `active = false`
5. Delete real para pedidos y sus items
