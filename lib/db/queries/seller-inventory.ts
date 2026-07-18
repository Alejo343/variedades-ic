import { db } from "../index";
import { inventoryMovements, products } from "../schema";
import { and, eq, sql } from "drizzle-orm";

export async function getSellerBalance(sellerId: number, productId: number): Promise<number> {
  const [row] = await db
    .select({ balance: sql<string>`COALESCE(SUM(${inventoryMovements.quantityDelta}), 0)` })
    .from(inventoryMovements)
    .where(
      and(
        eq(inventoryMovements.ownerType, "seller"),
        eq(inventoryMovements.sellerId, sellerId),
        eq(inventoryMovements.productId, productId),
      ),
    );

  return Number(row.balance);
}

export async function getSellerInventory(sellerId: number) {
  const rows = await db
    .select({
      productId: inventoryMovements.productId,
      productName: products.name,
      quantity: sql<string>`SUM(${inventoryMovements.quantityDelta})`,
    })
    .from(inventoryMovements)
    .leftJoin(products, eq(inventoryMovements.productId, products.id))
    .where(and(eq(inventoryMovements.ownerType, "seller"), eq(inventoryMovements.sellerId, sellerId)))
    .groupBy(inventoryMovements.productId, products.name)
    .having(sql`SUM(${inventoryMovements.quantityDelta}) > 0`);

  return rows.map((r) => ({ ...r, quantity: Number(r.quantity) }));
}
