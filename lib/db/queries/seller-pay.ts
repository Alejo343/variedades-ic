import { and, eq, gt, isNull } from "drizzle-orm";
import {
  nextSalaryStartDate,
  PENDING_COMMISSION_BLOCKS_SALARY,
  sellerPayConfigError,
  type SalaryPeriod,
  type SellerPayType,
} from "@/lib/domain/salary";
import { db } from "../index";
import { directSales, sellers } from "../schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Whether any in-store sale of the seller still has an unpaid commission.
export async function hasPendingCommission(dbOrTx: typeof db | Tx, sellerId: number): Promise<boolean> {
  const rows = await dbOrTx
    .select({ id: directSales.id })
    .from(directSales)
    .where(
      and(
        eq(directSales.sellerId, sellerId),
        isNull(directSales.commissionPaymentId),
        isNull(directSales.voidedAt),
        gt(directSales.commissionAmount, 0),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export type SellerPayInput = {
  inventoryMode?: string;
  payType?: SellerPayType;
  salaryAmount?: number | null;
  salaryPeriod?: SalaryPeriod | null;
  // From a phone: the start date it computed (its own local day), kept so
  // both sides agree; absent → computed here with `today`.
  salaryStartDate?: string | null;
};

export type SellerPayValues = {
  payType: SellerPayType;
  salaryAmount: number | null;
  salaryPeriod: SalaryPeriod | null;
  salaryStartDate: string | null;
};

// The pay columns a save leaves on the seller (sellerId null = a new one):
// absent fields keep the current value (an older app, a partial PUT), a
// commission seller carries no salary fields, and the whole configuration
// is checked with lib/domain/salary.ts. Shared by the panel and the sync push.
export async function resolveSellerPay(
  dbOrTx: typeof db | Tx,
  sellerId: number | null,
  input: SellerPayInput,
  today: string,
): Promise<{ ok: true; values: SellerPayValues } | { ok: false; error: string }> {
  const [current] = sellerId === null ? [] : await dbOrTx.select().from(sellers).where(eq(sellers.id, sellerId));
  const currentPay = current
    ? {
        payType: current.payType as SellerPayType,
        salaryPeriod: current.salaryPeriod as SalaryPeriod | null,
        salaryStartDate: current.salaryStartDate,
      }
    : null;

  const inventoryMode = input.inventoryMode ?? current?.inventoryMode ?? "consignment";
  const payType = input.payType ?? currentPay?.payType ?? "commission";
  const salaried = payType === "salary";
  const salaryAmount = salaried ? (input.salaryAmount !== undefined ? input.salaryAmount : (current?.salaryAmount ?? null)) : null;
  const salaryPeriod = salaried ? (input.salaryPeriod !== undefined ? input.salaryPeriod : (currentPay?.salaryPeriod ?? null)) : null;

  const error = sellerPayConfigError({ inventoryMode, payType, salaryAmount, salaryPeriod });
  if (error) return { ok: false, error };
  if (salaried && current && currentPay?.payType !== "salary" && (await hasPendingCommission(dbOrTx, current.id))) {
    return { ok: false, error: PENDING_COMMISSION_BLOCKS_SALARY };
  }

  const salaryStartDate = salaried ? (input.salaryStartDate ?? nextSalaryStartDate(currentPay, { payType, salaryPeriod }, today)) : null;
  return { ok: true, values: { payType, salaryAmount, salaryPeriod, salaryStartDate } };
}
