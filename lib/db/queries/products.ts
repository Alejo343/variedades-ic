import { db } from "../index";
import { products, categories, productImages } from "../schema";
import { eq, desc } from "drizzle-orm";
import type { ProductInput } from "@/lib/validations";

export function getAllProducts() {
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      stock: products.stock,
      featured: products.featured,
      active: products.active,
      createdAt: products.createdAt,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));
}

export function getFeaturedProducts() {
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      stock: products.stock,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.featured, true))
    .limit(8);
}

export async function getProductById(id: number) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(productImages.displayOrder);

  return { ...product, images };
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(productImages.displayOrder);

  return { ...product, images };
}

export function createProduct(data: ProductInput) {
  return db.insert(products).values(data).returning();
}

export function updateProduct(id: number, data: Partial<ProductInput>) {
  return db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
}

export function deleteProduct(id: number) {
  return db.update(products).set({ active: false, updatedAt: new Date() }).where(eq(products.id, id)).returning();
}

export function addProductImage(data: { productId: number; url: string; alt?: string; displayOrder?: number; isPrimary?: boolean }) {
  return db.insert(productImages).values(data).returning();
}

export function deleteProductImage(id: number) {
  return db.delete(productImages).where(eq(productImages.id, id)).returning();
}
