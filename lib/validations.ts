import { z } from "zod";
import { normalizeSku } from "./domain/sku";
import { normalizeUsername } from "@/lib/domain/users";

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hex inválido").optional(),
  // Manual picture for the category: an image uploaded to this server (its
  // own upload or one of its products' photos). null = automatic (the
  // public site picks a photo from the category's products).
  imageUrl: z
    .string()
    .max(500)
    .regex(/^\/uploads\/[A-Za-z0-9/_.-]+$/, "Imagen inválida")
    .refine((url) => !url.includes(".."), "Imagen inválida")
    .nullable()
    .optional(),
  active: z.boolean().optional().default(true),
});

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().optional(),
  price: z.number().int().min(0, "El precio debe ser mayor a 0"),
  purchasePrice: z.number().int().min(0, "El precio de compra debe ser mayor a 0").optional().default(0),
  categoryId: z.number().int().nullable().optional(),
  distributorCode: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  stock: z.number().int().min(0).optional().default(0),
  minStock: z.number().int().min(0).optional().default(0),
  warrantyMonths: z.number().int().min(0).nullable().optional(),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  whatsappText: z.string().optional(),
  // SKU propio. Empty/absent = auto-generated on create, unchanged on edit.
  sku: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : undefined))
    .refine((v) => v === undefined || normalizeSku(v) !== null, "SKU inválido: usa letras, números, guion, punto o guion bajo (máx. 50, sin espacios)")
    .transform((v) => (v === undefined ? undefined : normalizeSku(v)!)),
});

// Rows already parsed from the template by lib/domain/product-import.ts#parseProductSheet
// (the browser reads the .xlsx); the server re-plans them against the DB.
const nullableInt = z.number().int().min(0).nullable();
export const productImportRowSchema = z.object({
  rowNumber: z.number().int().min(1),
  sku: z.string().trim().min(1).nullable(),
  name: z.string().trim().min(1, "El nombre es requerido"),
  category: z.string().trim().min(1).nullable(),
  price: nullableInt,
  cost: nullableInt,
  quantity: nullableInt,
  minStock: nullableInt,
  distributorCode: z.string().trim().min(1).nullable(),
  warrantyMonths: nullableInt,
  description: z.string().nullable(),
  active: z.boolean().nullable(),
});

export const productImportSchema = z.object({
  rows: z.array(productImportRowSchema).min(1, "El archivo no tiene filas").max(5000, "Máximo 5000 filas por archivo"),
  dryRun: z.boolean().optional().default(true),
});

export const distributorSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  city: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional().default(true),
});

// totalCost is never client-supplied — createPurchaseOrder computes it from
// items in the same transaction (lib/db/queries/purchase-orders.ts),
// matching the model already validated in variedades-ic-mobile. This schema
// covers editing/transitioning an existing order and creation's header
// fields; it never accepts totalCost.
export const purchaseOrderSchema = z.object({
  distributorId: z.number().int().nullable().optional(),
  status: z.enum(["pendiente", "en_viaje", "recibido", "cancelado"]).optional(),
  purchaseType: z.enum(["contado", "credito"]).optional(),
  expectedDate: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export const purchaseOrderNewItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1),
  unitCost: z.number().int().min(0),
});

export const purchaseOrderCreateSchema = purchaseOrderSchema.extend({
  items: z.array(purchaseOrderNewItemSchema).min(1, "Debe incluir al menos un producto"),
});

export const salesOrderSchema = z.object({
  customerName: z.string().min(1, "El nombre es requerido"),
  customerPhone: z.string().min(1, "El teléfono es requerido"),
  status: z.enum(["pendiente", "confirmado", "entregado", "cancelado"]).optional().default("pendiente"),
  deliveryNote: z.string().optional(),
  totalPrice: z.number().int().min(0).nullable().optional(),
  notes: z.string().optional(),
});

export const salesOrderItemSchema = z.object({
  orderId: z.number().int(),
  productId: z.number().int(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0).nullable().optional(),
});

export const inventoryAdjustmentSchema = z.object({
  productId: z.number().int(),
  quantityDelta: z.number().int().refine((v) => v !== 0, "La cantidad no puede ser cero"),
  reason: z.string().min(1, "El motivo es requerido"),
});

export const sellerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().optional(),
  city: z.string().optional(),
  commissionType: z.enum(["percentage", "fixed_per_unit"]),
  commissionValue: z.number().int().min(0, "La comisión no puede ser negativa"),
  // No default here: a partial update (PUT) without it must keep the current
  // mode. A new seller gets the column default ('consignment').
  inventoryMode: z.enum(["consignment", "store"]).optional(),
  active: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

// Paying a store seller every commission still unpaid up to periodDate.
export const commissionPaymentSchema = z.object({
  periodDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha con formato inválido"),
  accountId: z.number().int(),
  notes: z.string().max(2000).optional(),
});

// App login of a seller (sub-paso 4 of the mobile sync). The username is
// typed on a phone keyboard, so it's normalized and limited to plain ASCII.
const usernameField = z
  .string()
  .transform(normalizeUsername)
  .pipe(
    z
      .string()
      .min(3, "El usuario debe tener al menos 3 caracteres")
      .max(100)
      .regex(/^[a-z0-9._@-]+$/, "Solo letras sin tildes, números y . _ @ -"),
  );
const passwordField = z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200);

export const sellerUserCreateSchema = z.object({
  username: usernameField,
  password: passwordField,
});

