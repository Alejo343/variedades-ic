import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { formatSalaryPeriod, isSalaryPeriodStart, SALARY_PERIOD_ALREADY_PAID, type SalaryPeriod } from "@/lib/domain/salary";
import { db } from "../index";
import { cashAccounts, cashMovements, salaryPayments, sellers } from "../schema";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Paying a salaried store seller one period of their salary (lib/domain/salary.ts).
// Shared by the panel and the sync push (lib/sync/operations/salary.ts).

export class SalaryPaymentError extends Error {}

export type PaySalaryInput = {
  sellerId: number;
  period: SalaryPeriod;
  periodStart: string;
  amount: number;
  accountId: number;
  notes?: string | null;
  // From a phone: the uuids it generated and the real time of the payment.
  uuid?: string;
  cashMovementUuid?: string;
  paidAt?: SQL;
};

// Inside the caller's transaction. Throws SalaryPaymentError when the period
// isn't a real one or is already paid. Not tied to the seller's current pay
// type: a last period may still be paid after they go back to commission.
export async function paySalary(tx: Tx, input: PaySalaryInput) {
  const [seller] = await tx.select({ name: sellers.name }).from(sellers).where(eq(sellers.id, input.sellerId));
  if (!seller) throw new SalaryPaymentError("Vendedor no encontrado");
  if (!isSalaryPeriodStart(input.periodStart, input.period)) {
    throw new SalaryPaymentError(input.period === "weekly" ? "La semana debe empezar en lunes" : "El mes debe empezar el día 1");
  }
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new SalaryPaymentError("El valor debe ser mayor que cero");

  const [existing] = await tx
    .select({ id: salaryPayments.id })
    .from(salaryPayments)
    .where(
      and(eq(salaryPayments.sellerId, input.sellerId), eq(salaryPayments.period, input.period), eq(salaryPayments.periodStart, input.periodStart)),
    );
  if (existing) throw new SalaryPaymentError(SALARY_PERIOD_ALREADY_PAID);

  const paidAt = input.paidAt ?? sql`now()`;
  const [payment] = await tx
    .insert(salaryPayments)
    .values({
      ...(input.uuid ? { uuid: input.uuid } : {}),
      sellerId: input.sellerId,
      period: input.period,
      periodStart: input.periodStart,
      amount: input.amount,
      accountId: input.accountId,
      paidAt,
      notes: input.notes ?? null,
    })
    .returning();

  await tx.insert(cashMovements).values({
    ...(input.cashMovementUuid ? { uuid: input.cashMovementUuid } : {}),
    type: "gasto",
    amount: input.amount,
    concept: `Sueldo ${seller.name} · ${formatSalaryPeriod(input.periodStart, input.period)}`,
    movementDate: paidAt,
    accountId: input.accountId,
    sourceType: "salary_payment",
    sourceId: payment.id,
  });

  return payment;
}

export type CreateSalaryPaymentResult = { ok: true; payment: typeof salaryPayments.$inferSelect } | { ok: false; error: string };

export async function createSalaryPayment(input: PaySalaryInput): Promise<CreateSalaryPaymentResult> {
  try {
    return { ok: true, payment: await db.transaction((tx) => paySalary(tx, input)) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function getSalaryPaymentsForSeller(sellerId: number) {
  return db
    .select({
      id: salaryPayments.id,
      period: salaryPayments.period,
      periodStart: salaryPayments.periodStart,
      amount: salaryPayments.amount,
      paidAt: salaryPayments.paidAt,
      notes: salaryPayments.notes,
      accountName: cashAccounts.name,
    })
    .from(salaryPayments)
    .leftJoin(cashAccounts, eq(salaryPayments.accountId, cashAccounts.id))
    .where(eq(salaryPayments.sellerId, sellerId))
    .orderBy(desc(salaryPayments.paidAt));
}
