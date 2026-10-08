import { db } from "../index";
import { inventoryMovements, products, sellers } from "../schema";
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

// Whether the seller still holds (or owes, if negative) any consigned unit.
// A seller can only become a 'store' seller with an empty consignment ledger —
// otherwise those units would be stranded where no screen shows them.
export async function hasConsignedStock(dbOrTx: typeof db | Tx, sellerId: number): Promise<boolean> {
  const rows = await dbOrTx
    .select({ productId: inventoryMovements.productId })
    .from(inventoryMovements)
    .where(and(eq(inventoryMovements.ownerType, "seller"), eq(inventoryMovements.sellerId, sellerId)))
    .groupBy(inventoryMovements.productId)
    .having(sql`SUM(${inventoryMovements.quantityDelta}) <> 0`)
    .limit(1);
  return rows.length > 0;
}

export const CONSIGNED_STOCK_BLOCKS_STORE_MODE =
  "Este vendedor todavía tiene inventario en consignación. Registra la devolución antes de pasarlo a vendedor de tienda.";
export const STORE_SELLER_NO_DELIVERIES = "Un vendedor de tienda vende del inventario principal: no se le entrega mercancía.";

export async function getSellerInventory(sellerId: number) {
  const rows = await db
    .select({
      productId: inventoryMovements.productId,
      productName: products.name,
      productPrice: products.price,
      productPurchasePrice: products.purchasePrice,
      quantity: sql<string>`SUM(${inventoryMovements.quantityDelta})`,
    })
    .from(inventoryMovements)
    .leftJoin(products, eq(inventoryMovements.productId, products.id))
    .where(and(eq(inventoryMovements.ownerType, "seller"), eq(inventoryMovements.sellerId, sellerId)))
    .groupBy(inventoryMovements.productId, products.name, products.price, products.purchasePrice)
    .having(sql`SUM(${inventoryMovements.quantityDelta}) > 0`);

  return rows.map((r) => ({ ...r, quantity: Number(r.quantity) }));
}

export async function getAllSellersInventory() {
  const rows = await db
    .select({
      sellerId: inventoryMovements.sellerId,
      sellerName: sellers.name,
      productId: inventoryMovements.productId,
      productName: products.name,
      quantity: sql<string>`SUM(${inventoryMovements.quantityDelta})`,
    })
    .from(inventoryMovements)
    .leftJoin(products, eq(inventoryMovements.productId, products.id))
    .leftJoin(sellers, eq(inventoryMovements.sellerId, sellers.id))
    .where(eq(inventoryMovements.ownerType, "seller"))
    .groupBy(inventoryMovements.sellerId, sellers.name, inventoryMovements.productId, products.name)
    .having(sql`SUM(${inventoryMovements.quantityDelta}) > 0`);

  return rows.map((r) => ({ ...r, quantity: Number(r.quantity) }));
}
