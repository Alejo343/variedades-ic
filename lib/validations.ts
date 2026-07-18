import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hex inválido").optional(),
  imageUrl: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().optional(),
  price: z.number().int().min(0, "El precio debe ser mayor a 0"),
  purchasePrice: z.number().int().min(0, "El precio de compra debe ser mayor a 0").optional().default(0),
  categoryId: z.number().int().nullable().optional(),
  stock: z.number().int().min(0).optional().default(0),
  minStock: z.number().int().min(0).optional().default(0),
  warrantyMonths: z.number().int().min(0).nullable().optional(),
  hasVariants: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  whatsappText: z.string().optional(),
});

export const distributorSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  city: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export const purchaseOrderSchema = z.object({
  distributorId: z.number().int().nullable().optional(),
  status: z.enum(["pendiente", "en_viaje", "recibido", "cancelado"]).optional().default("pendiente"),
  expectedDate: z.string().nullable().optional(),
  totalCost: z.number().int().min(0).nullable().optional(),
  notes: z.string().optional(),
});

export const purchaseOrderItemSchema = z.object({
  orderId: z.number().int(),
  productId: z.number().int(),
  quantity: z.number().int().min(1),
  unitCost: z.number().int().min(0).nullable().optional(),
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
  active: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

export const cashMovementSchema = z.object({
  type: z.enum(["ingreso", "gasto"]),
  amount: z.number().int().min(1, "El monto debe ser mayor a 0"),
  concept: z.string().min(1, "El concepto es requerido"),
  notes: z.string().optional(),
});

export const directSaleItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
});

export const directSaleSchema = z.object({
  items: z.array(directSaleItemSchema).min(1, "Debe incluir al menos un producto"),
  notes: z.string().optional(),
});

export const sellerDeliveryItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1),
  unitCost: z.number().int().min(0).nullable().optional(),
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
  type: z.enum(["perdida", "dano", "robo"]),
  unitCost: z.number().int().min(0),
});

export const sellerLossSchema = z.object({
  sellerId: z.number().int(),
  items: z.array(sellerLossItemSchema).min(1, "Debe incluir al menos un producto"),
  notes: z.string().optional(),
});

export const settlementSchema = z.object({
  sellerId: z.number().int(),
  periodDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (formato AAAA-MM-DD)"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type DistributorInput = z.infer<typeof distributorSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;
export type SalesOrderInput = z.infer<typeof salesOrderSchema>;
export type SalesOrderItemInput = z.infer<typeof salesOrderItemSchema>;
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
export type SellerInput = z.infer<typeof sellerSchema>;
export type CashMovementInput = z.infer<typeof cashMovementSchema>;
export type DirectSaleItemInput = z.infer<typeof directSaleItemSchema>;
export type DirectSaleInput = z.infer<typeof directSaleSchema>;
export type SellerDeliveryItemInput = z.infer<typeof sellerDeliveryItemSchema>;
export type SellerDeliveryInput = z.infer<typeof sellerDeliverySchema>;
export type SellerSaleItemInput = z.infer<typeof sellerSaleItemSchema>;
export type SellerSaleInput = z.infer<typeof sellerSaleSchema>;
export type SellerReturnItemInput = z.infer<typeof sellerReturnItemSchema>;
export type SellerReturnInput = z.infer<typeof sellerReturnSchema>;
export type SellerLossItemInput = z.infer<typeof sellerLossItemSchema>;
export type SellerLossInput = z.infer<typeof sellerLossSchema>;
export type SettlementInput = z.infer<typeof settlementSchema>;

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
