import { db } from "../index";
import { sellerSales, sellerSaleItems, inventoryMovements, products, sellers } from "../schema";
import { eq, desc, sql } from "drizzle-orm";
import type { SellerSaleInput } from "@/lib/validations";
import { deductStock } from "@/lib/domain/stock";
import { calculateCommission, type CommissionConfig } from "@/lib/domain/commission";
import { getSellerBalance } from "./seller-inventory";

export type CreateSellerSaleResult =
  | { ok: true; sale: typeof sellerSales.$inferSelect }
  | { ok: false; error: string };

export function getAllSellerSales() {
  return db
    .select({
      id: sellerSales.id,
      sellerId: sellerSales.sellerId,
      sellerName: sellers.name,
      saleDate: sellerSales.saleDate,
      totalAmount: sellerSales.totalAmount,
      commissionAmount: sellerSales.commissionAmount,
      notes: sellerSales.notes,
    })
    .from(sellerSales)
    .leftJoin(sellers, eq(sellerSales.sellerId, sellers.id))
    .orderBy(desc(sellerSales.saleDate));
}

export async function getSellerSaleById(id: number) {
  const [sale] = await db
    .select({
      id: sellerSales.id,
      sellerId: sellerSales.sellerId,
      sellerName: sellers.name,
      saleDate: sellerSales.saleDate,
      totalAmount: sellerSales.totalAmount,
      commissionAmount: sellerSales.commissionAmount,
      notes: sellerSales.notes,
    })
    .from(sellerSales)
    .leftJoin(sellers, eq(sellerSales.sellerId, sellers.id))
    .where(eq(sellerSales.id, id))
    .limit(1);

  if (!sale) return null;

  const items = await db
    .select({
      id: sellerSaleItems.id,
      saleId: sellerSaleItems.saleId,
      productId: sellerSaleItems.productId,
      quantity: sellerSaleItems.quantity,
      unitPrice: sellerSaleItems.unitPrice,
      subtotal: sellerSaleItems.subtotal,
      productName: products.name,
    })
    .from(sellerSaleItems)
    .leftJoin(products, eq(sellerSaleItems.productId, products.id))
    .where(eq(sellerSaleItems.saleId, id));

  return { ...sale, items };
}

export async function getSellerSalesSummary() {
  const rows = await db
    .select({
      sellerId: sellerSales.sellerId,
      sellerName: sellers.name,
      count: sql<string>`COUNT(*)`,
      totalAmount: sql<string>`COALESCE(SUM(${sellerSales.totalAmount}), 0)`,
      totalCommission: sql<string>`COALESCE(SUM(${sellerSales.commissionAmount}), 0)`,
    })
    .from(sellerSales)
    .leftJoin(sellers, eq(sellerSales.sellerId, sellers.id))
    .groupBy(sellerSales.sellerId, sellers.name);

  return rows.map((r) => ({
    ...r,
    count: Number(r.count),
    totalAmount: Number(r.totalAmount),
    totalCommission: Number(r.totalCommission),
  }));
}

export async function createSellerSale(data: SellerSaleInput): Promise<CreateSellerSaleResult> {
  try {
    return await db.transaction(async (tx) => {
      const [seller] = await tx.select().from(sellers).where(eq(sellers.id, data.sellerId)).limit(1);
      if (!seller) return { ok: false, error: "Vendedor no encontrado" };

      for (const item of data.items) {
        const balance = await getSellerBalance(tx, data.sellerId, item.productId);
        const result = deductStock(balance, item.quantity);
        if (!result.ok) return { ok: false, error: `Producto ${item.productId}: ${result.reason}` };
      }

      const [sale] = await tx
        .insert(sellerSales)
        .values({ sellerId: data.sellerId, totalAmount: 0, commissionAmount: 0, notes: data.notes ?? null })
        .returning();

      let totalAmount = 0;
      let totalQuantity = 0;

      for (const item of data.items) {
        const subtotal = item.quantity * item.unitPrice;
        totalAmount += subtotal;
        totalQuantity += item.quantity;

        await tx.insert(inventoryMovements).values({
          productId: item.productId,
          ownerType: "seller",
          sellerId: data.sellerId,
          type: "venta",
          quantityDelta: -item.quantity,
          unitCost: item.unitPrice,
          sourceType: "seller_sale",
          sourceId: sale.id,
        });

        await tx.insert(sellerSaleItems).values({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal,
        });
      }

      const commissionConfig: CommissionConfig =
        seller.commissionType === "percentage"
          ? { type: "percentage", value: seller.commissionValue }
          : { type: "fixed_per_unit", value: seller.commissionValue };
      const commissionAmount = calculateCommission(commissionConfig, totalAmount, totalQuantity);

      const [updated] = await tx
        .update(sellerSales)
        .set({ totalAmount, commissionAmount })
        .where(eq(sellerSales.id, sale.id))
        .returning();

      return { ok: true, sale: updated };
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
