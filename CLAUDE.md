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

- `lib/db/schema.ts` — tablas: `categories`, `products`, `product_images`, `distributors`, `purchase_orders`, `purchase_order_items`, `sales_orders`, `sales_order_items`, `inventory_movements`, `sellers`, `cash_movements`, `direct_sales`, `direct_sale_items`, `seller_deliveries`, `seller_delivery_items`, `seller_sales`, `seller_sale_items`, `seller_returns`, `seller_return_items`, `seller_losses`, `seller_loss_items`, `settlements`, `purchase_payments`; secuencia `product_sku_seq`
- `lib/db/queries/categories.ts` / `products.ts` / `distributors.ts` / `purchase-orders.ts` / `sales-orders.ts` / `inventory.ts` / `sellers.ts` / `cash.ts` / `direct-sales.ts` / `seller-deliveries.ts` / `seller-inventory.ts` / `seller-sales.ts` / `seller-returns.ts` / `seller-losses.ts` / `settlements.ts` / `purchase-payments.ts` / `reports.ts` — queries Drizzle
- `lib/domain/order-status.ts` — máquina de estados pura (transiciones válidas de compras/ventas), con tests
- `lib/domain/stock.ts` — aritmética de stock pura (`receiveStock`, `deductStock`), con tests
- `lib/domain/inventory-movement.ts` — `applyMovement`/`validateAdjustmentReason`, con tests
- `lib/domain/sku.ts` — `getSkuPrefix`/`formatSku`, con tests
- `lib/domain/commission.ts` — `calculateCommission`, con tests
- `lib/domain/settlement.ts` — `calculateSettlement`, con tests
- `lib/domain/settlement-status.ts` — `canTransitionSettlement`, con tests
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
- Variantes de producto (RN-007): descartadas. El negocio no maneja
  variantes de producto (decisión explícita del usuario). La Fase 10
  original ("conectar variantId en toda la UI de items") se eliminó del
  roadmap; las columnas `variantId`/`hasVariants` que se habían reservado
  "por si acaso" en la Fase 1 se quitaron del schema — ver "Fase 10 —
  descartada" más abajo.

**Fases del roadmap** (cada una: contrato → test de dominio → implementación
mínima → `npm run test` + `npm run lint` + `npm run build` en verde):

| # | Fase | Estado |
|---|------|--------|
| 1 | Ledger de movimientos + campos base de producto (sku, purchasePrice, minStock, warrantyMonths) | ✅ listo |
| 2 | Vendedores (`sellers`) + Caja (`cash_movements`) + Ventas en local (`direct_sales`) | ✅ listo |
| 3 | Entregas a vendedores (`seller_deliveries`) | ✅ listo |
| 4 | Inventario por vendedor (lectura, agregación sobre el ledger) | ✅ listo |
| 5 | Ventas de vendedor (`seller_sales`, distinto de `salesOrders`) | ✅ listo |
| 6 | Devoluciones y pérdidas/daños/robos de vendedor | ✅ listo |
| 7 | Liquidaciones (`settlements`) | ✅ listo |
| 8 | Compras a crédito / cuentas por pagar (`purchase_payments`) | ✅ listo |
| 9 | Reportes consolidados | ✅ listo |
| 10 | Variantes de producto (`product_variants`) | ❌ descartada |

**Fase 1 — completada:**

- Schema: `products` gana `sku` (unique, not null), `purchasePrice`,
  `minStock`, `warrantyMonths`, y (más tarde eliminado, ver "Fase 10 —
  descartada") `hasVariants`; nueva tabla `inventory_movements` (con
  `sellerId` nullable y, hasta la Fase 10, un `variantId` también nullable
  reservado "por si acaso" — quitado en esa fase; CHECK `quantity_delta <>
  0`); secuencia `product_sku_seq`.
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
  `seller_delivery_items` (`productId`, `quantity` CHECK>0, `unitCost`).
  Sin columna `status` — decisión ya tomada de que la
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

**Fase 4 — completada:**

- Queries: `lib/db/queries/seller-inventory.ts` — `getSellerBalance(sellerId,
  productId)` y `getSellerInventory(sellerId)`, ambas agregando
  (`SUM(quantityDelta)`) sobre `inventory_movements` filtrado por
  `ownerType='seller'`; `getSellerInventory` además hace `GROUP BY` +
  `HAVING SUM(...) > 0` para mostrar solo lo que el vendedor tiene
  actualmente (no lo que alguna vez tuvo). Archivo nuevo separado de
  `inventory.ts` (que es del lado principal) y de `sellers.ts` (que es el
  CRUD del catálogo), siguiendo el criterio de un archivo por dominio de
  query.
- Sin tests: son queries de agregación sobre Drizzle, no lógica de dominio
  pura — mismo criterio que `getLowStock`/`getOutOfStock` en la Fase 1.
- UI: nueva página de detalle `/admin/sellers/[id]` (info del vendedor +
  tabla de inventario actual), separada de `/admin/sellers/[id]/edit`. El
  listado de vendedores ahora enlaza el nombre a esta página de detalle.
- Verificado con `npm run test` (45/45) + `npm run lint` + `npm run build`
  en verde, más flujo manual en navegador: el detalle del vendedor de
  prueba muestra correctamente "Audífonos in ear con Bluetooth 1Hora — 3",
  coincidiendo con la entrega registrada en la Fase 3.

**Fase 5 — completada:**

- Schema: `seller_sales` (`sellerId`, `saleDate`, `totalAmount`,
  `commissionAmount`, `settlementId` nullable sin FK todavía — se conecta a
  `settlements` en la Fase 7) + `seller_sale_items` (`productId`,
  `quantity`/`unitPrice` con CHECK, `subtotal` inmutable).
