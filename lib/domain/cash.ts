// Cash movements carry a direction (`type`: ingreso | gasto) that always
// counts toward the balance, and a `sourceType` that says where they came from.
//
// A "cash adjustment" (`sourceType = 'ajuste'`) moves the balance — e.g. the
// money already in the drawer the first day the app is used, or correcting a
// count difference — but is NOT business income or expense, so it is left out
// of every income/expense figure (Caja del mes, Reportes → Flujo de caja).
//
// It is stored as a regular ingreso/gasto row on purpose: the mobile app syncs
// cash_movements and computes the balance from `type`, so a new `type` value
// would break its balance. `sourceType` already travels in the sync.

export const CASH_ADJUSTMENT_SOURCE = "ajuste";

export type CashMovementLike = { type: string; amount: number; sourceType: string | null };

export function isCashAdjustment(m: Pick<CashMovementLike, "sourceType">): boolean {
  return m.sourceType === CASH_ADJUSTMENT_SOURCE;
}

export type CashFlowSummary = {
  /** Business income (excludes adjustments). */
  income: number;
  /** Business expense (excludes adjustments). */
  expense: number;
  /** Net effect of adjustments on the balance (+ added, − removed). */
  adjustments: number;
  /** Total effect on the balance: income − expense + adjustments. */
  balanceChange: number;
};

export function summarizeCashFlow(movements: CashMovementLike[]): CashFlowSummary {
  let income = 0;
  let expense = 0;
  let adjustments = 0;
  for (const m of movements) {
    const signed = m.type === "ingreso" ? m.amount : -m.amount;
    if (isCashAdjustment(m)) adjustments += signed;
    else if (m.type === "ingreso") income += m.amount;
    else expense += m.amount;
  }
  return { income, expense, adjustments, balanceChange: income - expense + adjustments };
}