export const sellerUserUpdateSchema = z
  .object({
    password: passwordField.optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => d.password !== undefined || d.active !== undefined, "No hay nada que cambiar");

// Sync login from the phone (sub-paso 5). No format rules on the username
// here — only normalization — so the owner can sign in with their email as is.
export const syncLoginSchema = z.object({
  username: z.string().transform(normalizeUsername).pipe(z.string().min(1, "El usuario es requerido").max(100)),
  password: z.string().min(1, "La contraseña es requerida").max(200),
  deviceName: z.string().trim().min(1).max(100).optional(),
});

// A batch of operations pushed by a phone (sub-paso 7). Each payload is
// validated later by its own handler (lib/sync/operations); here only the
// envelope. Ids are generated on the phone and make the push idempotent.
export const syncPushSchema = z.object({
  operations: z
    .array(z.object({ id: z.uuid(), type: z.string().min(1).max(40), payload: z.unknown() }))
    .min(1)
    .max(100)
    .refine((ops) => new Set(ops.map((o) => o.id)).size === ops.length, "Operaciones con id repetido en el mismo lote"),
});

export const cashAccountSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(["efectivo", "banco"]).optional().default("efectivo"),
  active: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

export const cashMovementSchema = z.object({
  type: z.enum(["ingreso", "gasto"]),
  amount: z.number().int().min(1, "El monto debe ser mayor a 0"),
  concept: z.string().min(1, "El concepto es requerido"),
  accountId: z.number().int(),
  notes: z.string().optional(),
  // Cash adjustment (opening balance, count correction): moves the balance but
  // is not income/expense — see lib/domain/cash.ts.
  adjustment: z.boolean().optional().default(false),
});

// Moving money between two cash accounts (panel) — see lib/domain/cash.ts.
export const cashTransferSchema = z.object({
  fromAccountId: z.number().int(),
  toAccountId: z.number().int(),
  amount: z.number().int().min(1, "El monto debe ser mayor a 0"),
  notes: z.string().optional(),
});

export const directSaleItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
});

export const directSaleSchema = z.object({
  items: z.array(directSaleItemSchema).min(1, "Debe incluir al menos un producto"),
  accountId: z.number().int(),
  notes: z.string().optional(),
});

export const accountSelectionSchema = z.object({
  accountId: z.number().int(),
});

export const sellerDeliveryItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1),
  unitCost: z.number().int().min(0),
});

export const sellerDeliverySchema = z.object({
  sellerId: z.number().int(),
  items: z.array(sellerDeliveryItemSchema).min(1, "Debe incluir al menos un producto"),
  notes: z.string().optional(),
});

export const sellerSaleItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
});

export const sellerSaleSchema = z.object({
  sellerId: z.number().int(),
  items: z.array(sellerSaleItemSchema).min(1, "Debe incluir al menos un producto"),
  notes: z.string().optional(),
});

export const sellerReturnItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1),
});

export const sellerReturnSchema = z.object({
  sellerId: z.number().int(),
  items: z.array(sellerReturnItemSchema).min(1, "Debe incluir al menos un producto"),
  notes: z.string().optional(),
});

export const sellerLossItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1),
  unitCost: z.number().int().min(0),
});

export const sellerLossSchema = z.object({
  sellerId: z.number().int(),
  type: z.enum(["perdida", "dano", "robo"]),
  items: z.array(sellerLossItemSchema).min(1, "Debe incluir al menos un producto"),
  notes: z.string().optional(),
});

export const settlementSchema = z.object({
  sellerId: z.number().int(),
  periodDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (formato AAAA-MM-DD)"),
});

export const purchasePaymentSchema = z.object({
  amount: z.number().int().min(1, "El monto debe ser mayor a 0"),
  accountId: z.number().int(),
  notes: z.string().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductImportInput = z.infer<typeof productImportSchema>;
export type DistributorInput = z.infer<typeof distributorSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderNewItemInput = z.infer<typeof purchaseOrderNewItemSchema>;
export type PurchaseOrderCreateInput = z.infer<typeof purchaseOrderCreateSchema>;
export type SalesOrderInput = z.infer<typeof salesOrderSchema>;
export type SalesOrderItemInput = z.infer<typeof salesOrderItemSchema>;
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
export type SellerInput = z.infer<typeof sellerSchema>;
export type CommissionPaymentInput = z.infer<typeof commissionPaymentSchema>;
export type SellerUserCreateInput = z.infer<typeof sellerUserCreateSchema>;
export type SellerUserUpdateInput = z.infer<typeof sellerUserUpdateSchema>;
export type SyncLoginInput = z.infer<typeof syncLoginSchema>;
export type SyncPushInput = z.infer<typeof syncPushSchema>;
export type CashAccountInput = z.infer<typeof cashAccountSchema>;
export type CashMovementInput = z.infer<typeof cashMovementSchema>;
export type CashTransferInput = z.infer<typeof cashTransferSchema>;
export type DirectSaleItemInput = z.infer<typeof directSaleItemSchema>;
export type DirectSaleInput = z.infer<typeof directSaleSchema>;
export type AccountSelectionInput = z.infer<typeof accountSelectionSchema>;
export type SellerDeliveryItemInput = z.infer<typeof sellerDeliveryItemSchema>;
export type SellerDeliveryInput = z.infer<typeof sellerDeliverySchema>;
export type SellerSaleItemInput = z.infer<typeof sellerSaleItemSchema>;
export type SellerSaleInput = z.infer<typeof sellerSaleSchema>;
export type SellerReturnItemInput = z.infer<typeof sellerReturnItemSchema>;
export type SellerReturnInput = z.infer<typeof sellerReturnSchema>;
export type SellerLossItemInput = z.infer<typeof sellerLossItemSchema>;
export type SellerLossInput = z.infer<typeof sellerLossSchema>;
export type SettlementInput = z.infer<typeof settlementSchema>;
export type PurchasePaymentInput = z.infer<typeof purchasePaymentSchema>;

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
