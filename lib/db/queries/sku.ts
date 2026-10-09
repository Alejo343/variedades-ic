import { sql } from "drizzle-orm";
import { db } from "../index";
import { formatSku, getSkuPrefix, skuAfterCategoryChange } from "@/lib/domain/sku";

// One SKU policy for every writer of products: the panel (create/edit), the
// Excel import and the phone sync (lib/sync/operations/catalog.ts).

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

/** Thrown when a SKU typed by the owner already belongs to another product. */
export class SkuConflictError extends Error {
  constructor(public readonly sku: string) {
    super(`Ya existe un producto con el SKU ${sku}`);
  }
}

export async function isSkuTaken(dbOrTx: DbOrTx, sku: string, exceptProductId?: number | null): Promise<boolean> {
  const res = await dbOrTx.execute(
    sql`SELECT 1 FROM products WHERE upper(sku) = upper(${sku}) AND id <> ${exceptProductId ?? -1} LIMIT 1`,
  );
  return res.rows.length > 0;
}

/**
 * Next auto SKU for a category. Skips numbers already taken: a SKU typed by
 * hand in the auto shape (e.g. TECN-00500) could otherwise collide with the
 * sequence when it gets there.
 */
export async function nextAutoSku(dbOrTx: DbOrTx, categoryName: string | null | undefined): Promise<string> {
  const prefix = getSkuPrefix(categoryName);
  for (;;) {
    const res = await dbOrTx.execute(sql`SELECT nextval('product_sku_seq') AS n`);
    const sku = formatSku(prefix, Number((res.rows[0] as { n: string }).n));
    if (!(await isSkuTaken(dbOrTx, sku))) return sku;
  }
}

async function categoryName(dbOrTx: DbOrTx, categoryId: number | null | undefined): Promise<string | null> {
  if (categoryId === null || categoryId === undefined) return null;
  const res = await dbOrTx.execute(sql`SELECT name FROM categories WHERE id = ${categoryId}`);
  return (res.rows[0] as { name: string } | undefined)?.name ?? null;
}

/**
 * The SKU a product must get when it moves from `oldCategoryId` to
 * `newCategoryId` (see lib/domain/sku.ts#skuAfterCategoryChange), or null when
 * it keeps its SKU. If the re-prefixed SKU is already used by another product
 * (a hand-typed one), a fresh auto SKU of the new category is used instead.
 */
export async function skuForCategoryChange(
  dbOrTx: DbOrTx,
  product: { id: number; sku: string; categoryId: number | null },
  newCategoryId: number | null,
): Promise<string | null> {
  if ((product.categoryId ?? null) === (newCategoryId ?? null)) return null;
  const [oldName, newName] = await Promise.all([categoryName(dbOrTx, product.categoryId), categoryName(dbOrTx, newCategoryId)]);
  const next = skuAfterCategoryChange(product.sku, oldName, newName);
  if (!next) return null;
  return (await isSkuTaken(dbOrTx, next, product.id)) ? nextAutoSku(dbOrTx, newName) : next;
}
