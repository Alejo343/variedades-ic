import { db } from "../index";
import { purchaseOrders, purchasePayments, cashAccounts, distributors } from "../schema";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";
import type { PurchasePaymentInput } from "@/lib/validations";
import { deductStock } from "@/lib/domain/stock";
import { recordCashMovement } from "./cash";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getPurchaseOrderBalance(dbOrTx: typeof db | Tx, purchaseOrderId: number) {
  const [order] = await dbOrTx
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, purchaseOrderId))
    .limit(1);

  if (!order) return null;

  const [row] = await dbOrTx
    .select({ totalPaid: sql<string>`COALESCE(SUM(${purchasePayments.amount}), 0)` })
    .from(purchasePayments)
    .where(eq(purchasePayments.purchaseOrderId, purchaseOrderId));

  const totalCost = order.totalCost ?? 0;
  const totalPaid = Number(row.totalPaid);

  return {
    purchaseOrderId,
    purchaseType: order.purchaseType,
    status: order.status,
    totalCost,
    totalPaid,
    pending: totalCost - totalPaid,
  };
}

export function getPaymentsForOrder(purchaseOrderId: number) {
  return db
    .select({
      id: purchasePayments.id,
      purchaseOrderId: purchasePayments.purchaseOrderId,
      amount: purchasePayments.amount,
      paidAt: purchasePayments.paidAt,
      accountId: purchasePayments.accountId,
      accountName: cashAccounts.name,
      notes: purchasePayments.notes,
      createdAt: purchasePayments.createdAt,
    })
    .from(purchasePayments)
    .leftJoin(cashAccounts, eq(purchasePayments.accountId, cashAccounts.id))
    .where(eq(purchasePayments.purchaseOrderId, purchaseOrderId))
    .orderBy(desc(purchasePayments.paidAt));
}

export type CreatePaymentResult =
  | { ok: true; payment: typeof purchasePayments.$inferSelect }
  | { ok: false; error: string };

export async function createPurchasePayment(
  purchaseOrderId: number,
  data: PurchasePaymentInput,
): Promise<CreatePaymentResult> {
  try {
    return await db.transaction(async (tx) => {
      const balance = await getPurchaseOrderBalance(tx, purchaseOrderId);
      if (!balance) return { ok: false, error: "Pedido no encontrado" };
      if (balance.purchaseType !== "credito") {
        return { ok: false, error: "Este pedido no es a crédito" };
      }
      if (balance.status === "cancelado") {
        return { ok: false, error: "No se puede pagar un pedido cancelado" };
      }

      const result = deductStock(balance.pending, data.amount);
      if (!result.ok) {
        return {
          ok: false,
          error: `Saldo insuficiente: hay ${balance.pending} pendiente, se intentó pagar ${data.amount}`,
        };
      }

      const [payment] = await tx
        .insert(purchasePayments)
        .values({
          purchaseOrderId,
          amount: data.amount,
          accountId: data.accountId,
          notes: data.notes ?? null,
        })
        .returning();

      const [order] = await tx
        .select({ distributorId: purchaseOrders.distributorId })
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, purchaseOrderId))
        .limit(1);

      const [distributor] = order?.distributorId
        ? await tx.select({ name: distributors.name }).from(distributors).where(eq(distributors.id, order.distributorId)).limit(1)
        : [null];

      await recordCashMovement(tx, {
        type: "gasto",
        amount: data.amount,
        concept: `Pago a distribuidor${distributor ? ` ${distributor.name}` : ""} — pedido #${purchaseOrderId}`,
        accountId: data.accountId,
        sourceType: "purchase_payment",
        sourceId: payment.id,
      });

      return { ok: true, payment };
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getAccountsPayableSummary() {
  const creditRows = await db
    .select({
      distributorId: purchaseOrders.distributorId,
      totalCost: sql<string>`COALESCE(SUM(${purchaseOrders.totalCost}), 0)`,
    })
    .from(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.purchaseType, "credito"),
        isNotNull(purchaseOrders.distributorId),
        sql`${purchaseOrders.status} <> 'cancelado'`,
      ),
    )
    .groupBy(purchaseOrders.distributorId);

  const paidRows = await db
    .select({
      distributorId: purchaseOrders.distributorId,
      totalPaid: sql<string>`COALESCE(SUM(${purchasePayments.amount}), 0)`,
    })
    .from(purchasePayments)
    .innerJoin(purchaseOrders, eq(purchasePayments.purchaseOrderId, purchaseOrders.id))
    .where(and(isNotNull(purchaseOrders.distributorId), sql`${purchaseOrders.status} <> 'cancelado'`))
    .groupBy(purchaseOrders.distributorId);

  const paidMap = new Map(paidRows.map((r) => [r.distributorId, Number(r.totalPaid)]));

  const balances = new Map<number, number>();
  for (const row of creditRows) {
    if (row.distributorId === null) continue;
    const pending = Number(row.totalCost) - (paidMap.get(row.distributorId) ?? 0);
    if (pending > 0) balances.set(row.distributorId, pending);
  }

  return balances;
}
