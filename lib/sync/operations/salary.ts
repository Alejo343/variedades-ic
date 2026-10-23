import { z } from "zod";
import { paySalary, SalaryPaymentError } from "@/lib/db/queries/salary-payments";
import { defineHandler, SyncRejection } from "../push";
import { fromUtc, idByUuid, rowUuid, utcTimestamp } from "./shared";

// The owner paying one period of a salaried store seller's salary from the
// phone, with the same rule as the panel (lib/db/queries/salary-payments.ts).
export const createSalaryPayment = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    sellerUuid: rowUuid,
    period: z.enum(["weekly", "monthly"]),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha con formato inválido"),
    amount: z.number().int().min(1),
    accountUuid: rowUuid,
    paidAt: utcTimestamp,
    cashMovementUuid: rowUuid,
    notes: z.string().max(2000).nullish(),
  }),
  async apply(tx, p) {
    const sellerId = await idByUuid(tx, "sellers", p.sellerUuid, "Vendedor");
    const accountId = await idByUuid(tx, "cash_accounts", p.accountUuid, "Cuenta");
    try {
      await paySalary(tx, {
        sellerId, accountId, period: p.period, periodStart: p.periodStart, amount: p.amount, notes: p.notes,
        uuid: p.uuid, cashMovementUuid: p.cashMovementUuid, paidAt: fromUtc(p.paidAt),
      });
    } catch (err) {
      if (err instanceof SalaryPaymentError) throw new SyncRejection(err.message);
      throw err;
    }
  },
});
