# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # start dev server at localhost:3000
npm run build      # production build
npm run lint       # ESLint (Next.js + TypeScript rules)
npm run test       # Vitest, single run
npm run test:watch # Vitest, watch mode
```

The test suite (Vitest) covers the pure business-logic layer in `lib/domain/*`
and `lib/validations.ts` — not API routes, DB queries, or components. Those
are verified manually (`npm run dev` + exercising the flow) plus
`npm run lint` / `npm run build`.

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
- NextAuth v5 beta.31 (Credentials) protege `/admin` vía `proxy.ts` (renombrado
  desde `middleware.ts`, convención de Next.js 16)
- Un solo admin: `admin@icvariedades.com` / contraseña en `.env.local` (hash bcrypt)
- Imágenes subidas al servidor en `public/uploads/products/` (convertidas a WebP con sharp, max 10 MB)
- Sin pagos, sin cuentas de clientes, sin variantes de producto
- Pedidos de clientes vía WhatsApp — número: 573176642382
- El dueño viaja a otra ciudad a recoger pedidos de distribuidores (flujo: pendiente → en_viaje → recibido)
- Al marcar compra como "recibido", el stock se actualiza automáticamente en transacción

**Estado actual:**

| #   | Tarea                                                                                      | Estado       |
| --- | ------------------------------------------------------------------------------------------ | ------------ |
| 1   | Dependencias instaladas (drizzle-orm, next-auth, sharp, zod…)                              | ✅ listo     |
| 2   | `.env.local` + DB `variedades_ic` creada en PostgreSQL                                     | ✅ listo     |
| 3   | Schema Drizzle (`lib/db/schema.ts`) + migración aplicada                                   | ✅ listo     |
| 4   | Auth: `lib/auth.ts`, API route NextAuth, `proxy.ts`, `/admin/login`                        | ✅ listo     |
| 5   | API routes CRUD: categorías, productos, upload, distribuidores, compras, ventas            | ✅ listo     |
| 6   | Panel admin: categorías, productos, distribuidores, pedidos de compra, pedidos de venta    | ✅ listo     |
| 7   | Conectar página principal (`app/page.tsx`) a la BD                                         | ✅ listo     |
| 8   | Páginas públicas: catálogo `/productos`, detalle `/productos/[slug]`, filtro por categoría | ✅ listo     |
| 9   | Botón WhatsApp en detalle de producto                                                      | ✅ listo     |
| 10  | Poblar BD con productos reales                                                             | ⬜ pendiente |

**Archivos clave del backend:**

- `lib/db/schema.ts` — tablas: `categories`, `products`, `product_images`, `distributors`, `purchase_orders`, `purchase_order_items`, `sales_orders`, `sales_order_items`
- `lib/db/queries/categories.ts` / `products.ts` / `distributors.ts` / `purchase-orders.ts` / `sales-orders.ts` — queries Drizzle
- `lib/domain/order-status.ts` — máquina de estados pura (transiciones válidas de compras/ventas), con tests
- `lib/domain/stock.ts` — aritmética de stock pura (`receiveStock`, `deductStock`), con tests
- `lib/validations.ts` — schemas Zod + función `toSlug()`, con tests
- `lib/auth.ts` — configuración NextAuth
- `app/admin/` — panel admin completo

**Módulo de pedidos:**

Ambos flujos comparten las transiciones válidas definidas en
`lib/domain/order-status.ts` (`canTransitionPurchaseOrder` / `canTransitionSalesOrder`).

Flujo compras a distribuidores (`purchase_orders`):

- Estados: `pendiente` → `en_viaje` → `recibido` | `cancelado`
- Al recibir: transacción que suma `quantity` al `stock` de cada producto
  (`lib/domain/stock.ts#receiveStock`); bandera `stockUpdated` evita duplicados
  y el guard exige que el pedido esté `en_viaje`
- API: `POST /api/admin/purchase-orders/{id}/receive` (único camino a `recibido`;
  el PUT genérico rechaza ese valor)

Flujo ventas a clientes (`sales_orders`):

- Estados: `pendiente` → `confirmado` → `entregado` | `cancelado`
- Precio de cada item queda guardado al momento del pedido (`unitPrice`)
- Al confirmar (`confirmSalesOrder` en `lib/db/queries/sales-orders.ts`): transacción
  que descuenta stock con `lib/domain/stock.ts#deductStock`; si algún item no tiene
  stock suficiente, rechaza con 400 y no escribe nada (chequea todos los items antes
  de aplicar cualquier descuento)

**Patrón de API routes (seguir siempre):**

1. `auth()` al inicio — devolver 401 si no hay sesión
2. `schema.safeParse(body)` — devolver 400 con `error.flatten()` si falla
3. Parámetros dinámicos: `const { id } = await ctx.params` (son `Promise` en Next.js 16)
4. Soft delete para catálogos (categorías, distribuidores): `active = false`
5. Delete real para pedidos y sus items
6. Cambios de `status` en pedidos pasan por `lib/domain/order-status.ts` — rechazar
   con 400 si la transición no es válida (ver `purchase-orders/[id]/route.ts` y
   `sales-orders/[id]/route.ts` como referencia)

Guía para Claude Code al trabajar en este repositorio. Léela antes de tocar código.

## Cómo trabajamos aquí (spec-driven + tests)

Esto **no es "vibe coding"**. Para cada módulo, en este orden estricto:

1. **Contrato primero**: definir entrada, salida e invariantes (tipos + comentario).
   Nada de escribir implementación antes de saber qué debe cumplir.
2. **Test de solución conocida**: un caso pequeño cuya respuesta se sepa a mano,
   escrito ANTES que la implementación.
3. **Implementación**: el mínimo código hasta que el test pase.
4. **Verificar antes de seguir**: typecheck estricto + TODA la suite en verde.
   No se avanza al siguiente módulo con algo en rojo.

La spec y los tests son la verdad; el código es solo el _cómo_.

### Principios que lo refuerzan

- **La spec es la "verdad única".** Si el código y la spec discrepan, gana la
  spec (o se actualiza la spec de forma explícita, nunca en silencio).
- **Oráculos para lo difícil**: si un algoritmo es difícil de verificar a ojo,
  construir un solver de referencia (fuerza bruta / implementación ingenua) y
  validar contra él con muchos casos aleatorios. La confianza viene de la comparación.
- **Trocear**: avanzar en partes pequeñas y autocontenidas, no todo de golpe.
- **Decisiones del usuario en las bifurcaciones** que cambian la calidad del
  producto: no elegir por él; presentar trade-offs y pedir que decida.
- **Toda función de lógica llega con su test.** Nada de lógica central sin cobertura.

## Arquitectura y reglas duras

La idea clave: cada capa tiene una responsabilidad y no invade a las demás.

- **Acceso a datos aislado en `lib/db/queries/*`.** Todo el SQL/Drizzle vive ahí
  (`categories.ts`, `products.ts`, `distributors.ts`, `purchase-orders.ts`,
  `sales-orders.ts`). Ni componentes ni API routes escriben queries directamente.
- **Reglas de negocio y validación en `lib/validations.ts`** (schemas Zod +
  helpers como `toSlug()`). Es la fuente única de verdad de qué datos son válidos.
- **Lógica de negocio pura y testeada en `lib/domain/*`** (`order-status.ts`,
  `stock.ts`). Sin dependencias de red ni BD — decide qué transiciones y
  operaciones de stock son válidas; las queries de `lib/db/queries/*` la
  invocan pero no la reimplementan.
- **API routes (`app/api/admin/*`) son la capa de borde.** Su patrón fijo:
  `auth()` → `schema.safeParse(body)` → delegar en una query de `lib/db/queries`.
  No mezclan lógica de negocio con acceso a datos.
- **Server Components leen datos vía las queries**; los client components solo
  manejan UI e interacción (formularios, estado, WhatsApp). Los side-effects
  (BD, sharp/subida de imágenes, HTTP) nunca viven en el árbol de UI.
- **Operaciones con invariantes van en transacción.** Ej.: al marcar una compra
  como `recibido` se suma el stock dentro de una transacción con la bandera
  `stockUpdated` para evitar duplicados.

## Convenciones

- **Tipado estricto** en todo el proyecto.
- No introduzcas dependencias pesadas en la capa de lógica pura sin justificarlo.
- **Idioma**: código y comentarios pueden ir en inglés; docs y explicaciones al
  usuario, en <TU IDIOMA>.
- Verifica siempre antes de dar algo por terminado: no digas "hecho" sin haber
  corrido typecheck + tests y visto el verde.

## Estado actual

<!-- Mantén esta sección viva: qué está COMPLETO, qué es lo próximo, decisiones
     tomadas y riesgos abiertos. Es lo primero que Claude lee al retomar. -->

**Completo:**

- Base de datos PostgreSQL 18 + Drizzle (`variedades_ic`), schema y migraciones aplicadas.
- Auth NextAuth v5 (un solo admin) protegiendo `/admin` vía `proxy.ts`.
- API routes CRUD: categorías, productos, subida de imágenes, distribuidores,
  pedidos de compra y pedidos de venta.
- Panel admin completo en `app/admin/`.
- Página principal (`app/page.tsx`) y páginas públicas conectadas a la BD:
  catálogo `/productos`, detalle `/productos/[slug]`, filtro por categoría.
- Botón de WhatsApp en el detalle de producto (número `573176642382`).
- Módulo de compras a distribuidores con actualización automática de stock al recibir,
  y guard que exige que el pedido esté `en_viaje` antes de aceptarlo.
- Módulo de ventas: al confirmar un pedido se descuenta el stock automáticamente
  y se rechaza si no alcanza (`confirmSalesOrder`).
- Transiciones de estado (compras y ventas) validadas también en la API, no solo
  en la UI — `lib/domain/order-status.ts`.
- Capa de lógica pura con tests (Vitest): `lib/domain/order-status.ts`,
  `lib/domain/stock.ts`, `lib/validations.ts#toSlug`.

**Próximo:**

- Poblar la BD con productos reales (única tarea del roadmap aún pendiente).

**Decisiones tomadas:**

- Sin pagos, sin cuentas de clientes, sin variantes de producto. Pedidos vía WhatsApp.
- Imágenes subidas a `public/uploads/products/`, convertidas a WebP con sharp (máx. 10 MB).
- Migraciones: `DATABASE_URL=... npx drizzle-kit generate` + `migrate`
  (el shell no carga `.env.local` automáticamente).
- El stock de ventas se descuenta al pasar a `confirmado` (no a `entregado`), para
  evitar sobreventa lo antes posible en el flujo.

**Riesgos abiertos:**

- La suite de tests solo cubre `lib/domain/*` y `lib/validations.ts` (lógica
  pura). Las API routes, las queries de Drizzle y los componentes se verifican
  manualmente (`npm run dev` + flujo real, `npm run lint`, `npm run build`).

## Comandos

```bash
npm install         # instalar dependencias
npm run dev         # arranque en dev (localhost:3000)
npm run build       # build de producción (verifica también tipos)
npm run lint        # ESLint (reglas Next.js + TypeScript)
npm run test        # Vitest — lib/domain/* y lib/validations.ts
npm run test:watch  # Vitest en modo watch
```

`npm run test` cubre solo la capa de lógica pura (`lib/domain/*`,
`lib/validations.ts`). La verificación previa a dar algo por terminado es
`npm run test` + `npm run lint` + `npm run build` en verde, más una pasada
manual en `npm run dev` para los flujos que tocan la BD o la UI.
