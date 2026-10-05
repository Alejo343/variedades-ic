import { db } from "../index";
import { cashMovements, cashAccounts } from "../schema";
import { desc, eq, sql } from "drizzle-orm";
import type { CashMovementInput } from "@/lib/validations";
import { CASH_ADJUSTMENT_SOURCE } from "@/lib/domain/cash";

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
