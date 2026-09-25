import { db } from "../index";
import { cashAccounts, cashMovements } from "../schema";
import { eq, sql } from "drizzle-orm";
import type { CashAccountInput } from "@/lib/validations";

export function getAllCashAccounts() {
  return db.select().from(cashAccounts).orderBy(cashAccounts.name);
}

export function getActiveCashAccounts() {
  return db.select().from(cashAccounts).where(eq(cashAccounts.active, true)).orderBy(cashAccounts.name);
}

export function getCashAccountById(id: number) {
  return db.select().from(cashAccounts).where(eq(cashAccounts.id, id)).limit(1);
}

export function createCashAccount(data: CashAccountInput) {
  return db.insert(cashAccounts).values(data).returning();
}

export function updateCashAccount(id: number, data: Partial<CashAccountInput>) {
  return db.update(cashAccounts).set(data).where(eq(cashAccounts.id, id)).returning();
}

export function deleteCashAccount(id: number) {
  return db.update(cashAccounts).set({ active: false }).where(eq(cashAccounts.id, id)).returning();
}

export async function getCashAccountsWithBalances() {
  const rows = await db
    .select({
      id: cashAccounts.id,
      name: cashAccounts.name,
      type: cashAccounts.type,
      active: cashAccounts.active,
      balance: sql<string>`COALESCE(SUM(CASE WHEN ${cashMovements.type} = 'ingreso' THEN ${cashMovements.amount} ELSE -${cashMovements.amount} END), 0)`,
    })
    .from(cashAccounts)
    .leftJoin(cashMovements, eq(cashMovements.accountId, cashAccounts.id))
    .groupBy(cashAccounts.id, cashAccounts.name, cashAccounts.type, cashAccounts.active)
    .orderBy(cashAccounts.name);

  return rows.map((r) => ({ ...r, balance: Number(r.balance) }));
}
