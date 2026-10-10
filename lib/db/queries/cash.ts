import { db } from "../index";
import { cashMovements, cashAccounts } from "../schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import type { CashMovementInput, CashTransferInput } from "@/lib/validations";
import { CASH_ADJUSTMENT_SOURCE, planCashTransfer } from "@/lib/domain/cash";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type RecordCashMovementInput = {
  type: "ingreso" | "gasto";
  amount: number;
  concept: string;
  accountId: number;
  sourceType?: string | null;
  sourceId?: number | null;
  notes?: string | null;
};

export function recordCashMovement(dbOrTx: typeof db | Tx, data: RecordCashMovementInput) {
  return dbOrTx
    .insert(cashMovements)
    .values({
      type: data.type,
      amount: data.amount,
      concept: data.concept,
      accountId: data.accountId,
      sourceType: data.sourceType ?? null,
      sourceId: data.sourceId ?? null,
      notes: data.notes ?? null,
    })
    .returning();
}

export function createCashMovement(data: CashMovementInput) {
  const { adjustment, ...movement } = data;
  return recordCashMovement(db, { ...movement, sourceType: adjustment ? CASH_ADJUSTMENT_SOURCE : "manual" });
}

// The two movements of a transfer (lib/domain/cash.ts#planCashTransfer), in
// one transaction. Throws with a readable message when the plan is invalid.
export async function createCashTransfer(data: CashTransferInput) {
  return db.transaction(async (tx) => {
    const accounts = await tx
      .select({ id: cashAccounts.id, name: cashAccounts.name })
      .from(cashAccounts)
      .where(inArray(cashAccounts.id, [data.fromAccountId, data.toAccountId]));
    const from = accounts.find((a) => a.id === data.fromAccountId);
    const to = accounts.find((a) => a.id === data.toAccountId);
    if (!from || !to) throw new Error("Cuenta no encontrada");
    const plan = planCashTransfer({ from, to, amount: data.amount });
    if (!plan.ok) throw new Error(plan.reason);
    const rows = [];
    for (const m of plan.movements) {
      const [row] = await recordCashMovement(tx, { ...m, notes: data.notes ?? null });
      rows.push(row);
    }
    return rows;
  });
}

export function getAllCashMovements() {
  return db
    .select({
      id: cashMovements.id,
      type: cashMovements.type,
      amount: cashMovements.amount,
      concept: cashMovements.concept,
      movementDate: cashMovements.movementDate,
      sourceType: cashMovements.sourceType,
      sourceId: cashMovements.sourceId,
      accountId: cashMovements.accountId,
      accountName: cashAccounts.name,
      notes: cashMovements.notes,
      createdAt: cashMovements.createdAt,
    })
    .from(cashMovements)
    .leftJoin(cashAccounts, eq(cashMovements.accountId, cashAccounts.id))
    .orderBy(desc(cashMovements.movementDate));
}

export async function getCashBalance(): Promise<number> {
  const [row] = await db
    .select({
      balance: sql<string>`COALESCE(SUM(CASE WHEN ${cashMovements.type} = 'ingreso' THEN ${cashMovements.amount} ELSE -${cashMovements.amount} END), 0)`,
    })
    .from(cashMovements);

  return Number(row.balance);
}
