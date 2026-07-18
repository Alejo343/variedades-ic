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

- `lib/db/schema.ts` — tablas: `categories`, `products`, `product_images`, `distributors`, `purchase_orders`, `purchase_order_items`, `sales_orders`, `sales_order_items`, `inventory_movements`, `sellers`, `cash_movements`, `direct_sales`, `direct_sale_items`, `seller_deliveries`, `seller_delivery_items`; secuencia `product_sku_seq`
- `lib/db/queries/categories.ts` / `products.ts` / `distributors.ts` / `purchase-orders.ts` / `sales-orders.ts` / `inventory.ts` / `sellers.ts` / `cash.ts` / `direct-sales.ts` / `seller-deliveries.ts` — queries Drizzle
- `lib/domain/order-status.ts` — máquina de estados pura (transiciones válidas de compras/ventas), con tests
- `lib/domain/stock.ts` — aritmética de stock pura (`receiveStock`, `deductStock`), con tests
- `lib/domain/inventory-movement.ts` — `applyMovement`/`validateAdjustmentReason`, con tests
- `lib/domain/sku.ts` — `getSkuPrefix`/`formatSku`, con tests
- `lib/domain/commission.ts` — `calculateCommission`, con tests
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

## Roadmap: pivote a gestión integral de la empresa

**Objetivo:** el sistema deja de ser solo inventario + venta directa por
WhatsApp y pasa a cubrir toda la operación: compras con cuentas por pagar,
inventario con historial completo de movimientos, consignación a vendedores
externos, ventas de esos vendedores, liquidaciones diarias con comisión, caja
y reportes. Requisitos y reglas de negocio completos en `requisitos.txt` y
`reglas.txt` (raíz del repo). El plan de diseño completo (modelo de datos,
capa de dominio, roadmap de 10 fases) vive en el historial de esta sesión;
resumen y decisiones clave abajo.

**Decisiones clave del pivote:**

- Vendedores en consignación (`sellers`) son un modelo **nuevo y paralelo** a
  `distributors` (proveedores de compra) y al catálogo público con venta
  directa por WhatsApp (`salesOrders`) — ninguno reemplaza al otro.
- Ledger unificado: tabla `inventory_movements` registra TODO cambio de stock
  (compras, ventas directas, entregas a vendedores, ventas de vendedor,
  devoluciones, ajustes, pérdidas/daños/robos), distinguido por `ownerType`
  (`principal`|`seller`). El inventario por vendedor y el saldo de caja se
  derivan por agregación sobre esta tabla, no con contadores redundantes.
- SKU autogenerado: `{PREFIJO_CATEGORÍA}-{secuencial 5 dígitos}` (ej.
  `TECN-00001`) vía secuencia de Postgres `product_sku_seq` (evita
  condiciones de carrera; `lib/domain/sku.ts#formatSku`/`getSkuPrefix` +
  `lib/db/queries/inventory.ts#generateProductSku`).
- Liquidación de vendedor: `amountDue = totalSales - totalCommission + totalLosses`,
  se cierra el mismo día, sin arrastrar saldo entre liquidaciones.
- Caja registra ingreso automático también en ventas directas por WhatsApp,
  no solo en liquidaciones de vendedores.
- Garantía: `warrantyMonths` (integer, meses), no texto libre.
- Variantes de producto (RN-007) quedan diferidas a la última fase del
  roadmap; mientras tanto `variantId` ya existe (nullable) en
  `inventory_movements` para no tener que migrar después.

**Fases del roadmap** (cada una: contrato → test de dominio → implementación
mínima → `npm run test` + `npm run lint` + `npm run build` en verde):

| # | Fase | Estado |
|---|------|--------|
| 1 | Ledger de movimientos + campos base de producto (sku, purchasePrice, minStock, warrantyMonths, hasVariants) | ✅ listo |
| 2 | Vendedores (`sellers`) + Caja (`cash_movements`) + Ventas en local (`direct_sales`) | ✅ listo |
| 3 | Entregas a vendedores (`seller_deliveries`) | ✅ listo |
| 4 | Inventario por vendedor (lectura, agregación sobre el ledger) | ⬜ pendiente |
| 5 | Ventas de vendedor (`seller_sales`, distinto de `salesOrders`) | ⬜ pendiente |
| 6 | Devoluciones y pérdidas/daños/robos de vendedor | ⬜ pendiente |
| 7 | Liquidaciones (`settlements`) | ⬜ pendiente |
| 8 | Compras a crédito / cuentas por pagar (`purchase_payments`) | ⬜ pendiente |
| 9 | Reportes consolidados | ⬜ pendiente |
| 10 | Variantes de producto (`product_variants`) | ⬜ pendiente |

