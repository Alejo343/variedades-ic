import { db } from "../index";
import { settlements, sellerSales, sellerLosses, sellerLossItems, sellers } from "../schema";
import { and, eq, desc, isNull, sql } from "drizzle-orm";
import { calculateSettlement } from "@/lib/domain/settlement";
import { canTransitionSettlement, type SettlementStatus } from "@/lib/domain/settlement-status";
import { recordCashMovement } from "./cash";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// A settlement charges everything the seller still owes UP TO its date: every
// sale and loss on or before periodDate that no earlier settlement included.
// Anything that reached the server late (a phone that synced after the day
// was settled) lands in the next settlement instead of being lost, and the
// settlement_id marks (markIncludedInSettlement) keep anything from being
// charged twice. Shared with the sync push (lib/sync/operations).
const pendingSales = (sellerId: number, periodDate: string) =>
  and(eq(sellerSales.sellerId, sellerId), sql`DATE(${sellerSales.saleDate}) <= ${periodDate}`, isNull(sellerSales.settlementId));
const pendingLosses = (sellerId: number, periodDate: string) =>
  and(eq(sellerLosses.sellerId, sellerId), sql`DATE(${sellerLosses.lossDate}) <= ${periodDate}`, isNull(sellerLosses.settlementId));

export async function aggregatePeriod(dbOrTx: typeof db | Tx, sellerId: number, periodDate: string) {
  const [salesRow] = await dbOrTx
    .select({
      totalSales: sql<string>`COALESCE(SUM(${sellerSales.totalAmount}), 0)`,
      totalCommission: sql<string>`COALESCE(SUM(${sellerSales.commissionAmount}), 0)`,
    })
    .from(sellerSales)
    .where(pendingSales(sellerId, periodDate));

  const [lossRow] = await dbOrTx
    .select({
      totalLosses: sql<string>`COALESCE(SUM(${sellerLossItems.quantity} * ${sellerLossItems.unitCost}), 0)`,
    })
    .from(sellerLossItems)
    .innerJoin(sellerLosses, eq(sellerLossItems.lossId, sellerLosses.id))
    .where(pendingLosses(sellerId, periodDate));

  return {
    totalSales: Number(salesRow.totalSales),
    totalCommission: Number(salesRow.totalCommission),
    totalLosses: Number(lossRow.totalLosses),
  };
}

export async function markIncludedInSettlement(tx: Tx, sellerId: number, periodDate: string, settlementId: number) {
  await tx.update(sellerSales).set({ settlementId }).where(pendingSales(sellerId, periodDate));
  await tx.update(sellerLosses).set({ settlementId }).where(pendingLosses(sellerId, periodDate));
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

      await markIncludedInSettlement(tx, sellerId, periodDate, settlement.id);

      return { ok: true, settlement };
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function markSettlementLiquidada(id: number, accountId: number): Promise<CreateSettlementResult> {
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
          accountId,
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
