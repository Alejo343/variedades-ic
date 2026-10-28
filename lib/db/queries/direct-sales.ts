import { db } from "../index";
import { directSales, directSaleItems, products, cashAccounts, sellers, sellerSaleItems } from "../schema";
import { eq, desc } from "drizzle-orm";
import type { DirectSaleInput } from "@/lib/validations";
import { recordPrincipalMovement } from "./inventory";
import { recordCashMovement } from "./cash";

export type CreateDirectSaleResult =
  | { ok: true; sale: typeof directSales.$inferSelect }
  | { ok: false; error: string };

/** One product line of a sale, as the sales lists show it expanded. */
export type SaleLine = { productId: number; productName: string | null; sku: string | null; quantity: number; unitPrice: number; subtotal: number };

function groupBySale(rows: (SaleLine & { saleId: number })[]): Map<number, SaleLine[]> {
  const bySale = new Map<number, SaleLine[]>();
  for (const { saleId, ...line } of rows) bySale.set(saleId, [...(bySale.get(saleId) ?? []), line]);
  return bySale;
}

/** Every in-store sale's products, by sale id (the list's expandable rows). */
export async function getDirectSaleLines(): Promise<Map<number, SaleLine[]>> {
  const rows = await db
    .select({
      saleId: directSaleItems.saleId,
      productId: directSaleItems.productId,
      productName: products.name,
      sku: products.sku,
      quantity: directSaleItems.quantity,
      unitPrice: directSaleItems.unitPrice,
      subtotal: directSaleItems.subtotal,
    })
    .from(directSaleItems)
    .leftJoin(products, eq(directSaleItems.productId, products.id))
    .orderBy(directSaleItems.id);
  return groupBySale(rows);
}

/** Same as getDirectSaleLines, for consignment sales. */
export async function getSellerSaleLines(): Promise<Map<number, SaleLine[]>> {
  const rows = await db
    .select({
      saleId: sellerSaleItems.saleId,
      productId: sellerSaleItems.productId,
      productName: products.name,
      sku: products.sku,
      quantity: sellerSaleItems.quantity,
      unitPrice: sellerSaleItems.unitPrice,
      subtotal: sellerSaleItems.subtotal,
    })
    .from(sellerSaleItems)
    .leftJoin(products, eq(sellerSaleItems.productId, products.id))
    .orderBy(sellerSaleItems.id);
  return groupBySale(rows);
}

export function getAllDirectSales() {
  return db
    .select({
      id: directSales.id,
      saleDate: directSales.saleDate,
      totalAmount: directSales.totalAmount,
      accountId: directSales.accountId,
      accountName: cashAccounts.name,
      sellerId: directSales.sellerId,
      sellerName: sellers.name,
      commissionAmount: directSales.commissionAmount,
      commissionPaymentId: directSales.commissionPaymentId,
      voidedAt: directSales.voidedAt,
      voidReason: directSales.voidReason,
      notes: directSales.notes,
      createdAt: directSales.createdAt,
    })
    .from(directSales)
    .leftJoin(cashAccounts, eq(directSales.accountId, cashAccounts.id))
    .leftJoin(sellers, eq(directSales.sellerId, sellers.id))
    .orderBy(desc(directSales.saleDate));
}

export async function getDirectSaleById(id: number) {
  const [sale] = await db.select().from(directSales).where(eq(directSales.id, id)).limit(1);

  if (!sale) return null;

  const items = await db
    .select({
      id: directSaleItems.id,
      saleId: directSaleItems.saleId,
      productId: directSaleItems.productId,
      quantity: directSaleItems.quantity,
      unitPrice: directSaleItems.unitPrice,
      subtotal: directSaleItems.subtotal,
      productName: products.name,
    })
    .from(directSaleItems)
    .leftJoin(products, eq(directSaleItems.productId, products.id))
    .where(eq(directSaleItems.saleId, id));

  return { ...sale, items };
}

export async function createDirectSale(data: DirectSaleInput): Promise<CreateDirectSaleResult> {
  try {
    return await db.transaction(async (tx) => {
      const [sale] = await tx
        .insert(directSales)
        .values({ totalAmount: 0, accountId: data.accountId, notes: data.notes ?? null })
        .returning();

      let totalAmount = 0;

      for (const item of data.items) {
        const result = await recordPrincipalMovement(tx, {
          productId: item.productId,
          type: "venta",
          quantityDelta: -item.quantity,
          unitCost: item.unitPrice,
          sourceType: "direct_sale",
          sourceId: sale.id,
        });
        if (!result.ok) throw new Error(result.error);

        const subtotal = item.quantity * item.unitPrice;
        totalAmount += subtotal;

        await tx.insert(directSaleItems).values({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal,
        });
      }

      const [updated] = await tx
        .update(directSales)
        .set({ totalAmount })
        .where(eq(directSales.id, sale.id))
        .returning();

      if (totalAmount > 0) {
        await recordCashMovement(tx, {
          type: "ingreso",
          amount: totalAmount,
          concept: `Venta en local #${sale.id}`,
          accountId: data.accountId,
          sourceType: "direct_sale",
          sourceId: sale.id,
        });
      }

      return { ok: true, sale: updated };
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
