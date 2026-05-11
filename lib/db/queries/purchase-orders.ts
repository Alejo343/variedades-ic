import { db } from "../index";
import { purchaseOrders, purchaseOrderItems, distributors, products } from "../schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import type { PurchaseOrderInput, PurchaseOrderItemInput } from "@/lib/validations";

export function getAllPurchaseOrders() {
  return db
    .select({
      id: purchaseOrders.id,
      status: purchaseOrders.status,
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

export function createPurchaseOrder(data: PurchaseOrderInput) {
  return db.insert(purchaseOrders).values({
    distributorId: data.distributorId ?? null,
    status: data.status ?? "pendiente",
    expectedDate: data.expectedDate ?? null,
    totalCost: data.totalCost ?? null,
    notes: data.notes,
  }).returning();
}

export function addPurchaseOrderItem(data: PurchaseOrderItemInput) {
  return db.insert(purchaseOrderItems).values(data).returning();
}

export function updatePurchaseOrderStatus(id: number, status: string) {
  return db
    .update(purchaseOrders)
    .set({ status, updatedAt: new Date() })
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

    if (!order || order.stockUpdated) return null;

    const items = await tx
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.orderId, id));

    for (const item of items) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${item.quantity}`, updatedAt: new Date() })
        .where(eq(products.id, item.productId));
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
