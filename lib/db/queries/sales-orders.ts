import { db } from "../index";
import { salesOrders, salesOrderItems, products } from "../schema";
import { eq, desc } from "drizzle-orm";
import type { SalesOrderInput, SalesOrderItemInput } from "@/lib/validations";

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
