import { db } from "../index";
import { settlements, sellerSales, sellerLosses, sellerLossItems, sellers } from "../schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { calculateSettlement } from "@/lib/domain/settlement";
import { canTransitionSettlement, type SettlementStatus } from "@/lib/domain/settlement-status";
import { recordCashMovement } from "./cash";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function aggregatePeriod(dbOrTx: typeof db | Tx, sellerId: number, periodDate: string) {
  const [salesRow] = await dbOrTx
    .select({
      totalSales: sql<string>`COALESCE(SUM(${sellerSales.totalAmount}), 0)`,
      totalCommission: sql<string>`COALESCE(SUM(${sellerSales.commissionAmount}), 0)`,
    })
    .from(sellerSales)
    .where(
      and(
        eq(sellerSales.sellerId, sellerId),
        sql`DATE(${sellerSales.saleDate}) = ${periodDate}`,
        sql`${sellerSales.settlementId} IS NULL`,
      ),
    );

  const [lossRow] = await dbOrTx
    .select({
      totalLosses: sql<string>`COALESCE(SUM(${sellerLossItems.quantity} * ${sellerLossItems.unitCost}), 0)`,
    })
    .from(sellerLossItems)
    .leftJoin(sellerLosses, eq(sellerLossItems.lossId, sellerLosses.id))
    .where(and(eq(sellerLosses.sellerId, sellerId), sql`DATE(${sellerLosses.lossDate}) = ${periodDate}`));

  return {
    totalSales: Number(salesRow.totalSales),
    totalCommission: Number(salesRow.totalCommission),
    totalLosses: Number(lossRow.totalLosses),
  };
}

export async function previewSettlement(sellerId: number, periodDate: string) {
  const totals = await aggregatePeriod(db, sellerId, periodDate);
  const { amountDue } = calculateSettlement(totals);
  return { ...totals, amountDue };
}

export type CreateSettlementResult =
  | { ok: true; settlement: typeof settlements.$inferSelect }
  | { ok: false; error: string };

export async function createSettlement(sellerId: number, periodDate: string): Promise<CreateSettlementResult> {
  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(settlements)
        .where(and(eq(settlements.sellerId, sellerId), eq(settlements.periodDate, periodDate)))
        .limit(1);
      if (existing) return { ok: false, error: "Ya existe una liquidación para este vendedor en esta fecha" };

      const totals = await aggregatePeriod(tx, sellerId, periodDate);
      const { amountDue } = calculateSettlement(totals);

      const [settlement] = await tx
        .insert(settlements)
        .values({
          sellerId,
          periodDate,
          totalSales: totals.totalSales,
          totalCommission: totals.totalCommission,
          totalLosses: totals.totalLosses,
          amountDue,
        })
        .returning();

      await tx
        .update(sellerSales)
        .set({ settlementId: settlement.id })
        .where(
          and(
            eq(sellerSales.sellerId, sellerId),
            sql`DATE(${sellerSales.saleDate}) = ${periodDate}`,
            sql`${sellerSales.settlementId} IS NULL`,
          ),
        );

      return { ok: true, settlement };
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function markSettlementLiquidada(id: number): Promise<CreateSettlementResult> {
  try {
    return await db.transaction(async (tx) => {
      const [settlement] = await tx.select().from(settlements).where(eq(settlements.id, id)).limit(1);
      if (!settlement) return { ok: false, error: "No encontrado" };

      if (!canTransitionSettlement(settlement.status as SettlementStatus, "liquidada")) {
        return { ok: false, error: `No se puede liquidar una liquidación en estado '${settlement.status}'` };
      }

      const [updated] = await tx
        .update(settlements)
        .set({ status: "liquidada", settledAt: new Date() })
        .where(eq(settlements.id, id))
        .returning();

      if (updated.amountDue > 0) {
        await recordCashMovement(tx, {
          type: "ingreso",
          amount: updated.amountDue,
          concept: `Liquidación vendedor #${updated.sellerId} — ${updated.periodDate}`,
          sourceType: "settlement",
          sourceId: updated.id,
        });
      }

      return { ok: true, settlement: updated };
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function getAllSettlements() {
  return db
    .select({
      id: settlements.id,
      sellerId: settlements.sellerId,
      sellerName: sellers.name,
      periodDate: settlements.periodDate,
      totalSales: settlements.totalSales,
      totalCommission: settlements.totalCommission,
      totalLosses: settlements.totalLosses,
      amountDue: settlements.amountDue,
      status: settlements.status,
      settledAt: settlements.settledAt,
    })
    .from(settlements)
    .leftJoin(sellers, eq(settlements.sellerId, sellers.id))
    .orderBy(desc(settlements.periodDate));
}
