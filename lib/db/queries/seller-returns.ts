import { db } from "../index";
import { sellerReturns, sellerReturnItems, inventoryMovements, sellers, products } from "../schema";
import { eq, desc, sql } from "drizzle-orm";
import type { SellerReturnInput } from "@/lib/validations";
import { deductStock } from "@/lib/domain/stock";
import { getSellerBalance } from "./seller-inventory";
import { recordPrincipalMovement } from "./inventory";

export type CreateSellerReturnResult =
  | { ok: true; sellerReturn: typeof sellerReturns.$inferSelect }
  | { ok: false; error: string };

export function getAllSellerReturns() {
  return db
    .select({
      id: sellerReturns.id,
      sellerId: sellerReturns.sellerId,
      sellerName: sellers.name,
      returnDate: sellerReturns.returnDate,
      notes: sellerReturns.notes,
      units: sql<number>`(SELECT COALESCE(SUM(${sellerReturnItems.quantity}), 0)::int FROM ${sellerReturnItems} WHERE ${sellerReturnItems.returnId} = ${sellerReturns.id})`,
    })
    .from(sellerReturns)
    .leftJoin(sellers, eq(sellerReturns.sellerId, sellers.id))
    .orderBy(desc(sellerReturns.returnDate));
}

export async function getReturnedProductsSummary() {
  const rows = await db
    .select({
      productId: sellerReturnItems.productId,
      productName: products.name,
      totalQuantity: sql<string>`COALESCE(SUM(${sellerReturnItems.quantity}), 0)`,
    })
    .from(sellerReturnItems)
    .leftJoin(products, eq(sellerReturnItems.productId, products.id))
    .groupBy(sellerReturnItems.productId, products.name);

  return rows.map((r) => ({ ...r, totalQuantity: Number(r.totalQuantity) }));
}

export async function createSellerReturn(data: SellerReturnInput): Promise<CreateSellerReturnResult> {
  try {
    return await db.transaction(async (tx) => {
      for (const item of data.items) {
        const balance = await getSellerBalance(tx, data.sellerId, item.productId);
        const result = deductStock(balance, item.quantity);
        if (!result.ok) return { ok: false, error: `Producto ${item.productId}: ${result.reason}` };
      }

      const [sellerReturn] = await tx
        .insert(sellerReturns)
        .values({ sellerId: data.sellerId, notes: data.notes ?? null })
        .returning();

      for (const item of data.items) {
        await tx.insert(inventoryMovements).values({
          productId: item.productId,
          ownerType: "seller",
          sellerId: data.sellerId,
          type: "devolucion",
          quantityDelta: -item.quantity,
          sourceType: "seller_return",
          sourceId: sellerReturn.id,
        });

        const principalResult = await recordPrincipalMovement(tx, {
          productId: item.productId,
          type: "devolucion",
          quantityDelta: item.quantity,
          sourceType: "seller_return",
          sourceId: sellerReturn.id,
        });
        if (!principalResult.ok) throw new Error(principalResult.error);

        await tx.insert(sellerReturnItems).values({
          returnId: sellerReturn.id,
          productId: item.productId,
          quantity: item.quantity,
        });
      }

      return { ok: true, sellerReturn };
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
