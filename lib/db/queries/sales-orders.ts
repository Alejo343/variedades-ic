import { db } from "../index";
import { salesOrders, salesOrderItems, products } from "../schema";
import { eq, desc, sql } from "drizzle-orm";
import type { SalesOrderInput, SalesOrderItemInput } from "@/lib/validations";
import { canTransitionSalesOrder, type SalesOrderStatus } from "@/lib/domain/order-status";
import { deductStock } from "@/lib/domain/stock";

export type ConfirmSalesOrderResult =
  | { ok: true; order: typeof salesOrders.$inferSelect }
  | { ok: false; error: string };

export function getAllSalesOrders() {
  return db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt));
}

export async function getSalesOrderById(id: number) {
  const [order] = await db
    .select()
    .from(salesOrders)
    .where(eq(salesOrders.id, id))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select({
      id: salesOrderItems.id,
      orderId: salesOrderItems.orderId,
      productId: salesOrderItems.productId,
      quantity: salesOrderItems.quantity,
      unitPrice: salesOrderItems.unitPrice,
      productName: products.name,
    })
    .from(salesOrderItems)
    .leftJoin(products, eq(salesOrderItems.productId, products.id))
    .where(eq(salesOrderItems.orderId, id));

  return { ...order, items };
}

export function createSalesOrder(data: SalesOrderInput) {
  return db.insert(salesOrders).values(data).returning();
}

export function addSalesOrderItem(data: SalesOrderItemInput) {
  return db.insert(salesOrderItems).values(data).returning();
}

export async function confirmSalesOrder(id: number): Promise<ConfirmSalesOrderResult> {
  return await db.transaction(async (tx) => {
    const [order] = await tx.select().from(salesOrders).where(eq(salesOrders.id, id)).limit(1);

    if (!order) return { ok: false, error: "No encontrado" };

    if (!canTransitionSalesOrder(order.status as SalesOrderStatus, "confirmado")) {
      return { ok: false, error: `No se puede confirmar un pedido en estado '${order.status}'` };
    }

    const items = await tx.select().from(salesOrderItems).where(eq(salesOrderItems.orderId, id));

    for (const item of items) {
      const [product] = await tx
        .select({ stock: products.stock, name: products.name })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) return { ok: false, error: `Producto ${item.productId} no encontrado` };

      const result = deductStock(product.stock, item.quantity);
      if (!result.ok) return { ok: false, error: `${product.name}: ${result.reason}` };
    }

    for (const item of items) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: new Date() })
        .where(eq(products.id, item.productId));
    }

    const [updated] = await tx
      .update(salesOrders)
      .set({ status: "confirmado", updatedAt: new Date() })
      .where(eq(salesOrders.id, id))
      .returning();

    return { ok: true, order: updated };
  });
}

export function updateSalesOrder(id: number, data: Partial<SalesOrderInput>) {
  return db
    .update(salesOrders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(salesOrders.id, id))
    .returning();
}

export function deleteSalesOrder(id: number) {
  return db.delete(salesOrders).where(eq(salesOrders.id, id)).returning();
}
