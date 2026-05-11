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
  categoryId: z.number().int().nullable().optional(),
  stock: z.number().int().min(0).optional().default(0),
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

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type DistributorInput = z.infer<typeof distributorSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;
export type SalesOrderInput = z.infer<typeof salesOrderSchema>;
export type SalesOrderItemInput = z.infer<typeof salesOrderItemSchema>;

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