- `getSellerBalance` (Fase 4) se refactorizó para aceptar `db | tx` como
  primer parámetro — necesario para poder leer el saldo del vendedor
  *dentro* de la misma transacción que escribe la venta (si se usara `db`
  a secas se leería fuera de la transacción, con riesgo de inconsistencia).
  `getSellerInventory` también ahora selecciona `products.price` para
  poder precargar el precio de venta en el formulario.
- Query `createSellerSale` (`lib/db/queries/seller-sales.ts`): primero
  valida TODOS los items contra `getSellerBalance` + `deductStock`
  (RN-020/041, sin escribir nada — mismo patrón fail-fast que
  `confirmSalesOrder`), luego inserta la cabecera, un movimiento
  `ownerType: 'seller'` por item (nunca toca el inventario principal —
  RN-025), calcula `commissionAmount` con `lib/domain/commission.ts#calculateCommission`
  usando el `commissionType`/`commissionValue` del vendedor, y actualiza la
  cabecera con los totales.
- API: `POST /api/admin/seller-sales` (único endpoint).
- UI: `/admin/seller-sales/new` — primero selecciona vendedor (query param
  `?sellerId=`), luego un formulario tipo POS cuyo desplegable de productos
  está limitado al inventario actual de ese vendedor (muestra "disp. N"),
  con precio precargado desde `products.price`.
- Verificado con `npm run test` (45/45) + `npm run lint` + `npm run build`
  en verde, más flujo manual en navegador: intento de vender 5 unidades
  cuando el vendedor solo tenía 3 fue rechazado por el servidor con
  "Stock insuficiente: hay 3, se requieren 5" (confirmado quitando el
  `max` del input vía JS para que el intento realmente llegara al
  servidor, no solo la validación HTML5 del navegador) y no se escribió
  nada en `seller_sales`; venta válida de 1 unidad → inventario del
  vendedor 3→2, stock principal sin tocar (verificado en `/admin/products`),
  comisión calculada en $5.000 (10% de $50.000, correcto), y confirmado en
  la BD que el ledger generó una sola fila (`seller -1`, sin fila
  `principal`).

**Fase 6 — completada:**

- Schema: `seller_returns`/`seller_return_items` (`quantity` CHECK>0, sin
  precio — una devolución no es una transacción monetaria) y
  `seller_losses`/`seller_loss_items` (`type`: `perdida`|`dano`|`robo`,
  `unitCost` NOT NULL — snapshot para poder cobrarlo en la liquidación de
  la Fase 7).
- `getSellerInventory` ahora también selecciona `products.purchasePrice`
  (como `productPurchasePrice`) para precargar el costo unitario en el
  formulario de pérdidas — a diferencia de ventas/devoluciones, una pérdida
  se valora al costo de compra, no al precio de venta.
- Query `createSellerReturn` (`lib/db/queries/seller-returns.ts`): mismo
  patrón fail-fast que ventas (valida `getSellerBalance`+`deductStock`
  contra RN-043 antes de escribir), luego por cada item escribe DOS
  movimientos en la misma transacción — `seller -qty` y `principal +qty`
  (este último vía `recordPrincipalMovement`, reutilizado tal cual) —
  cumpliendo RN-021 (toda devolución regresa al inventario principal).
- Query `createSellerLoss` (`lib/db/queries/seller-losses.ts`): mismo
  patrón fail-fast, pero escribe un solo movimiento `seller -qty` con el
  `type` que corresponda (`perdida`/`dano`/`robo`) y su `unitCost` — nunca
  toca el inventario principal, porque el costo lo asume el vendedor
  (RN-022). Se aplicó la misma validación de saldo que en devoluciones (no
  se puede reportar perder/dañar/robar más de lo que el vendedor tiene
  asignado) por analogía razonable con RN-043, ya que las reglas no lo
  dicen explícitamente para este caso — señalado como tal en el diseño
  original.
- Refactor: `SellerPicker` se movió de `app/admin/seller-sales/_components/`
  a `app/admin/_components/` (compartido) con un prop `basePath`, ahora que
  tres flujos distintos (ventas, devoluciones, pérdidas) lo necesitan con
  el mismo patrón "elegir vendedor → formulario limitado a su inventario".
- APIs: `POST /api/admin/seller-returns` y `POST /api/admin/seller-losses`.
- UI: `/admin/seller-returns` y `/admin/seller-losses`, mismo patrón de dos
  pasos (elegir vendedor vía `?sellerId=` → formulario).
- Verificado con `npm run test` (45/45) + `npm run lint` + `npm run build`
  en verde, más flujo manual en navegador: devolución de 1 unidad → stock
  principal 4→5, inventario del vendedor 2→1 (RN-021 confirmado); daño de
  la última unidad → inventario del vendedor 1→0 (desaparece de la lista),
  stock principal **sin cambios** en 5 (RN-022 confirmado); y verificado en
  la BD que el ledger generó exactamente las filas esperadas por cada
  operación (`seller -1` + `principal +1` para la devolución; solo
  `seller -1` con `unit_cost=30000` para el daño).

**Fase 7 — completada:**

- Schema: tabla `settlements` (`sellerId`, `periodDate` con
  `UNIQUE(sellerId, periodDate)`, `totalSales`, `totalCommission`,
  `totalLosses`, `amountDue`, `status` `pendiente`|`liquidada`, `settledAt`);
  se agrega la FK `sellerSales.settlementId → settlements.id` que existía
  como columna nullable sin FK desde la Fase 5.
- Dominio: `lib/domain/settlement.ts#calculateSettlement` (`amountDue =
  totalSales - totalCommission + totalLosses`) y
  `lib/domain/settlement-status.ts#canTransitionSettlement` (lookup-table
  `pendiente → liquidada`, mismo patrón que `order-status.ts`), ambos con
  tests.
