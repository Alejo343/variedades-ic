import { db } from "../index";
import { sellerDeliveries, sellerDeliveryItems, inventoryMovements, products, sellers } from "../schema";
import { eq, desc } from "drizzle-orm";
import type { SellerDeliveryInput } from "@/lib/validations";
import { recordPrincipalMovement } from "./inventory";

export type CreateSellerDeliveryResult =
  | { ok: true; delivery: typeof sellerDeliveries.$inferSelect }
  | { ok: false; error: string };

export function getAllSellerDeliveries() {
  return db
    .select({
      id: sellerDeliveries.id,
      sellerId: sellerDeliveries.sellerId,
      sellerName: sellers.name,
      deliveryDate: sellerDeliveries.deliveryDate,
      notes: sellerDeliveries.notes,
    })
    .from(sellerDeliveries)
    .leftJoin(sellers, eq(sellerDeliveries.sellerId, sellers.id))
    .orderBy(desc(sellerDeliveries.deliveryDate));
}

export async function getSellerDeliveryById(id: number) {
  const [delivery] = await db
    .select({
      id: sellerDeliveries.id,
      sellerId: sellerDeliveries.sellerId,
      sellerName: sellers.name,
      deliveryDate: sellerDeliveries.deliveryDate,
      notes: sellerDeliveries.notes,
    })
    .from(sellerDeliveries)
    .leftJoin(sellers, eq(sellerDeliveries.sellerId, sellers.id))
    .where(eq(sellerDeliveries.id, id))
    .limit(1);

  if (!delivery) return null;

  const items = await db
    .select({
      id: sellerDeliveryItems.id,
      deliveryId: sellerDeliveryItems.deliveryId,
      productId: sellerDeliveryItems.productId,
      quantity: sellerDeliveryItems.quantity,
      unitCost: sellerDeliveryItems.unitCost,
      productName: products.name,
    })
    .from(sellerDeliveryItems)
    .leftJoin(products, eq(sellerDeliveryItems.productId, products.id))
    .where(eq(sellerDeliveryItems.deliveryId, id));

  return { ...delivery, items };
}

export async function createSellerDelivery(data: SellerDeliveryInput): Promise<CreateSellerDeliveryResult> {
  try {
    return await db.transaction(async (tx) => {
      const [delivery] = await tx
        .insert(sellerDeliveries)
        .values({ sellerId: data.sellerId, notes: data.notes ?? null })
        .returning();

      for (const item of data.items) {
        const principalResult = await recordPrincipalMovement(tx, {
          productId: item.productId,
          type: "entrega_vendedor",
          quantityDelta: -item.quantity,
          unitCost: item.unitCost,
          sourceType: "seller_delivery",
          sourceId: delivery.id,
        });
        if (!principalResult.ok) throw new Error(principalResult.error);

        await tx.insert(inventoryMovements).values({
          productId: item.productId,
          ownerType: "seller",
          sellerId: data.sellerId,
          type: "entrega_vendedor",
          quantityDelta: item.quantity,
          unitCost: item.unitCost ?? null,
          sourceType: "seller_delivery",
          sourceId: delivery.id,
        });

        await tx.insert(sellerDeliveryItems).values({
          deliveryId: delivery.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost ?? null,
        });
      }

      return { ok: true, delivery };
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
