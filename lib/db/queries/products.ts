import { db } from "../index";
import { products, categories, productImages } from "../schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { ProductInput } from "@/lib/validations";

export function getPublicProducts(categorySlug?: string) {
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      stock: products.stock,
      featured: products.featured,
      categoryName: categories.name,
      categorySlug: categories.slug,
      primaryImage: sql<string | null>`(
        SELECT url FROM product_images
        WHERE product_id = ${products.id}
        ORDER BY is_primary DESC, display_order ASC
        LIMIT 1
      )`,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      categorySlug
        ? and(eq(products.active, true), eq(categories.slug, categorySlug))
        : eq(products.active, true)
    )
    .orderBy(desc(products.createdAt));
}

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
      featured: products.featured,
      categoryName: categories.name,
      categorySlug: categories.slug,
      primaryImage: sql<string | null>`(
        SELECT url FROM product_images
        WHERE product_id = ${products.id}
        ORDER BY is_primary DESC, display_order ASC
        LIMIT 1
      )`,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.featured, true), eq(products.active, true)))
    .orderBy(desc(products.createdAt))
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
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      categoryId: products.categoryId,
      stock: products.stock,
      featured: products.featured,
      active: products.active,
      whatsappText: products.whatsappText,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.active, true)))
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
