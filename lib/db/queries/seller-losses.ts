import { db } from "../index";
import { sellerLosses, sellerLossItems, inventoryMovements, sellers } from "../schema";
import { eq, desc } from "drizzle-orm";
import type { SellerLossInput } from "@/lib/validations";
import { deductStock } from "@/lib/domain/stock";
import { getSellerBalance } from "./seller-inventory";

export type CreateSellerLossResult =
  | { ok: true; sellerLoss: typeof sellerLosses.$inferSelect }
  | { ok: false; error: string };

export function getAllSellerLosses() {
  return db
    .select({
      id: sellerLosses.id,
      sellerId: sellerLosses.sellerId,
      sellerName: sellers.name,
      lossDate: sellerLosses.lossDate,
      notes: sellerLosses.notes,
    })
    .from(sellerLosses)
    .leftJoin(sellers, eq(sellerLosses.sellerId, sellers.id))
    .orderBy(desc(sellerLosses.lossDate));
}

export async function createSellerLoss(data: SellerLossInput): Promise<CreateSellerLossResult> {
  try {
    return await db.transaction(async (tx) => {
      for (const item of data.items) {
        const balance = await getSellerBalance(tx, data.sellerId, item.productId);
        const result = deductStock(balance, item.quantity);
        if (!result.ok) return { ok: false, error: `Producto ${item.productId}: ${result.reason}` };
      }

      const [sellerLoss] = await tx
        .insert(sellerLosses)
        .values({ sellerId: data.sellerId, notes: data.notes ?? null })
        .returning();

      for (const item of data.items) {
        await tx.insert(inventoryMovements).values({
          productId: item.productId,
          ownerType: "seller",
          sellerId: data.sellerId,
          type: item.type,
          quantityDelta: -item.quantity,
          unitCost: item.unitCost,
          sourceType: "seller_loss",
          sourceId: sellerLoss.id,
        });

        await tx.insert(sellerLossItems).values({
          lossId: sellerLoss.id,
          productId: item.productId,
          quantity: item.quantity,
          type: item.type,
          unitCost: item.unitCost,
        });
      }

      return { ok: true, sellerLoss };
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
