import { pgTable, serial, varchar, text, integer, boolean, timestamp, date, check, pgSequence, unique, uuid, bigint, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Sync identity of the row, shared with variedades-ic-mobile (see that repo's
// CLAUDE.md, "Fase 10"): generated wherever the row is born — the phone or
// here — and the only id sync ever uses; the serial `id` stays local to each
// database. Not on sales_orders/sales_order_items (web-only, never synced).
const syncUuid = () => uuid("uuid").defaultRandom().notNull().unique();

// "What changed since X" for the mobile sync pull. Never written by app code:
// the sync_bump_version trigger (drizzle/0020, hand-written) stamps it from
// syncVersionSeq on every insert/update, holding an advisory lock so versions
// commit in increasing order. The 0 default is only a placeholder the trigger
// always overwrites.
const syncVersion = () => bigint("sync_version", { mode: "number" }).default(0).notNull();

export const syncVersionSeq = pgSequence("sync_version_seq", { startWith: 1, increment: 1 });

// Rows physically deleted from a synced table (today only product_images,
// replaced when a gallery is edited), so a pull can replay the delete —
// written only by the sync_record_tombstone trigger.
export const syncTombstones = pgTable(
  "sync_tombstones",
  {
    id: serial("id").primaryKey(),
    tableName: varchar("table_name", { length: 50 }).notNull(),
    uuid: uuid("uuid").notNull(),
    syncVersion: bigint("sync_version", { mode: "number" }).notNull(),
    deletedAt: timestamp("deleted_at").defaultNow().notNull(),
  },
  (table) => [index("sync_tombstones_version_idx").on(table.syncVersion)],
);

export const productSkuSeq = pgSequence("product_sku_seq", { startWith: 1, increment: 1 });

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#000000"),
  imageUrl: varchar("image_url", { length: 500 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  sku: varchar("sku", { length: 50 }).notNull().unique(),
  price: integer("price").notNull(),
  purchasePrice: integer("purchase_price").default(0).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  // Code the distributor assigns to this specific product (their own SKU for
  // it) — not a reference to distributors.id, just a free-text uniqueness
  // guard so the same distributor product isn't registered twice.
  distributorCode: varchar("distributor_code", { length: 100 }).unique(),
  stock: integer("stock").default(0).notNull(),
  minStock: integer("min_stock").default(0).notNull(),
  warrantyMonths: integer("warranty_months"),
  featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  whatsappText: text("whatsapp_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 500 }).notNull(),
  alt: varchar("alt", { length: 200 }),
  displayOrder: integer("display_order").default(0).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
});

export const distributors = pgTable("distributors", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  name: varchar("name", { length: 200 }).notNull(),
  city: varchar("city", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  distributorId: integer("distributor_id").references(() => distributors.id),
  status: varchar("status", { length: 20 }).default("pendiente").notNull(),
  purchaseType: varchar("purchase_type", { length: 10 }).default("contado").notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  expectedDate: date("expected_date"),
  totalCost: integer("total_cost"),
  notes: text("notes"),
  stockUpdated: boolean("stock_updated").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  orderId: integer("order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitCost: integer("unit_cost").notNull(),
});

export const salesOrders = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 200 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("pendiente").notNull(),
  deliveryNote: text("delivery_note"),
  totalPrice: integer("total_price"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const salesOrderItems = pgTable("sales_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => salesOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price"),
});

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: serial("id").primaryKey(),
    uuid: syncUuid(),
    syncVersion: syncVersion(),
    productId: integer("product_id").notNull().references(() => products.id),
    ownerType: varchar("owner_type", { length: 10 }).notNull(),
    sellerId: integer("seller_id"),
    type: varchar("type", { length: 20 }).notNull(),
    quantityDelta: integer("quantity_delta").notNull(),
    unitCost: integer("unit_cost"),
    reason: text("reason"),
    sourceType: varchar("source_type", { length: 30 }),
    sourceId: integer("source_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [check("quantity_delta_not_zero", sql`${table.quantityDelta} <> 0`)],
);

export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  city: varchar("city", { length: 100 }),
  commissionType: varchar("commission_type", { length: 15 }).notNull(),
  commissionValue: integer("commission_value").notNull(),
  active: boolean("active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Real money accounts (e.g. "Efectivo", "Transferencia") — cash_movements,
// direct_sales and purchase_payments all reference one, so each account's
// balance (SUM of its own movements) reflects real money, not just a tag.
export const cashAccounts = pgTable("cash_accounts", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 15 }).default("efectivo").notNull(),
  active: boolean("active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cashMovements = pgTable(
  "cash_movements",
  {
    id: serial("id").primaryKey(),
    uuid: syncUuid(),
    syncVersion: syncVersion(),
    type: varchar("type", { length: 10 }).notNull(),
    amount: integer("amount").notNull(),
    concept: varchar("concept", { length: 200 }).notNull(),
    movementDate: timestamp("movement_date").defaultNow().notNull(),
    sourceType: varchar("source_type", { length: 30 }),
    sourceId: integer("source_id"),
    accountId: integer("account_id").notNull().references(() => cashAccounts.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [check("amount_positive", sql`${table.amount} > 0`)],
);

export const directSales = pgTable("direct_sales", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  totalAmount: integer("total_amount").default(0).notNull(),
  accountId: integer("account_id").notNull().references(() => cashAccounts.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const directSaleItems = pgTable(
  "direct_sale_items",
  {
    id: serial("id").primaryKey(),
    uuid: syncUuid(),
    syncVersion: syncVersion(),
    saleId: integer("sale_id").notNull().references(() => directSales.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    subtotal: integer("subtotal").notNull(),
  },
  (table) => [
    check("quantity_positive", sql`${table.quantity} > 0`),
    check("unit_price_not_negative", sql`${table.unitPrice} >= 0`),
  ],
);

export const sellerDeliveries = pgTable("seller_deliveries", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id),
  deliveryDate: timestamp("delivery_date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sellerDeliveryItems = pgTable(
  "seller_delivery_items",
  {
    id: serial("id").primaryKey(),
    uuid: syncUuid(),
    syncVersion: syncVersion(),
    deliveryId: integer("delivery_id").notNull().references(() => sellerDeliveries.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(),
    unitCost: integer("unit_cost").notNull(),
  },
  (table) => [check("delivery_quantity_positive", sql`${table.quantity} > 0`)],
);

export const sellerSales = pgTable("seller_sales", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id),
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  totalAmount: integer("total_amount").default(0).notNull(),
  commissionAmount: integer("commission_amount").default(0).notNull(),
  settlementId: integer("settlement_id").references(() => settlements.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sellerSaleItems = pgTable(
  "seller_sale_items",
  {
    id: serial("id").primaryKey(),
    uuid: syncUuid(),
    syncVersion: syncVersion(),
    saleId: integer("sale_id").notNull().references(() => sellerSales.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    subtotal: integer("subtotal").notNull(),
  },
  (table) => [
    check("seller_sale_quantity_positive", sql`${table.quantity} > 0`),
    check("seller_sale_unit_price_not_negative", sql`${table.unitPrice} >= 0`),
  ],
);

export const sellerReturns = pgTable("seller_returns", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id),
  returnDate: timestamp("return_date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sellerReturnItems = pgTable(
  "seller_return_items",
  {
    id: serial("id").primaryKey(),
    uuid: syncUuid(),
    syncVersion: syncVersion(),
    returnId: integer("return_id").notNull().references(() => sellerReturns.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(),
  },
  (table) => [check("return_quantity_positive", sql`${table.quantity} > 0`)],
);

// type lives on the header (perdida/dano/robo) — one loss report is a single
// incident, matching the model already validated in variedades-ic-mobile.
export const sellerLosses = pgTable("seller_losses", {
  id: serial("id").primaryKey(),
  uuid: syncUuid(),
  syncVersion: syncVersion(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id),
  type: varchar("type", { length: 10 }).notNull(),
  lossDate: timestamp("loss_date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sellerLossItems = pgTable(
  "seller_loss_items",
  {
    id: serial("id").primaryKey(),
    uuid: syncUuid(),
    syncVersion: syncVersion(),
    lossId: integer("loss_id").notNull().references(() => sellerLosses.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(),
    unitCost: integer("unit_cost").notNull(),
  },
  (table) => [check("loss_quantity_positive", sql`${table.quantity} > 0`)],
);

export const settlements = pgTable(
  "settlements",
  {
    id: serial("id").primaryKey(),
    uuid: syncUuid(),
    syncVersion: syncVersion(),
    sellerId: integer("seller_id").notNull().references(() => sellers.id),
    periodDate: date("period_date").notNull(),
    totalSales: integer("total_sales").notNull(),
    totalCommission: integer("total_commission").notNull(),
    totalLosses: integer("total_losses").notNull(),
    amountDue: integer("amount_due").notNull(),
    status: varchar("status", { length: 15 }).default("pendiente").notNull(),
    settledAt: timestamp("settled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique("settlements_seller_period_unique").on(table.sellerId, table.periodDate)],
);

export const purchasePayments = pgTable(
  "purchase_payments",
  {
    id: serial("id").primaryKey(),
    uuid: syncUuid(),
    syncVersion: syncVersion(),
    purchaseOrderId: integer("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    paidAt: timestamp("paid_at").defaultNow().notNull(),
    accountId: integer("account_id").notNull().references(() => cashAccounts.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [check("purchase_payment_amount_positive", sql`${table.amount} > 0`)],
);

// Panel + mobile logins (see lib/domain/users.ts for the roles). Not synced to
// the phone as a table — the app gets its own user in the login response.
// The CHECKs make the role rules hold in the database itself: a seller is
// always tied to exactly one sellers row, an owner never is, and a sellers
// row has at most one login.
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 10 }).notNull(),
    sellerId: integer("seller_id").references(() => sellers.id).unique(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    check("users_role_valid", sql`${table.role} IN ('owner', 'seller')`),
    check("users_seller_iff_role_seller", sql`(${table.role} = 'seller') = (${table.sellerId} IS NOT NULL)`),
  ],
);

// One row per phone signed in through the sync login. Only the SHA-256 of the
// token is stored, so a database leak doesn't hand out working tokens.
// Revoking (revokedAt) kills that phone's sync without touching the others.
export const deviceSessions = pgTable("device_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  deviceName: varchar("device_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
});

// Every operation pushed by a phone, applied or rejected, keyed by the id the
// phone generated (sub-paso 7). Makes push idempotent: a retried operation
// (e.g. the response was lost) gets its first result back instead of being
// applied twice. Unexpected server errors are NOT recorded, so they retry.
export const syncAppliedOperations = pgTable("sync_applied_operations", {
  opId: uuid("op_id").primaryKey(),
  deviceSessionId: integer("device_session_id").notNull().references(() => deviceSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 40 }).notNull(),
  status: varchar("status", { length: 10 }).notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [check("sync_applied_operations_status_valid", sql`${table.status} IN ('applied', 'rejected')`)]);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
export type Distributor = typeof distributors.$inferSelect;
export type NewDistributor = typeof distributors.$inferInsert;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
export type SalesOrder = typeof salesOrders.$inferSelect;
export type NewSalesOrder = typeof salesOrders.$inferInsert;
export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type NewSalesOrderItem = typeof salesOrderItems.$inferInsert;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type NewInventoryMovement = typeof inventoryMovements.$inferInsert;
export type Seller = typeof sellers.$inferSelect;
export type NewSeller = typeof sellers.$inferInsert;
export type CashAccount = typeof cashAccounts.$inferSelect;
export type NewCashAccount = typeof cashAccounts.$inferInsert;
export type CashMovement = typeof cashMovements.$inferSelect;
export type NewCashMovement = typeof cashMovements.$inferInsert;
export type DirectSale = typeof directSales.$inferSelect;
export type NewDirectSale = typeof directSales.$inferInsert;
export type DirectSaleItem = typeof directSaleItems.$inferSelect;
export type NewDirectSaleItem = typeof directSaleItems.$inferInsert;
export type SellerDelivery = typeof sellerDeliveries.$inferSelect;
export type NewSellerDelivery = typeof sellerDeliveries.$inferInsert;
export type SellerDeliveryItem = typeof sellerDeliveryItems.$inferSelect;
export type NewSellerDeliveryItem = typeof sellerDeliveryItems.$inferInsert;
export type SellerSale = typeof sellerSales.$inferSelect;
export type NewSellerSale = typeof sellerSales.$inferInsert;
export type SellerSaleItem = typeof sellerSaleItems.$inferSelect;
export type NewSellerSaleItem = typeof sellerSaleItems.$inferInsert;
export type SellerReturn = typeof sellerReturns.$inferSelect;
export type NewSellerReturn = typeof sellerReturns.$inferInsert;
export type SellerReturnItem = typeof sellerReturnItems.$inferSelect;
export type NewSellerReturnItem = typeof sellerReturnItems.$inferInsert;
export type SellerLoss = typeof sellerLosses.$inferSelect;
export type NewSellerLoss = typeof sellerLosses.$inferInsert;
export type SellerLossItem = typeof sellerLossItems.$inferSelect;
export type NewSellerLossItem = typeof sellerLossItems.$inferInsert;
export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;
export type PurchasePayment = typeof purchasePayments.$inferSelect;
export type NewPurchasePayment = typeof purchasePayments.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DeviceSession = typeof deviceSessions.$inferSelect;
export type NewDeviceSession = typeof deviceSessions.$inferInsert;
