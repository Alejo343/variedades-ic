import { db } from "../index";
import { inventoryMovements, products } from "../schema";
import { and, eq, sql } from "drizzle-orm";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getSellerBalance(dbOrTx: typeof db | Tx, sellerId: number, productId: number): Promise<number> {
  const [row] = await dbOrTx
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
      productPrice: products.price,
      quantity: sql<string>`SUM(${inventoryMovements.quantityDelta})`,
    })
    .from(inventoryMovements)
    .leftJoin(products, eq(inventoryMovements.productId, products.id))
    .where(and(eq(inventoryMovements.ownerType, "seller"), eq(inventoryMovements.sellerId, sellerId)))
    .groupBy(inventoryMovements.productId, products.name, products.price)
    .having(sql`SUM(${inventoryMovements.quantityDelta}) > 0`);

  return rows.map((r) => ({ ...r, quantity: Number(r.quantity) }));
}