- Query `lib/db/queries/settlements.ts`: `previewSettlement(sellerId,
  periodDate)` (solo lectura, agrega `seller_sales` + `seller_loss_items`
  filtrando por fecha exacta); `createSettlement` (transaccional: revisa
  duplicado por `(sellerId, periodDate)` antes de insertar — da un mensaje
  de error claro en vez de dejar que el usuario vea la violación cruda del
  `UNIQUE` de Postgres —, calcula totales, inserta la cabecera, y estampa
  `settlementId` en las filas de `seller_sales` de ese vendedor+día que aún
  no lo tenían); `markSettlementLiquidada` (transaccional: valida la
  transición con `canTransitionSettlement`, y si `amountDue > 0` inserta un
  `cash_movements` ingreso vía `recordCashMovement` reutilizado tal cual).
- Doble guardia contra doble conteo de una venta entre liquidaciones: el
  `UNIQUE(sellerId, periodDate)` hace estructuralmente imposible crear dos
  liquidaciones para el mismo vendedor el mismo día, y `previewSettlement`/
  `createSettlement` además filtran `seller_sales.settlementId IS NULL` (no
  solo por fecha) — así una venta jamás se agrega dos veces aunque hubiera
  edge cases de fecha. Las pérdidas (`seller_loss_items`) no llevan
  `settlementId`: como ya es imposible crear una segunda liquidación para
  ese vendedor+día, una pérdida de ese día solo puede caer en la única
  liquidación posible para esa fecha — se decidió no añadir la columna por
  redundante. Simplificación no revisada aún con el usuario: si `amountDue`
  llega a ser negativo (comisión supera las ventas cobradas), no se inserta
  ningún movimiento de caja — caso sin resolver, no documentado como
  limitación hasta ahora.
- API: `POST /api/admin/settlements` (crear) y
  `POST /api/admin/settlements/{id}/liquidate` (único camino a `liquidada`,
  mismo patrón que `purchase-orders/{id}/receive`).
- UI: `/admin/settlements/new` — selector de vendedor (`SellerPicker`
  compartido) → selector de fecha (`<input type="date">`, default hoy) con
  preview en vivo (ventas/comisión/pérdidas/a entregar) vía
  `previewSettlement`, botón "Crear liquidación"; `/admin/settlements` —
  listado con estado y botón "Liquidar" (solo visible si `pendiente`). Nav:
  "Liquidaciones".
- Verificado con `npm run test` (51/51) + `npm run lint` + `npm run build`
  en verde, más flujo manual en navegador: entrega de 4 unidades al
  vendedor de prueba, venta de 2 ($100.000, comisión $10.000) y pérdida de 1
  ($30.000) adicionales a datos ya existentes del día → preview mostró
  correctamente ventas $150.000, comisión $15.000, pérdidas $60.000, a
  entregar $195.000; "Crear liquidación" → aparece "Pendiente" en el
  listado; "Liquidar" → estado pasa a "Liquidada" y el botón desaparece;
  saldo de caja pasó de $100.000 a $295.000 con un ingreso "Liquidación
  vendedor #1 — 2026-07-18" por $195.000; una venta nueva registrada
  después de liquidar mostró correctamente solo su propio total en un
  preview posterior (confirma que las ventas ya liquidadas quedaron
  estampadas con `settlementId` y no se recuentan); intento de crear una
  segunda liquidación para el mismo vendedor+fecha fue rechazado tanto por
  `fetch` directo a la API como por la UI real con "Ya existe una
  liquidación para este vendedor en esta fecha".

**Fase 8 — completada:**

- Schema: `purchase_orders` gana `purchaseType` (`'contado'|'credito'`,
  default `'contado'`); nueva tabla `purchase_payments` (`purchaseOrderId`
  FK cascade, `amount` CHECK>0, `paidAt`, `method` nullable, `notes`
  nullable). La "cuenta por pagar" sigue el mismo criterio que el saldo de
  caja y el inventario de vendedor: es un valor **derivado**
  (`totalCost - SUM(purchase_payments.amount)`), no una columna guardada —
  no hay tabla ni campo "deuda pendiente" separado.
