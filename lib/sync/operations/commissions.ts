import { z } from "zod";
import { CommissionPaymentError, payCommissions } from "@/lib/db/queries/commission-payments";
import { defineHandler, SyncRejection } from "../push";
import { fromUtc, idByUuid, rowUuid, utcTimestamp } from "./shared";

// The owner paying a store seller's commissions from the phone. The server
// recomputes what's pending with the panel's own rule (everything unpaid up to
// periodDate) — the phone's preview is replaced on the next pull.
export const createCommissionPayment = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    sellerUuid: rowUuid,
    periodDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha con formato inválido"),
    accountUuid: rowUuid,
    paidAt: utcTimestamp,
    cashMovementUuid: rowUuid,
    notes: z.string().max(2000).nullish(),
  }),
  async apply(tx, p) {
    const sellerId = await idByUuid(tx, "sellers", p.sellerUuid, "Vendedor");
    const accountId = await idByUuid(tx, "cash_accounts", p.accountUuid, "Cuenta");
    try {
      await payCommissions(tx, {
        sellerId, accountId, periodDate: p.periodDate, notes: p.notes,
        uuid: p.uuid, cashMovementUuid: p.cashMovementUuid, paidAt: fromUtc(p.paidAt),
      });
    } catch (err) {
      if (err instanceof CommissionPaymentError) throw new SyncRejection(err.message);
      throw err;
    }
  },
});