**Fase 1 — completada:**

- Schema: `products` gana `sku` (unique, not null), `purchasePrice`,
  `minStock`, `warrantyMonths`, `hasVariants`; nueva tabla
  `inventory_movements` (con `variantId`/`sellerId` nullable, listos para
  fases futuras, y CHECK `quantity_delta <> 0`); secuencia `product_sku_seq`.
- Dominio: `lib/domain/inventory-movement.ts` (`applyMovement`,
  `validateAdjustmentReason`) y `lib/domain/sku.ts` (`getSkuPrefix`,
  `formatSku`), ambos con tests.
- Queries: `lib/db/queries/inventory.ts` — `recordPrincipalMovement` (helper
  transaccional reutilizado por compras/ventas/ajustes), `createAdjustment`,
  `getMovementsForProduct`, `getRecentMovements`, `getLowStock`,
  `getOutOfStock`, `generateProductSku`.
- Retrofit: `markPurchaseOrderReceived` y `confirmSalesOrder` ahora escriben
  en el ledger vía `recordPrincipalMovement` en vez del `sql` inline anterior
  (corrige que `receiveStock()` nunca se llamaba realmente en producción).
- `confirmSalesOrder` envuelto en try/catch: si el segundo loop de escritura
  falla a mitad de camino, se lanza una excepción para forzar el rollback de
  la transacción (antes del retrofit esto no podía pasar porque el loop de
  escritura no validaba nada).
- API: `POST /api/admin/inventory/adjustments`.
- UI: `/admin/inventory` (alertas de stock mínimo/agotado, ajuste manual,
  historial de movimientos recientes), SKU visible en `/admin/products`,
  formulario de producto extendido con precio de compra/stock mínimo/garantía.
- Verificado con `npm run test` + `npm run lint` + `npm run build` en verde,
  más flujo manual en navegador (crear producto → SKU autogenerado → ajustes
  +/- → stock y ledger consistentes).

**Fase 2 — completada:**

Aprobada e implementada tal como se detalló abajo (2.1, 2.2, 2.3), en ese
orden. Verificado con `npm run test` (45/45) + `npm run lint` + `npm run
build` en verde, más flujo manual en navegador: vendedor creado con comisión
10% (convertida a basis points correctamente), movimiento manual de caja,
venta en local que descuenta stock + genera ingreso en caja, y confirmación
de pedido por WhatsApp que ahora también genera ingreso automático en caja
(retrofit de `confirmSalesOrder`) — saldo de caja verificado consistente
end-to-end en las tres fuentes.

Detalle de las tres piezas (relacionadas pero independientes entre sí, salvo
la tercera que depende de la segunda):

*2.1 — Vendedores (`sellers`)*

- Tabla `sellers`: `name`, `phone`, `city`, `commissionType`
  (`'percentage'|'fixed_per_unit'`), `commissionValue` (percentage en basis
  points 0–10000; fixed en pesos/unidad), `active` (soft delete), `notes`.
- Dominio: `lib/domain/commission.ts#calculateCommission(config, saleTotal, quantity)`, con tests.
- CRUD estándar (`lib/db/queries/sellers.ts`, API, UI en `/admin/sellers`)
  siguiendo el mismo patrón que `distributors`.
- No se usa todavía en esta fase (las fases 3-7 lo consumen) — solo
  establece el catálogo de vendedores y su config de comisión.

*2.2 — Caja (`cash_movements`)*

- Tabla `cash_movements`: `type` (`'ingreso'|'gasto'`), `amount` (CHECK>0),
  `concept` (NOT NULL, incluso en ingresos, para trazabilidad — RN-032),
  `movementDate`, `sourceType`/`sourceId` (`'settlement'|'manual'|'sales_order'|'direct_sale'`), `notes`.
- Saldo = `SUM(ingreso) - SUM(gasto)`, calculado siempre en consulta
  (`getCashBalance()`), nunca guardado — mismo criterio que el stock por
  vendedor: evitar un segundo lugar donde vive la verdad.
- CRUD de movimientos manuales (`POST /api/admin/cash-movements` para
  ingresos/gastos sueltos) + UI `/admin/cash` (lista + saldo + form rápido).
- **Retrofit de `confirmSalesOrder`** (WhatsApp): al confirmar, además de
  descontar stock (ya lo hace desde la Fase 1), inserta un `cash_movements`
  ingreso en la misma transacción (`sourceType: 'sales_order'`, monto =
  `order.totalPrice`, se omite si es null/0) — decisión ya tomada al
  planear el pivote, implementada en esta fase.

