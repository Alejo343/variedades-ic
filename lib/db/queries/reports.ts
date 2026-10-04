import { db } from "../index";
import {
  products,
  purchaseOrders,
  distributors,
  salesOrders,
  salesOrderItems,
  directSales,
  directSaleItems,
  sellerSales,
  sellerSaleItems,
} from "../schema";
import { and, desc, eq, gte, lte, ne, inArray, sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

function dateRangeConditions(column: AnyColumn, from?: string, to?: string): SQL[] {
  const conditions: SQL[] = [];
  if (from) conditions.push(gte(column, new Date(from)));
  if (to) conditions.push(lte(column, new Date(`${to}T23:59:59.999`)));
  return conditions;
}

export async function getInventorySummary() {
  const [row] = await db
    .select({
      activeProducts: sql<string>`COUNT(*) FILTER (WHERE ${products.active} = true)`,
      totalUnits: sql<string>`COALESCE(SUM(${products.stock}) FILTER (WHERE ${products.active} = true), 0)`,
      totalValue: sql<string>`COALESCE(SUM(${products.stock} * ${products.purchasePrice}) FILTER (WHERE ${products.active} = true), 0)`,
    })
    .from(products);

  return {
    activeProducts: Number(row.activeProducts),
    totalUnits: Number(row.totalUnits),
    totalValue: Number(row.totalValue),
  };
}

export async function getPurchasesReport(from?: string, to?: string) {
  const conditions = [ne(purchaseOrders.status, "cancelado"), ...dateRangeConditions(purchaseOrders.orderDate, from, to)];

  const rows = await db
    .select({
      distributorId: purchaseOrders.distributorId,
      distributorName: distributors.name,
      count: sql<string>`COUNT(*)`,
      total: sql<string>`COALESCE(SUM(${purchaseOrders.totalCost}), 0)`,
    })
    .from(purchaseOrders)
    .leftJoin(distributors, eq(purchaseOrders.distributorId, distributors.id))
    .where(and(...conditions))
    .groupBy(purchaseOrders.distributorId, distributors.name)
    .orderBy(desc(sql`COALESCE(SUM(${purchaseOrders.totalCost}), 0)`));

  const byDistributor = rows.map((r) => ({
    distributorId: r.distributorId,
    distributorName: r.distributorName,
    count: Number(r.count),
    total: Number(r.total),
  }));

  return {
    totalCount: byDistributor.reduce((s, r) => s + r.count, 0),
    totalAmount: byDistributor.reduce((s, r) => s + r.total, 0),
    byDistributor,
  };
}

type ChannelTotal = { count: number; total: number };

export async function getSalesReport(from?: string, to?: string) {
  const whatsappConds = [
    inArray(salesOrders.status, ["confirmado", "entregado"]),
    ...dateRangeConditions(salesOrders.createdAt, from, to),
  ];
  const localConds = dateRangeConditions(directSales.saleDate, from, to);
  const sellerConds = dateRangeConditions(sellerSales.saleDate, from, to);

  const [[whatsapp], [local], [seller]] = await Promise.all([
    db
      .select({ count: sql<string>`COUNT(*)`, total: sql<string>`COALESCE(SUM(${salesOrders.totalPrice}), 0)` })
      .from(salesOrders)
      .where(and(...whatsappConds)),
    db
      .select({ count: sql<string>`COUNT(*)`, total: sql<string>`COALESCE(SUM(${directSales.totalAmount}), 0)` })
      .from(directSales)
      .where(localConds.length ? and(...localConds) : undefined),
    db
      .select({ count: sql<string>`COUNT(*)`, total: sql<string>`COALESCE(SUM(${sellerSales.totalAmount}), 0)` })
      .from(sellerSales)
      .where(sellerConds.length ? and(...sellerConds) : undefined),
  ]);

  const byChannel: Record<"whatsapp" | "local" | "seller", ChannelTotal> = {
    whatsapp: { count: Number(whatsapp.count), total: Number(whatsapp.total) },
    local: { count: Number(local.count), total: Number(local.total) },
    seller: { count: Number(seller.count), total: Number(seller.total) },
  };

  return {
    totalCount: byChannel.whatsapp.count + byChannel.local.count + byChannel.seller.count,
    totalAmount: byChannel.whatsapp.total + byChannel.local.total + byChannel.seller.total,
    byChannel,
  };
}

export async function getProfitReport(from?: string, to?: string) {
  const whatsappCogsConds = [
    inArray(salesOrders.status, ["confirmado", "entregado"]),
    ...dateRangeConditions(salesOrders.createdAt, from, to),
  ];
  const localCogsConds = dateRangeConditions(directSales.saleDate, from, to);
  const sellerCogsConds = dateRangeConditions(sellerSales.saleDate, from, to);

  const [sales, [whatsappRow], [localRow], [sellerRow]] = await Promise.all([
    getSalesReport(from, to),
    db
      .select({ cogs: sql<string>`COALESCE(SUM(${salesOrderItems.quantity} * ${products.purchasePrice}), 0)` })
      .from(salesOrderItems)
      .innerJoin(salesOrders, eq(salesOrderItems.orderId, salesOrders.id))
      .innerJoin(products, eq(salesOrderItems.productId, products.id))
      .where(and(...whatsappCogsConds)),
    db
      .select({ cogs: sql<string>`COALESCE(SUM(${directSaleItems.quantity} * ${products.purchasePrice}), 0)` })
      .from(directSaleItems)
      .innerJoin(directSales, eq(directSaleItems.saleId, directSales.id))
      .innerJoin(products, eq(directSaleItems.productId, products.id))
      .where(localCogsConds.length ? and(...localCogsConds) : undefined),
    db
      .select({ cogs: sql<string>`COALESCE(SUM(${sellerSaleItems.quantity} * ${products.purchasePrice}), 0)` })
      .from(sellerSaleItems)
      .innerJoin(sellerSales, eq(sellerSaleItems.saleId, sellerSales.id))
      .innerJoin(products, eq(sellerSaleItems.productId, products.id))
      .where(sellerCogsConds.length ? and(...sellerCogsConds) : undefined),
  ]);

  const cogs = Number(whatsappRow.cogs) + Number(localRow.cogs) + Number(sellerRow.cogs);

  return { revenue: sales.totalAmount, cogs, profit: sales.totalAmount - cogs };
}

export type DailySalesPoint = { date: string; whatsapp: number; local: number; seller: number };

/**
 * Sales per calendar day and channel over [from, to] (YYYY-MM-DD, inclusive),
 * with the same channel rules as getSalesReport (WhatsApp counts only
 * confirmado/entregado). Days without sales are filled with zeros so the
 * caller gets one point per day in order.
 */
export async function getDailySales(from: string, to: string): Promise<DailySalesPoint[]> {
  const day = (col: AnyColumn) => sql<string>`to_char(${col}, 'YYYY-MM-DD')`;

  const [whatsappRows, localRows, sellerRows] = await Promise.all([
    db
      .select({ day: day(salesOrders.createdAt), total: sql<string>`COALESCE(SUM(${salesOrders.totalPrice}), 0)` })
      .from(salesOrders)
      .where(and(inArray(salesOrders.status, ["confirmado", "entregado"]), ...dateRangeConditions(salesOrders.createdAt, from, to)))
      .groupBy(day(salesOrders.createdAt)),
    db
      .select({ day: day(directSales.saleDate), total: sql<string>`COALESCE(SUM(${directSales.totalAmount}), 0)` })
      .from(directSales)
      .where(and(...dateRangeConditions(directSales.saleDate, from, to)))
      .groupBy(day(directSales.saleDate)),
    db
      .select({ day: day(sellerSales.saleDate), total: sql<string>`COALESCE(SUM(${sellerSales.totalAmount}), 0)` })
      .from(sellerSales)
      .where(and(...dateRangeConditions(sellerSales.saleDate, from, to)))
      .groupBy(day(sellerSales.saleDate)),
  ]);

  const toMap = (rows: { day: string; total: string }[]) => new Map(rows.map((r) => [r.day, Number(r.total)]));
  const w = toMap(whatsappRows);
  const l = toMap(localRows);
  const s = toMap(sellerRows);

  const points: DailySalesPoint[] = [];
  const [fy, fm, fd] = from.split("-").map(Number);
  const cursor = new Date(Date.UTC(fy, fm - 1, fd));
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (key > to) break;
    points.push({ date: key, whatsapp: w.get(key) ?? 0, local: l.get(key) ?? 0, seller: s.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}