- Dominio: **sin módulo nuevo** — se reutiliza `lib/domain/stock.ts#deductStock`
  tal cual para validar que un pago no exceda el saldo pendiente
  (`deductStock(pending, amount)`; el "stock" aquí es dinero, no unidades),
  siguiendo el mismo criterio ya usado para saldo de vendedor en las Fases
  5/6. A diferencia de esos casos, el mensaje de error NO se reenvía tal
  cual (`result.reason` dice "Stock insuficiente...", incorrecto para un
  contexto de dinero): el query arma su propio mensaje ("Saldo
  insuficiente: hay X pendiente, se intentó pagar Y") a partir de los
  campos numéricos del resultado.
- Query `lib/db/queries/purchase-payments.ts`: `getPurchaseOrderBalance`
  (agrega pagos, devuelve `totalCost`/`totalPaid`/`pending`),
  `getPaymentsForOrder`, `createPurchasePayment` (transaccional: rechaza si
  el pedido no es a crédito, si está `cancelado`, o si el monto excede el
  saldo — mismo patrón fail-fast que el resto del sistema),
  `getAccountsPayableSummary` (agregación en dos consultas —costo total de
  compras a crédito no canceladas y pagos recibidos, ambas agrupadas por
  `distributorId`— combinadas en JS; se evitó un solo JOIN+GROUP BY porque
  unir `purchase_payments` con `purchase_orders` antes de agrupar por
  distribuidor infla el `totalCost` una vez por cada pago).
- **Bug encontrado y corregido durante la verificación manual**: el PUT
  genérico de pedidos (`purchaseOrderSchema.partial()`) usaba
  `.optional().default(...)` en `status` y `purchaseType`. En Zod, `.default()`
  rellena el valor por defecto incluso bajo `.partial()` cuando la clave no
  viene en el body — así que un PUT parcial como `{status: "cancelado"}`
  (lo único que envía `StatusActions`) sobreescribía silenciosamente
  `purchaseType` a `'contado'` en cada cambio de estado, aunque el pedido
  fuera a crédito. Confirmado en vivo: un pedido creado como `credito` quedó
  como `contado` tras cancelarlo vía la UI real. Corregido quitando
  `.default(...)` de ambos campos en el schema — el valor por defecto en
  creación lo sigue poniendo la capa de queries (`data.status ?? "pendiente"`,
  `data.purchaseType ?? "contado"` en `createPurchaseOrder`), que es donde
  ya vivía antes de este fix. El mismo defecto ya existía para `status`
  desde antes de esta fase (latente, nunca disparado porque `StatusActions`
  siempre envía `status` explícito); quedó corregido igual como efecto
  colateral.
- API: `POST /api/admin/purchase-orders/{id}/payments` (único endpoint de
  escritura; lectura de pagos y saldo se hace directo desde el Server
  Component de detalle, mismo patrón que `/admin/inventory`).
- UI: selector "Tipo de compra" (Contado/Crédito) en el formulario de
  creación; columna "Tipo" en el listado; en el detalle del pedido,
  sección "Cuenta por pagar" (solo si `purchaseType==='credito'`): costo
  total/pagado/saldo pendiente, historial de pagos, y formulario para
  registrar un nuevo pago (oculto si el saldo ya es 0 o el pedido está
  cancelado). Columna "Saldo pendiente" agregada al listado de
  `/admin/distributors` (RF-04, "consultar saldos pendientes con
  proveedores"), usando `getAccountsPayableSummary`.
- Verificado con `npm run test` (51/51) + `npm run lint` + `npm run build`
  en verde, más flujo manual en navegador: pedido a crédito por $50.000 →
  pago parcial de $20.000 → saldo $30.000; intento de pagar $50.000 sobre
  ese saldo rechazado con "Saldo insuficiente: hay 3000000 pendiente, se
  intentó pagar 5000000"; pago del resto ($30.000) → saldo $0 y el
  formulario de pago desaparece; segundo pedido a crédito sin pagos por
  $80.000 → columna "Saldo pendiente" del distribuidor mostró correctamente
  $80.000 (excluyendo el primer pedido ya saldado); intento de pagar un
  pedido `contado` rechazado con "Este pedido no es a crédito"; y el bug de
  `purchaseType` descrito arriba, encontrado y corregido en el mismo flujo
  de verificación.

**Fase 9 — completada:**

- Cubre los 12 reportes de RF-16 en una sola página `/admin/reports`, sin
  tabla nueva — todo se deriva por agregación sobre lo que ya existía
  (mismo criterio "derivar, no duplicar" de todas las fases anteriores).
- **Decisión de negocio pedida al usuario**: la fórmula de "Utilidad" no
  estaba definida en `reglas.txt`/`requisitos.txt`. Se presentaron tres
  opciones (bruta / tras comisiones / neta con gastos de caja); el usuario
  delegó la elección. Se recomendó y quedó implementada la **utilidad
  bruta**: `ventas − (cantidad × products.purchasePrice)` sumado sobre las
  tres fuentes de venta (WhatsApp, local, vendedores) — no resta comisiones
  de vendedor ni gastos de caja sueltos, porque esos ya se ven aparte en
  Caja/Liquidaciones y mezclarlos complicaría comparar el número entre
  periodos. **Limitación conocida, no resuelta**: el costo usado es el
  `purchasePrice` *actual* del producto, no un snapshot histórico del costo
  al momento de cada venta (ese snapshot no existe en `sales_order_items`/
  `direct_sale_items`/`seller_sale_items` — solo `purchase_order_items`
  guarda `unitCost`). Si el costo de compra de un producto cambia, la
  utilidad de ventas pasadas se recalcula con el costo nuevo, no el
  vigente en su momento.
- **Distinción "estado" vs "flujo"**: un filtro de fecha (`?from=&to=`)
  afecta solo a los reportes de flujo — Compras, Ventas, Utilidad, Caja
  (ingresos/gastos del periodo) — porque tiene sentido acotarlos a un
  rango. Los reportes de estado — Inventario actual, Stock mínimo,
  Agotados, Inventario/pendientes por vendedor, Cuentas por pagar, saldo
  de Caja — siempre muestran el momento actual sin importar el filtro,
  siguiendo RN-035 ("el reporte de inventario mostrará únicamente las
  existencias disponibles en el momento de la consulta"). Ventas por
  vendedor y Productos devueltos quedaron como histórico completo (sin
  filtro de fecha) por simplicidad — no se conectó `seller_sales`/
  `seller_returns` al rango para no multiplicar la complejidad de la
  primera versión; queda como mejora futura si se necesita.
- Query nueva `lib/db/queries/reports.ts`: `getInventorySummary`
  (productos activos/unidades/valor a costo), `getPurchasesReport`
  (excluye pedidos `cancelado`, agrupado por proveedor — cubre RN-038),
  `getSalesReport` (une `salesOrders` en estado `confirmado`/`entregado`
  + `direct_sales` + `seller_sales`, cada uno con su propio filtro de
  fecha), `getProfitReport` (reutiliza `getSalesReport` + tres queries de
  costo con `innerJoin` a `products`, una por canal de venta — se evitó
  un solo query con múltiples joins porque unir varias tablas de items
  antes de agregar infla los totales).
- Extensiones a archivos existentes (mismo criterio "un archivo por
  dominio de query" de siempre): `getAllSellersInventory` en
  `seller-inventory.ts` (como `getSellerInventory` pero para todos los
  vendedores en una sola consulta agrupada, en vez de N+1), `getSellerSalesSummary`
  en `seller-sales.ts`, `getReturnedProductsSummary` en
  `seller-returns.ts`. Cuentas por pagar reutiliza `getAccountsPayableSummary`
  tal cual (Fase 8); Stock mínimo/Agotados reutilizan `getLowStock`/
  `getOutOfStock` tal cual (Fase 1); Caja reutiliza `getCashBalance`/
  `getAllCashMovements` tal cual (Fase 2), filtrando el rango de fecha en
  JS sobre la lista ya traída (volumen bajo, no amerita una query nueva).
- **Inconsistencia de unidades heredada, no corregida en esta fase**:
  `purchase_orders.totalCost`/`purchase_payments.amount` siguen en
  centavos (legado desde antes del pivote — ver Fase 8), mientras que
  `sales_orders`/`direct_sales`/`seller_sales`/`cash_movements`/
  `products.purchasePrice` están en pesos directos. El reporte usa dos
  formateadores distintos (`formatCOP` para pesos, `formatCOPCentavos`
  para los campos heredados de `purchase_orders`) en vez de normalizar la
  base de datos — una migración de unidades queda fuera de alcance de esta
  fase y como deuda técnica pendiente.
- Sin tabla ni endpoint de escritura nuevos — toda la fase es de sólo
  lectura, así que no hay UI de creación/edición ni rutas `POST`.
- UI: `/admin/reports`, con `DateRangeFilter` (client component,
  `?from=&to=` en la URL) y tarjetas por reporte. Nav: "Reportes".
- Verificado con `npm run test` (51/51) + `npm run lint` + `npm run build`
  en verde, más flujo manual en navegador: los totales del reporte
  coincidieron exactamente con los datos acumulados de las fases
  anteriores (Compras $65.000 excluyendo el pedido cancelado de la Fase 8;
  Ventas $350.000 en 3 canales — $50.000 WhatsApp + $100.000 local +
  $200.000 vendedores en 3 ventas; comisión $20.000 = 10% de $200.000;
  Caja $295.000 de saldo = $345.000 ingresos − $50.000 gastos; Cuentas por
  pagar $5.000, el único pedido a crédito sin saldar; Productos devueltos
  con la unidad devuelta en la Fase 6); y probado el filtro de fecha con
  un rango futuro sin datos, confirmando que Compras/Ventas/Utilidad/Caja
  (ingresos y gastos) bajan a 0 mientras que Inventario actual, Cuentas
  por pagar y el saldo de Caja permanecen sin cambios.

**Fase 10 — descartada:**

Antes de diseñarla se le preguntó al usuario el alcance real (¿variantes
conectadas en todos los flujos, o solo catálogo/inventario?, ¿atributos
libres o fijos?, ¿precio propio o heredado?). La respuesta fue que el
negocio **no maneja variantes de producto** — RN-007/RF-01 las mencionan en
`reglas.txt`/`requisitos.txt`, pero no aplican a este negocio en la
práctica, así que se descarta toda la fase en vez de construir algo sin
caso de uso real.

Limpieza aplicada (migración `drizzle/0011_thin_whizzer.sql`):

- Se eliminó la columna `variant_id` (nullable, nunca usada) de las 6
  tablas donde se había reservado "por si acaso" desde la Fase 1:
  `inventory_movements`, `direct_sale_items`, `seller_delivery_items`,
  `seller_sale_items`, `seller_return_items`, `seller_loss_items`.
- Se eliminó `products.hasVariants` (boolean, siempre `false`, sin uso en
  ninguna query ni UI) y su campo correspondiente en
  `lib/validations.ts#productSchema`.
- Ninguna de las columnas eliminadas tenía FK ni datos reales (todas
  nullable/siempre en su valor por defecto), así que la migración no
  perdió información — coincide con la convención del proyecto de no dejar
  columnas para "por si algún día" (`AGENTS.md`/CLAUDE.md: "no diseñes
  para requisitos hipotéticos futuros").
- Las menciones históricas de `variantId`/`hasVariants` en las secciones
  "Fase 1/2/3/5 — completada" de este archivo se corrigieron para reflejar
  que esas columnas ya no existen (en su momento se documentaron como
  "reservadas para la Fase 10").
- El roadmap de 10 fases queda cerrado: 9 completadas, 1 descartada.

## Portación de funcionalidades desde variedades-ic-mobile

Completada (sesión 2026-09-25). Contexto: `variedades-ic-mobile` (repo
hermano, 100% offline/SQLite, ver su propio `CLAUDE.md`) arrancó portando
la lógica de este repo y desde ahí desarrolló varias sesiones propias,
agregando funcionalidades de negocio que no existían acá. El objetivo final
del usuario es una sola base de datos compartida; esta sesión solo trae las
funcionalidades de negocio al repo web (Postgres) — la sincronización real
de datos entre ambos queda para después. De las 5 funcionalidades nuevas
documentadas en el móvil, se portaron las 3 de negocio (las otras 2 —
preferencia de tema, identidad visual/Lucide/animación de venta — son
específicas de React Native, no aplican a un admin web).

**Hallazgo antes de empezar**: el repo ya tenía aplicado en la base de
datos real (migraciones `0012`/`0013`, sin commitear) un intento anterior
de `paymentMethod` en `direct_sales` y la eliminación de `unit_cost` en
`seller_delivery_items` — exactamente el diseño que en el móvil se
abandonó en la misma sesión en que se creó, reemplazado por
`cash_accounts`. Se dejaron esas dos migraciones tal cual (historial de un
camino abandonado, mismo criterio de "nunca reescribir migraciones ya
aplicadas") y se construyó `cash_accounts` encima, restaurando `unit_cost`
en el camino.

**Cuentas de caja (`cash_accounts`)** — la pieza más grande:

- Tabla nueva `cash_accounts` (`name`, `type: efectivo|banco`, `active`,
  `notes`); `cash_movements.accountId`, `direct_sales.accountId`,
  `purchase_payments.accountId` ahora `NOT NULL REFERENCES cash_accounts`.
  `direct_sales.paymentMethod` y `purchase_payments.method` eliminados.
- Migraciones `0014` (solo adiciones: tabla + columnas nullable + siembra
  de las cuentas "Efectivo"/"Transferencia" + backfill a mano desde los
  valores viejos) y `0015` (solo drops/alters: `NOT NULL` + eliminar las
  columnas viejas) — separadas en dos corridas de `drizzle-kit generate`
  para que un mismo run nunca vea "columna agregada + columna quitada" en
  la misma tabla (evita el prompt interactivo de "¿es un rename?", mismo
  problema que ya había documentado el móvil para SQLite; en Postgres con
  `ALTER TABLE` por columna alcanzó con 2 pasos en vez de los 3 que usó
  SQLite).
- **Bug real corregido**: `createPurchasePayment` (pagar a un distribuidor)
  nunca generaba un `cash_movements` — se agregó esa llamada, la corrección
  que motivó todo el diseño de cuentas en el móvil también acá.
- Nuevo archivo `lib/db/queries/cash-accounts.ts` (CRUD + `getCashAccountsWithBalances`,
  saldo derivado por `SUM` sobre `cash_movements`, nunca guardado — mismo
  criterio que `getCashBalance()`).
- Todas las fuentes que escriben en caja ahora piden cuenta: movimiento
  manual, venta en local, pago a distribuidor, liquidación de vendedor, y
  **confirmar un pedido de WhatsApp** (`salesOrders`, canal exclusivo de la
  web, no existe en móvil) — la acción "Confirmar pedido" en
  `SalesStatusActions.tsx` ahora muestra un selector de cuenta y queda
  deshabilitada hasta elegir una antes de llamar a `confirmSalesOrder(id,
  accountId)`.
- UI nueva: `/admin/cash/accounts` (CRUD, mismo patrón que
  `/admin/distributors`), accesible desde "Gestionar cuentas" en
  `/admin/cash`.
- **Bug real encontrado y corregido durante la verificación manual en
  navegador** (no typecheck/lint/build no lo detectan, es un error de
  unidades en tiempo de ejecución): `createPurchasePayment` pasaba
  `data.amount` tal cual a `recordCashMovement`, pero `purchase_payments.amount`
  está en centavos (legado, ver "Riesgos abiertos" más abajo) mientras
  `cash_movements.amount` espera pesos directos — un pago de $5.000
  quedaba registrado como gasto de $500.000. Corregido con
  `Math.round(data.amount / 100)` antes de `recordCashMovement`.
  **El mismo defecto ya existía, sin corregir, en `confirmSalesOrder`**
  (pedidos de WhatsApp) desde la Fase 2 original del pivote — encontrado en
  la misma verificación pero dejado sin corregir a petición del usuario,
  documentado en "Riesgos abiertos".

**Código de proveedor único por producto**:

- `products.distributorCode` (`varchar(100)`, nullable, `.unique()`) — no
  es referencia a `distributors.id`, es el código propio del proveedor
  para ese producto puntual, texto libre.
- `findProductByDistributorCode` (case-insensitive, sin filtrar por
  `active`) + `GET /api/admin/products/by-distributor-code?code=`.
- `ProductForm.tsx`: campo opcional; al guardar, si hay código, consulta el
  endpoint antes de escribir — si encuentra otro producto (no el que se
  está editando), bloquea el guardado y muestra "Ir a editar {nombre}".
  Las rutas de creación/edición además atrapan la violación de unicidad de
  Postgres (`23505`) como red de seguridad detrás de esa validación.

**Importación de compras desde Excel (.xlsx)**:

- `lib/domain/purchase-import.ts` + `.test.ts` (11 tests), puerto casi
  literal del mismo archivo en el móvil: `parseCOPNumber`,
  `parseImportSheet` (columnas fijas por posición — A=código sin usar,
  B=nombre, C=cantidad, D=valor, E=total sin usar, se recalcula),
  `resolveImportRows` (empareja por nombre normalizado, fusiona filas del
  mismo producto, genera slug único para productos nuevos). Misma
  limitación heredada: el código de columna A no se usa para emparejar
  (no hay forma de mapearlo al SKU autogenerado), así que un nombre
  distinto entre archivos crea un producto duplicado — riesgo conocido, sin
  resolver, igual que en el móvil.
- `PurchaseOrderForm.tsx`: botón "Importar desde Excel" — lee el archivo
  con `file.arrayBuffer()` + `XLSX.read`/`utils.sheet_to_json`, resuelve
  contra el catálogo completo (no solo activos), crea los productos nuevos
  secuencialmente vía `POST /api/admin/products` (sin transacción que
  abarque todo el import, mismo límite aceptado que en móvil) y fusiona
  todo en el carrito existente. Nueva dependencia `xlsx@^0.18.5` (misma
  versión que móvil — **tiene vulnerabilidades conocidas sin parchear en
  el paquete de npm**, prototype pollution y ReDoS en SheetJS; riesgo
  acotado porque es una ruta autenticada de admin que solo procesa
  archivos que el propio dueño del negocio sube, no input público, pero
  queda anotado aquí como trade-off consciente, no pasado por alto).

**Verificación**: `npm run test` (62/62, 11 nuevos) + `npm run lint` +
`npm run build` en verde, más flujo manual completo en navegador real
(login con credenciales de prueba regeneradas, ver nota abajo): cuenta
nueva creada, venta en local con cuenta elegida reflejada en su saldo, pago
a distribuidor generando el gasto que antes no se generaba, liquidación de
vendedor con cuenta pidiendo selección y actualizando el saldo correcto,
pedido de WhatsApp rechazado por falta de stock sin tocar caja
(fail-fast confirmado) y luego confirmado con éxito generando el ingreso
en la cuenta elegida, producto con código de proveedor bloqueando un
duplicado (comparación case-insensitive) sin bloquearse a sí mismo al
editar, e importación de un `.xlsx` de prueba con una fila existente, una
nueva y una inválida (fila "TOTAL") resuelta exactamente como se esperaba.

**Follow-up — `unitCost` endurecido a `NOT NULL`** (misma sesión, tras
auditar el schema contra el del móvil para preparar la unificación de
datos): `purchase_order_items.unitCost` y `seller_delivery_items.unitCost`
eran nullable en la web, `NOT NULL` en el móvil. Se verificaron los datos
reales antes de decidir: `purchase_order_items` ya no tenía ninguna fila
vacía (el formulario nunca deja pasar un pedido sin costo); las 5 filas de
`seller_delivery_items` en `NULL` eran un artefacto de que esa columna se
había restaurado hoy mismo sin backfill, no una posibilidad real del
formulario (`DeliveryForm.tsx` siempre manda un número, mínimo 0). Se
concluyó que el comportamiento real de la UI en ambos casos ya coincidía
con lo que exige el móvil, así que se endureció la web para igualarlo (más
barato que relajar el móvil, porque no cambia ningún comportamiento
visible): migración `0017` (backfill de las filas legado a `0` + `ALTER
COLUMN ... SET NOT NULL` en ambas tablas) y `purchaseOrderItemSchema`/
`sellerDeliveryItemSchema` en `lib/validations.ts` dejaron de aceptar
`unitCost` nulo. Verificado con `npm run test` (62/62) + `npm run lint` +
`npm run build` en verde.

**Follow-up — normalización de unidades de dinero en compras** (sesión
2026-09-25): ver la nota extensa más abajo en "Riesgos abiertos" —
`purchase_orders.totalCost`, `purchase_order_items.unitCost` y
`purchase_payments.amount` se migraron de centavos a pesos directos, y de
paso se corrigió un bug real en las 3 pantallas de pedidos de WhatsApp
(dividían por 100 al mostrar el total, sin que los datos estuvieran mal).

**Follow-up — `type` de pérdida de vendedor a nivel de cabecera** (sesión
2026-09-26, siguiendo la auditoría de schema contra el móvil): estaba en
`seller_loss_items` (por línea), el móvil ya lo tenía en `seller_losses`
(por reporte completo). El usuario decidió que la web adoptara el modelo
del móvil, y como los 2 registros existentes eran de prueba, se eliminaron
en vez de escribir una migración de datos (cada reporte ya tenía un solo
tipo, así que tampoco había conflicto real que resolver). `sellerLosses`
gana `type`; `sellerLossItems` lo pierde. `sellerLossSchema` (no
`sellerLossItemSchema`) valida el campo ahora. `SellerLossForm.tsx`: el
selector de tipo pasó de estar por fila a un solo selector arriba del
carrito. `/admin/seller-losses` gana una columna "Tipo" (antes no se podía
mostrar un tipo único por fila con el modelo viejo). Verificado con
`npm run test` (62/62) + `npm run lint` + `npm run build` en verde, más
registro real en navegador (Daño, 1 unidad) confirmando en la BD que
`type` quedó en `seller_losses` y ya no en `seller_loss_items`.

**Nota de sesión**: no se tenía la contraseña del admin (`ADMIN_EMAIL` sí,
solo el hash bcrypt en `.env.local`, no el texto plano) para hacer la
verificación en navegador. A petición del usuario se generó un hash nuevo
para una contraseña de prueba y se reemplazó en `.env.local` (no
versionado) — la contraseña activa ahora es la que se le compartió al
usuario en esa sesión, no la original.

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
  acredita al vendedor en el mismo ledger.
- Fase 4 del pivote: inventario por vendedor (`lib/db/queries/seller-inventory.ts#getSellerBalance`/`getSellerInventory`,
  agregación sobre el ledger, sin contadores redundantes), página de
  detalle `/admin/sellers/[id]`.
- Fase 5 del pivote: ventas de vendedor (`seller_sales`/`seller_sale_items`,
  distinto de `salesOrders`), transacción que valida RN-020/041 vía
  `getSellerBalance`+`deductStock` antes de escribir, calcula comisión con
  `lib/domain/commission.ts`, y descuenta solo el inventario del vendedor
  (nunca el principal).
- Fase 6 del pivote: devoluciones (`seller_returns`, RN-021/043 — devuelve
  al inventario principal) y pérdidas/daños/robos (`seller_losses`,
  RN-022 — el costo lo asume el vendedor, nunca toca el principal) de
  vendedor. `SellerPicker` ahora es un componente compartido
  (`app/admin/_components/SellerPicker.tsx`) usado por ventas, devoluciones
  y pérdidas.
- Fase 7 del pivote: liquidaciones (`settlements`), cierra el día por
  vendedor (`UNIQUE(sellerId, periodDate)`), calcula `amountDue = totalSales
  - totalCommission + totalLosses` (`lib/domain/settlement.ts`), transición
  `pendiente → liquidada` validada (`lib/domain/settlement-status.ts`), y al
  liquidar genera el ingreso correspondiente en caja.
- Fase 8 del pivote: compras a crédito / cuentas por pagar
  (`purchase_payments`) — `purchaseType` (`contado`|`credito`) en
  `purchase_orders`, saldo pendiente derivado (`totalCost - SUM(pagos)`,
  nunca guardado), pagos parciales con tope en el saldo (reutiliza
  `deductStock`), columna "Saldo pendiente" por proveedor en
  `/admin/distributors`. De paso corrigió un bug de `.default()` en Zod que
  reseteaba `purchaseType`/`status` en cada PUT parcial que no los incluyera
  (ver detalle en "Fase 8 — completada" arriba).
- Fase 9 del pivote: reportes consolidados en `/admin/reports` — los 12
  reportes de RF-16 (inventario, stock mínimo, agotados, compras, ventas,
  utilidad, caja, cuentas por pagar, inventario/pendientes por vendedor,
  ventas por vendedor, productos devueltos), todo derivado por agregación,
  sin tablas nuevas. Filtro de fecha solo para los reportes de flujo
  (Compras/Ventas/Utilidad/Caja); utilidad bruta = ventas − costo de compra
  actual (decisión de negocio, ver "Fase 9 — completada" arriba para el
  detalle y limitaciones).
- Fase 10 del pivote (variantes de producto) **descartada**: el negocio no
  maneja variantes. Se eliminaron del schema las columnas `variantId`
  (6 tablas) y `products.hasVariants` que se habían reservado desde la
  Fase 1 "por si acaso" — ver "Fase 10 — descartada" arriba. El roadmap de
  10 fases queda cerrado (9 completadas, 1 descartada).

**Próximo:**

- Poblar la BD con productos reales (tarea del roadmap original, aún
  pendiente — es lo único que queda del roadmap inicial).

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
- `markSettlementLiquidada` no maneja `amountDue` negativo (comisión supera
  las ventas cobradas del día): simplemente omite el movimiento de caja sin
  avisar. No se ha discutido con el usuario qué debería pasar en ese caso
  (¿la empresa le debe al vendedor? ¿se registra como gasto?).
- **Resuelto (sesión 2026-09-25) — unidades monetarias normalizadas a pesos
  directos en toda la base.** Historial de lo que se pensó que pasaba vs.
  lo que realmente pasaba, por si ayuda a entender un cambio similar en el
  futuro:
  - `purchase_orders.totalCost`, `purchase_order_items.unitCost` y
    `purchase_payments.amount` **sí** estaban genuinamente en centavos
    (legado desde antes del pivote) — confirmado con los datos reales antes
    de tocar nada. Se migraron a pesos directos en una transacción manual
    (`ROUND(valor / 100.0)` en las tres columnas) más el `purchase_order_items`
    del pedido de prueba creado el mismo día vía importación de Excel, que
    por el bug de abajo había quedado en pesos en vez de centavos y hubo
    que corregir primero para que la migración uniforme no lo dañara. Se
    quitó el `/100` de todos los `formatCOP` de `/admin/purchase-orders`,
    `/admin/distributors` y `/admin/reports` (el helper `formatCOPCentavos`
    de reportes ya no existe, todo usa `formatCOP` sin conversión), y el
    `Math.round(data.amount / 100)` que se le había agregado a
    `createPurchasePayment` en la sesión anterior para compensar la
    inconsistencia se quitó (ya no hace falta).
  - `sales_orders.totalPrice`/`sales_order_items.unitPrice`, en cambio,
    **nunca estuvieron en centavos** — `SalesOrderForm.tsx` arma cada item
    con `unitPrice: product.price` (pesos) sin ninguna conversión, y
    `lib/db/queries/reports.ts` ya sumaba `salesOrders.totalPrice` crudo
    junto con `direct_sales`/`seller_sales` (pesos) para el reporte de
    Ventas — siempre dio el número correcto. El bug real, documentado
    incorrectamente en la sesión anterior como "`confirmSalesOrder` infla
    el ingreso en caja 100x", era al revés: `SalesOrderForm.tsx`,
    `sales-orders/page.tsx` y `sales-orders/[id]/page.tsx` tenían un
    `formatCOP` que dividía por 100 (copiado del patrón de
    `purchase-orders` sin ajustar), así que **esas tres pantallas
    mostraban cada pedido de WhatsApp 100 veces más barato de lo real** —
    la caja, que recibía el valor crudo sin dividir, era la que mostraba
    el monto correcto todo este tiempo. Se corrigió quitando el `/100` de
    esas tres pantallas; no hizo falta ninguna migración de datos porque
    los valores guardados ya eran correctos.
  - Como consecuencia de lo anterior, el bug de `createPurchasePayment`
    generando un gasto en caja 100x inflado (documentado en la sesión
    anterior) fue real y quedó corregido con la migración de arriba
    (`amount` ya en pesos, sin necesidad de `Math.round(.../100)`).
  - Verificado con `npm run test` (62/62) + `npm run lint` + `npm run
    build` en verde, más flujo manual en navegador real: `/admin/purchase-orders`,
    el detalle de cada pedido, `/admin/distributors`, `/admin/sales-orders`
    y `/admin/reports` mostrando montos consistentes entre sí (ej. el
    pedido de compra creado por importación de Excel mostrando
    correctamente $22.000 en vez de $220; los pedidos de WhatsApp #1/#3
    mostrando $50.000/$10.000 en sus propias pantallas en vez de $500/$100,
    coincidiendo por fin con lo que ya mostraba `/admin/cash`).
- El reporte de "Utilidad" (`/admin/reports`) usa el `purchasePrice`
  *actual* del producto como costo, no un snapshot histórico del costo al
  momento de cada venta (ese snapshot no se guarda en los items de venta).
  Si el costo de compra de un producto cambia, la utilidad de ventas
  pasadas se recalcula con el costo nuevo. Es "utilidad bruta" (ventas −
  costo de compra) por decisión explícita del usuario — no resta
  comisiones de vendedor ni gastos de caja.

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