*2.3 — Ventas en local (`direct_sales`)* — nuevo canal, decidido en esta
sesión tras detectar que ni `salesOrders` (async, cliente obligatorio,
pensado para coordinar entrega por WhatsApp) ni `sellers`/consignación
(trae comisión y liquidación, no aplica cuando el dueño vende su propio
inventario) cubren bien una venta de mostrador instantánea.

- Tablas:
  ```
  direct_sales
    id           serial PK
    saleDate     timestamp NOT NULL default now()
    totalAmount  integer NOT NULL
    notes        text NULL
    createdAt    timestamp NOT NULL default now()

  direct_sale_items
    id          serial PK
    saleId      integer NOT NULL FK -> direct_sales.id (cascade)
    productId   integer NOT NULL FK -> products.id
    variantId   integer NULL   -- listo para la fase 10, igual que en inventory_movements
    quantity    integer NOT NULL   -- CHECK > 0, RN-045
    unitPrice   integer NOT NULL   -- CHECK >= 0, RN-045
    subtotal    integer NOT NULL   -- quantity*unitPrice, historia inmutable
  ```
  Sin columna `status`: a diferencia de `purchaseOrders`/`salesOrders`, una
  venta en local nace ya cerrada (no hay "pendiente" ni "entrega" que
  coordinar), así que no necesita máquina de estados.
- Validación (`lib/validations.ts`): `directSaleItemSchema` (quantity
  min 1, unitPrice min 0), `directSaleSchema` (items: array no vacío, notes
  opcional). Sin `customerName`/`customerPhone` — venta anónima de mostrador.
- Query `createDirectSale` (`lib/db/queries/direct-sales.ts`): a diferencia
  del patrón "crear cabecera → POST items uno a uno → confirmar" que usan
  `purchaseOrders`/`salesOrders` (justificado ahí por el tiempo real que
  pasa entre esos pasos), aquí es **una sola operación transaccional**:
  recibe el array completo de items en un solo POST (como un ticket de
  caja), inserta la cabecera, valida y descuenta stock de cada item vía
  `recordPrincipalMovement` (reutilizado tal cual de la Fase 1, `type:
  'venta'`, `sourceType: 'direct_sale'`), inserta los items con su
  `subtotal`, actualiza `totalAmount`, e inserta el `cash_movements`
  ingreso correspondiente — todo o nada. Si algún item no tiene stock
  suficiente, aborta sin escribir nada (mismo patrón fail-fast que ya
  corregimos en `confirmSalesOrder`).
- API: `POST /api/admin/direct-sales` (único endpoint de escritura; la
  lectura para listar es un Server Component que llama a
  `getAllDirectSales()`/`getDirectSaleById()` directo, sin API route, igual
  que `/admin/inventory`).
- UI: `/admin/direct-sales` — formulario tipo POS (filas repetibles de
  producto/cantidad/precio con el precio de venta del producto como default
  editable, total corriendo, un botón "Cobrar" que envía todo de una vez) +
  listado de ventas pasadas para referencia/reportería. Nav: "Ventas en
  local".
- Reportería futura (Fase 9): un reporte de "ventas totales" se arma
  uniendo `salesOrders` + `direct_sales` + `seller_sales` por consulta, sin
  que compartan tabla.
- `direct_sales` es, en esencia, la pieza mínima de un POS (registro
  instantáneo + descuento de stock), no un POS completo. Diferido
  explícitamente para más adelante (fuera del alcance de la Fase 2):
  - `paymentMethod` (efectivo/tarjeta/mixto) en `direct_sales` — no está en
    "consideraciones futuras" de `reglas.txt`, pero se identificó en esta
    sesión: hace falta para poder distinguir efectivo físico de pagos por
    datáfono cuando se implemente apertura/cierre de caja. Barato agregar
    ahora, caro agregar después con ventas ya registradas sin ese dato — se
    decidió conscientemente NO incluirlo en la Fase 2, queda pendiente para
    cuando se aborde apertura/cierre de caja.
  - Apertura y cierre de caja (turnos, base inicial, arqueo) — ya listado en
    `reglas.txt` §12.
  - Impresión de comprobantes / facturación electrónica — ya listado en
    `reglas.txt` §12.
  - Integración con lectores de código de barras — ya listado en
    `reglas.txt` §12.
  - Descuentos y cambios/devoluciones en el mostrador — no está en
    `reglas.txt`, identificado en esta sesión.
  - Multi-cajero (varios usuarios operando la caja simultáneamente) — no
    aplica mientras RN-001 siga vigente (un solo usuario del sistema).

**Fase 3 — completada:**

