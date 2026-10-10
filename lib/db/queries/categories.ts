import { db } from "../index";
import { categories, products } from "../schema";
import { eq, and, count, desc, sql } from "drizzle-orm";
import type { CategoryInput } from "@/lib/validations";

export function getAllCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export function getActiveCategories() {
  return db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.name);
}

export function getCategoriesWithCount() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      color: categories.color,
      imageUrl: categories.imageUrl,
      // Picture shown on the public site: the manual one if set, else the
      // main photo of one of its active products (featured, then in stock,
      // then newest). null = no product with a photo yet (site shows an icon).
      image: sql<string | null>`COALESCE(${categories.imageUrl}, (
        SELECT pi.url FROM products p2
        JOIN product_images pi ON pi.product_id = p2.id
        WHERE p2.category_id = ${categories.id} AND p2.active
        ORDER BY p2.featured DESC, (p2.stock > 0) DESC, p2.created_at DESC,
                 pi.is_primary DESC, pi.display_order ASC
        LIMIT 1
      ))`,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.active, true)))
    .where(eq(categories.active, true))
    .groupBy(categories.id)
    .orderBy(categories.name);
}

// Main photo of each product in a category, for picking the category's
// picture by hand in the admin. Same order as the automatic pick in
// getCategoriesWithCount, so the first active one is what "automática" shows.
export async function getCategoryProductPhotos(categoryId: number) {
  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      active: products.active,
      url: sql<string | null>`(
        SELECT pi.url FROM product_images pi WHERE pi.product_id = "products"."id"
        ORDER BY pi.is_primary DESC, pi.display_order ASC LIMIT 1
      )`, // qualified by hand: in a single-table select Drizzle renders ${products.id} as a bare "id", which would bind to pi.id here
    })
    .from(products)
    .where(eq(products.categoryId, categoryId))
    .orderBy(
      desc(products.active),
      desc(products.featured),
      sql`(${products.stock} > 0) DESC`,
      desc(products.createdAt)
    )
    .limit(48);
  return rows.filter((r): r is typeof r & { url: string } => r.url !== null);
}

export function getCategoryById(id: number) {
  return db.select().from(categories).where(eq(categories.id, id)).limit(1);
}

export function createCategory(data: CategoryInput) {
  return db.insert(categories).values(data).returning();
}

export function updateCategory(id: number, data: Partial<CategoryInput>) {
  return db.update(categories).set(data).where(eq(categories.id, id)).returning();
}

export function deleteCategory(id: number) {
  return db.update(categories).set({ active: false }).where(eq(categories.id, id)).returning();
}
