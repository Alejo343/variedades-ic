import { db } from "../index";
import { purchaseOrders, purchaseOrderItems, distributors, products } from "../schema";
import { eq, desc } from "drizzle-orm";
import type { PurchaseOrderInput, PurchaseOrderCreateInput } from "@/lib/validations";
import { canTransitionPurchaseOrder, type PurchaseOrderStatus } from "@/lib/domain/order-status";
import { recordPrincipalMovement } from "./inventory";

export function getAllPurchaseOrders() {
  return db
    .select({
      id: purchaseOrders.id,
      status: purchaseOrders.status,
      purchaseType: purchaseOrders.purchaseType,
      orderDate: purchaseOrders.orderDate,
      expectedDate: purchaseOrders.expectedDate,
      totalCost: purchaseOrders.totalCost,
      notes: purchaseOrders.notes,
      stockUpdated: purchaseOrders.stockUpdated,
      createdAt: purchaseOrders.createdAt,
      distributorId: purchaseOrders.distributorId,
      distributorName: distributors.name,
    })
    .from(purchaseOrders)
    .leftJoin(distributors, eq(purchaseOrders.distributorId, distributors.id))
    .orderBy(desc(purchaseOrders.createdAt));
}

export async function getPurchaseOrderById(id: number) {
  const [order] = await db
    .select({
      id: purchaseOrders.id,
      status: purchaseOrders.status,
      purchaseType: purchaseOrders.purchaseType,
      orderDate: purchaseOrders.orderDate,
      expectedDate: purchaseOrders.expectedDate,
      totalCost: purchaseOrders.totalCost,
      notes: purchaseOrders.notes,
      stockUpdated: purchaseOrders.stockUpdated,
      createdAt: purchaseOrders.createdAt,
      updatedAt: purchaseOrders.updatedAt,
      distributorId: purchaseOrders.distributorId,
      distributorName: distributors.name,
    })
    .from(purchaseOrders)
    .leftJoin(distributors, eq(purchaseOrders.distributorId, distributors.id))
    .where(eq(purchaseOrders.id, id))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select({
      id: purchaseOrderItems.id,
      orderId: purchaseOrderItems.orderId,
      productId: purchaseOrderItems.productId,
      quantity: purchaseOrderItems.quantity,
      unitCost: purchaseOrderItems.unitCost,
      productName: products.name,
    })
    .from(purchaseOrderItems)
    .leftJoin(products, eq(purchaseOrderItems.productId, products.id))
    .where(eq(purchaseOrderItems.orderId, id));

  return { ...order, items };
}

// totalCost is never trusted from the client — computed here from the items
// actually inserted, in the same transaction, matching variedades-ic-mobile's
// model (see CLAUDE.md "Total del pedido de compra").
export function createPurchaseOrder(data: PurchaseOrderCreateInput) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(purchaseOrders)
      .values({
        distributorId: data.distributorId ?? null,
        status: data.status ?? "pendiente",
        purchaseType: data.purchaseType ?? "contado",
        expectedDate: data.expectedDate ?? null,
        notes: data.notes,
      })
      .returning();

    let totalCost = 0;
    for (const item of data.items) {
      totalCost += item.quantity * item.unitCost;
      await tx.insert(purchaseOrderItems).values({ orderId: order.id, ...item });
    }

    return tx.update(purchaseOrders).set({ totalCost }).where(eq(purchaseOrders.id, order.id)).returning();
  });
}

export function updatePurchaseOrder(id: number, data: Partial<PurchaseOrderInput>) {
  return db
    .update(purchaseOrders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id))
    .returning();
}

export async function markPurchaseOrderReceived(id: number) {
  return await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!order || order.stockUpdated || !canTransitionPurchaseOrder(order.status as PurchaseOrderStatus, "recibido")) {
      return null;
    }

    const items = await tx
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.orderId, id));

    for (const item of items) {
      const result = await recordPrincipalMovement(tx, {
        productId: item.productId,
        type: "compra",
        quantityDelta: item.quantity,
        unitCost: item.unitCost,
        sourceType: "purchase_order",
        sourceId: id,
      });
      if (!result.ok) throw new Error(result.error);
    }

    const [updated] = await tx
      .update(purchaseOrders)
      .set({ status: "recibido", stockUpdated: true, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();

    return updated;
  });
}

export function deletePurchaseOrder(id: number) {
  return db.delete(purchaseOrders).where(eq(purchaseOrders.id, id)).returning();
}
