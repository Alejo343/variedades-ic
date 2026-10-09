import { db } from "../index";
import { products, categories, productImages } from "../schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { ProductInput } from "@/lib/validations";
import { SkuConflictError, isSkuTaken, nextAutoSku, skuForCategoryChange } from "./sku";

export async function findProductByDistributorCode(code: string) {
  const [product] = await db
    .select({ id: products.id, name: products.name, distributorCode: products.distributorCode })
    .from(products)
    .where(sql`lower(${products.distributorCode}) = lower(${code})`)
    .limit(1);

  return product ?? null;
}

export function getHeroProduct() {
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
    .where(eq(products.active, true))
    .orderBy(desc(products.featured), desc(products.createdAt))
    .limit(1);
}

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
      sku: products.sku,
      distributorCode: products.distributorCode,
      price: products.price,
      purchasePrice: products.purchasePrice,
      stock: products.stock,
      minStock: products.minStock,
      featured: products.featured,
      active: products.active,
      createdAt: products.createdAt,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      imageUrl: sql<string | null>`(SELECT ${productImages.url} FROM ${productImages} WHERE ${productImages.productId} = ${products.id} ORDER BY ${productImages.isPrimary} DESC, ${productImages.displayOrder} ASC LIMIT 1)`,
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

/** `data.sku` (already normalized by productSchema) = SKU propio; absent = auto. Throws SkuConflictError. */
export async function createProduct(data: ProductInput) {
  return db.transaction(async (tx) => {
    let sku = data.sku;
    if (sku) {
      if (await isSkuTaken(tx, sku)) throw new SkuConflictError(sku);
    } else {
      let categoryName: string | null = null;
      if (data.categoryId) {
        const [category] = await tx
          .select({ name: categories.name })
          .from(categories)
          .where(eq(categories.id, data.categoryId))
          .limit(1);
        categoryName = category?.name ?? null;
      }
      sku = await nextAutoSku(tx, categoryName);
    }
    return tx.insert(products).values({ ...data, sku }).returning();
  });
}

/**
 * SKU rules on edit: a SKU typed by the owner wins (must be unique); otherwise
 * a category change re-prefixes an auto SKU (lib/domain/sku.ts#skuAfterCategoryChange).
 * Throws SkuConflictError.
 */
export async function updateProduct(id: number, data: Partial<ProductInput>) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ id: products.id, sku: products.sku, categoryId: products.categoryId })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!current) return [];

    const { sku: typedSku, ...rest } = data;
    let sku: string | undefined;
    if (typedSku && typedSku !== current.sku) {
      if (await isSkuTaken(tx, typedSku, id)) throw new SkuConflictError(typedSku);
      sku = typedSku;
    } else if (rest.categoryId !== undefined) {
      sku = (await skuForCategoryChange(tx, current, rest.categoryId ?? null)) ?? undefined;
    }

    return tx
      .update(products)
      .set({ ...rest, ...(sku ? { sku } : {}), updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
  });
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
