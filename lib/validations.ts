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

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
