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

**Objetivo:** convertir la landing estática en una tienda con catálogo público y panel de administración de inventario.

**Decisiones clave:**
- PostgreSQL 18 + Drizzle ORM — DB local `variedades_ic`, psql en `C:/Program Files/PostgreSQL/18/bin/psql`
- NextAuth v5 beta.31 (Credentials) protege `/admin` vía `middleware.ts`
- Un solo admin: `admin@icvariedades.com` / contraseña en `.env.local` (hash bcrypt)
- Imágenes subidas al servidor en `public/uploads/products/` (convertidas a WebP con sharp, max 10 MB)
- Sin pagos, sin cuentas de clientes, sin variantes de producto
- Pedidos vía WhatsApp — número: 573176642382

**Estado actual:**

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Dependencias instaladas (drizzle-orm, next-auth, sharp, zod…) | ✅ listo |
| 2 | `.env.local` + DB `variedades_ic` creada en PostgreSQL | ✅ listo |
| 3 | Schema Drizzle (`lib/db/schema.ts`) + migración aplicada | ✅ listo |
| 4 | Auth: `lib/auth.ts`, API route NextAuth, `middleware.ts`, `/admin/login` | ✅ listo |
| 5 | API routes CRUD: `/api/admin/categories`, `/api/admin/products`, `/api/admin/upload` | ✅ listo |
| 6 | Panel admin: layout sidebar, dashboard, formularios de categorías y productos | ✅ listo |
| 7 | Conectar página principal (`app/page.tsx`) a la BD | ⬜ pendiente |
| 8 | Páginas públicas: catálogo `/productos`, detalle `/productos/[slug]`, filtro por categoría | ⬜ pendiente |
| 9 | Botón WhatsApp en detalle de producto | ⬜ pendiente |
| 10 | Poblar BD con productos reales | ⬜ pendiente |

**Archivos clave del backend:**
- `lib/db/schema.ts` — tablas: `categories`, `products`, `product_images`
- `lib/db/queries/categories.ts` / `products.ts` — queries Drizzle
- `lib/validations.ts` — schemas Zod + función `toSlug()`
- `lib/auth.ts` — configuración NextAuth
- `app/admin/` — panel admin completo (layout, dashboard, categorías, productos)
