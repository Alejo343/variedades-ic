import { db } from "../index";
import { cashMovements } from "../schema";
import { desc, sql } from "drizzle-orm";
import type { CashMovementInput } from "@/lib/validations";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type RecordCashMovementInput = {
  type: "ingreso" | "gasto";
  amount: number;
  concept: string;
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
      sourceType: data.sourceType ?? null,
      sourceId: data.sourceId ?? null,
      notes: data.notes ?? null,
    })
    .returning();
}

export function createCashMovement(data: CashMovementInput) {
  return recordCashMovement(db, { ...data, sourceType: "manual" });
}

export function getAllCashMovements() {
  return db.select().from(cashMovements).orderBy(desc(cashMovements.movementDate));
}

export async function getCashBalance(): Promise<number> {
  const [row] = await db
    .select({
      balance: sql<string>`COALESCE(SUM(CASE WHEN ${cashMovements.type} = 'ingreso' THEN ${cashMovements.amount} ELSE -${cashMovements.amount} END), 0)`,
    })
    .from(cashMovements);

  return Number(row.balance);
}