- Schema: `seller_deliveries` (`sellerId`, `deliveryDate`, `notes`) +
  `seller_delivery_items` (`productId`, `variantId` nullable, `quantity`
  CHECK>0, `unitCost`). Sin columna `status` — decisión ya tomada de que la
  entrega es una operación atómica (el propietario es el único que opera,
  no hay "confirmación de recepción" del vendedor en este alcance).
- Query `createSellerDelivery` (`lib/db/queries/seller-deliveries.ts`):
  transacción única que por cada item (a) descuenta el inventario principal
  vía `recordPrincipalMovement` (reutilizado tal cual, valida RN-042 —
  rechaza si no hay stock suficiente y hace `throw` para rollback) y (b)
  inserta directamente una fila `inventory_movements` con `ownerType:
  'seller'`, `sellerId`, `quantityDelta` positivo — sin validación porque
  una entrega siempre *aumenta* el saldo del vendedor (nunca puede quedar
  negativo). La validación de saldo de vendedor (necesaria cuando el delta
  es negativo: ventas/devoluciones/pérdidas) se añade recién en la Fase 5,
  cuando exista `getSellerBalance` (Fase 4) — no se construyó antes de
  tiempo.
- API: `POST /api/admin/deliveries` (único endpoint; listar es Server
  Component directo, mismo patrón que `/admin/inventory` y `/admin/direct-sales`).
- UI: `/admin/deliveries` — formulario con selector de vendedor + filas de
  producto/cantidad/costo unitario (autocompletado con `purchasePrice` del
  producto, editable) + listado de entregas pasadas.
- `getAllProducts` ahora también selecciona `purchasePrice` (lo necesitaba
  el formulario de entregas para el autocompletado).
- Verificado con `npm run test` (45/45) + `npm run lint` + `npm run build`
  en verde, más flujo manual en navegador: entrega de 3 unidades a un
  vendedor de prueba → stock principal 7→4, y confirmado directamente en la
  BD que el ledger generó las dos filas esperadas
  (`principal -3` sin `sellerId`, `seller +3` con `sellerId`).

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
  usuario, en español.
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
  `lib/domain/stock.ts`, `lib/domain/inventory-movement.ts`,
  `lib/domain/sku.ts`, `lib/validations.ts#toSlug`.
- Fase 1 del pivote a gestión integral: ledger de movimientos de inventario
  (`inventory_movements`), SKU autogenerado, campos de producto extendidos
  (precio de compra, stock mínimo, garantía), alertas de stock en
  `/admin/inventory`.
- Fase 2 del pivote: vendedores en consignación (`sellers`, con
  `lib/domain/commission.ts`), caja (`cash_movements`, saldo calculado en
  consulta, retrofit de `confirmSalesOrder` para generar ingreso automático),
  y ventas en local (`direct_sales`/`direct_sale_items`, endpoint
  transaccional único tipo POS).
- Fase 3 del pivote: entregas a vendedores (`seller_deliveries`/
  `seller_delivery_items`), transacción única que descuenta principal y
  acredita al vendedor en el mismo ledger. Ver "Roadmap: pivote a gestión
  integral de la empresa" arriba para el detalle y las fases 4-10 pendientes.

**Próximo:**

- Fase 4 del pivote: inventario por vendedor (lectura, agregación sobre el
  ledger — `getSellerBalance`/`getSellerInventory`).
- Poblar la BD con productos reales (tarea del roadmap original, aún pendiente).

**Decisiones tomadas:**

- Sin pagos a clientes, sin cuentas de clientes. Pedidos directos vía WhatsApp.
- Imágenes subidas a `public/uploads/products/`, convertidas a WebP con sharp (máx. 10 MB).
- Migraciones: `DATABASE_URL=... npx drizzle-kit generate` + `migrate`
  (el shell no carga `.env.local` automáticamente).
- El stock de ventas directas se descuenta al pasar a `confirmado` (no a
  `entregado`), para evitar sobreventa lo antes posible en el flujo.
- Ver también las decisiones del pivote en "Roadmap: pivote a gestión
  integral de la empresa" (modelo de vendedores paralelo, ledger unificado,
  fórmula de liquidación, formato de SKU, etc.).

**Riesgos abiertos:**

- La suite de tests solo cubre `lib/domain/*` y `lib/validations.ts` (lógica
  pura). Las API routes, las queries de Drizzle y los componentes se verifican
  manualmente (`npm run dev` + flujo real, `npm run lint`, `npm run build`).
- Variantes de producto (RN-007) siguen sin definirse del todo (qué atributos
  varían, si tienen SKU/precio propio) — se resuelve al llegar a la fase 10.

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
