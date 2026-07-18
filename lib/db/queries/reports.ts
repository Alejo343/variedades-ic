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
