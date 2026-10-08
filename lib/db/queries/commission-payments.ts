import { and, desc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "../index";
import { cashAccounts, cashMovements, commissionPayments, directSales, sellers } from "../schema";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Paying a 'store' seller the commissions of their in-store sales. Same rule as
// settlements: a payment covers EVERY in-store sale of that seller on or before
// periodDate that no earlier payment covered, so a sale that synced late lands
// in the next payment and nothing is paid twice (commission_payment_id).
// Shared by the panel and the sync push (lib/sync/operations).
const pendingSales = (sellerId: number, periodDate: string) =>
  and(eq(directSales.sellerId, sellerId), sql`DATE(${directSales.saleDate}) <= ${periodDate}`, isNull(directSales.commissionPaymentId));

export async function pendingCommission(dbOrTx: typeof db | Tx, sellerId: number, periodDate: string) {
  const [row] = await dbOrTx
    .select({
      saleCount: sql<string>`COUNT(*)`,
      totalCommission: sql<string>`COALESCE(SUM(${directSales.commissionAmount}), 0)`,
    })
    .from(directSales)
    .where(pendingSales(sellerId, periodDate));
  return { saleCount: Number(row.saleCount), totalCommission: Number(row.totalCommission) };
}

export class CommissionPaymentError extends Error {}

export type PayCommissionsInput = {
  sellerId: number;
  periodDate: string;
  accountId: number;
  notes?: string | null;
  // From a phone: the uuids it generated and the real time of the payment.
  uuid?: string;
  cashMovementUuid?: string;
  paidAt?: SQL;
};

// Inside the caller's transaction. Throws CommissionPaymentError when there's
// nothing to pay.
export async function payCommissions(tx: Tx, input: PayCommissionsInput) {
  const [seller] = await tx.select({ name: sellers.name }).from(sellers).where(eq(sellers.id, input.sellerId));
  if (!seller) throw new CommissionPaymentError("Vendedor no encontrado");

  const { saleCount, totalCommission } = await pendingCommission(tx, input.sellerId, input.periodDate);
  if (totalCommission <= 0) throw new CommissionPaymentError("No hay comisiones pendientes hasta esa fecha");

  const paidAt = input.paidAt ?? sql`now()`;
  const [payment] = await tx
    .insert(commissionPayments)
    .values({
      ...(input.uuid ? { uuid: input.uuid } : {}),
      sellerId: input.sellerId,
      periodDate: input.periodDate,
      saleCount,
      totalCommission,
      accountId: input.accountId,
      paidAt,
      notes: input.notes ?? null,
    })
    .returning();

  await tx.update(directSales).set({ commissionPaymentId: payment.id }).where(pendingSales(input.sellerId, input.periodDate));

  await tx.insert(cashMovements).values({
    ...(input.cashMovementUuid ? { uuid: input.cashMovementUuid } : {}),
    type: "gasto",
    amount: totalCommission,
    concept: `Comisiones ${seller.name} hasta ${input.periodDate}`,
    movementDate: paidAt,
    accountId: input.accountId,
    sourceType: "commission_payment",
    sourceId: payment.id,
  });

  return payment;
}

export type CreateCommissionPaymentResult =
  | { ok: true; payment: typeof commissionPayments.$inferSelect }
  | { ok: false; error: string };

export async function createCommissionPayment(input: PayCommissionsInput): Promise<CreateCommissionPaymentResult> {
  try {
    return { ok: true, payment: await db.transaction((tx) => payCommissions(tx, input)) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function getCommissionPaymentsForSeller(sellerId: number) {
  return db
    .select({
      id: commissionPayments.id,
      periodDate: commissionPayments.periodDate,
      saleCount: commissionPayments.saleCount,
      totalCommission: commissionPayments.totalCommission,
      paidAt: commissionPayments.paidAt,
      accountName: cashAccounts.name,
    })
    .from(commissionPayments)
    .leftJoin(cashAccounts, eq(commissionPayments.accountId, cashAccounts.id))
    .where(eq(commissionPayments.sellerId, sellerId))
    .orderBy(desc(commissionPayments.paidAt));
}
