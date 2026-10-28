import { sql } from "drizzle-orm";
import { db } from "../index";
import { normalizeVoidReason, saleVoidBlocker } from "@/lib/domain/sale-void";
import type { Tx } from "@/lib/sync/push";
import { changePrincipalStock, fromUtc, recordSellerMovement } from "@/lib/sync/operations/shared";

// Voiding a sale (lib/domain/sale-void.ts), shared by the panel and the sync
// push so both write the same rows. Inside the caller's transaction:
// - the sale row is kept and marked (voided_at, void_reason);
// - each item's units come back with an 'anulacion' movement — into the
//   principal stock for an in-store sale, into the seller's ledger for a
//   consignment sale — whose uuid the caller provides (the phone's, or a
//   fresh one from the panel);
// - an in-store sale's cash income is deleted (its tombstone reaches the
//   phones), so balances and reports drop it with no special case.

export class SaleVoidError extends Error {}

export type VoidSaleInput = {
  saleUuid: string;
  /** UTC "YYYY-MM-DD HH:MM:SS", like every timestamp the phones send. */
  voidedAt: string;
  reason?: string | null;
  /** The uuid of the movement returning that item's units. */
  movementUuidFor: (itemUuid: string) => string | undefined;
};

type SaleItem = { uuid: string; product_id: number; quantity: number };

function movementUuid(input: VoidSaleInput, item: SaleItem): string {
  const uuid = input.movementUuidFor(item.uuid);
  if (!uuid) throw new SaleVoidError("Falta el movimiento de inventario de un producto de la venta");
  return uuid;
}

export async function voidDirectSale(tx: Tx, input: VoidSaleInput): Promise<{ saleId: number }> {
  const found = await tx.execute(sql`
    SELECT id, voided_at, commission_payment_id FROM direct_sales WHERE uuid = ${input.saleUuid} FOR UPDATE`);
  const sale = found.rows[0] as { id: number; voided_at: Date | null; commission_payment_id: number | null } | undefined;
  if (!sale) throw new SaleVoidError(`La venta no existe en el servidor (${input.saleUuid})`);
  const blocker = saleVoidBlocker({ voidedAt: sale.voided_at, commissionPaymentId: sale.commission_payment_id });
  if (blocker) throw new SaleVoidError(blocker);

  const items = (await tx.execute(sql`SELECT uuid, product_id, quantity FROM direct_sale_items WHERE sale_id = ${sale.id}`)).rows as SaleItem[];
  for (const item of items) {
    await changePrincipalStock(tx, {
      uuid: movementUuid(input, item), productId: item.product_id, type: "anulacion", quantityDelta: item.quantity,
      sourceType: "direct_sale", sourceId: sale.id, occurredAt: input.voidedAt,
    });
  }
  await tx.execute(sql`DELETE FROM cash_movements WHERE source_type = 'direct_sale' AND source_id = ${sale.id}`);
  await tx.execute(sql`
    UPDATE direct_sales SET voided_at = ${fromUtc(input.voidedAt)}, void_reason = ${normalizeVoidReason(input.reason)}
    WHERE id = ${sale.id}`);
  return { saleId: sale.id };
}

export async function voidSellerSale(tx: Tx, input: VoidSaleInput): Promise<{ saleId: number }> {
  const found = await tx.execute(sql`
    SELECT id, seller_id, voided_at, settlement_id FROM seller_sales WHERE uuid = ${input.saleUuid} FOR UPDATE`);
  const sale = found.rows[0] as { id: number; seller_id: number; voided_at: Date | null; settlement_id: number | null } | undefined;
  if (!sale) throw new SaleVoidError(`La venta no existe en el servidor (${input.saleUuid})`);
  const blocker = saleVoidBlocker({ voidedAt: sale.voided_at, settlementId: sale.settlement_id });
  if (blocker) throw new SaleVoidError(blocker);

  const items = (await tx.execute(sql`SELECT uuid, product_id, quantity FROM seller_sale_items WHERE sale_id = ${sale.id}`)).rows as SaleItem[];
  for (const item of items) {
    await recordSellerMovement(tx, {
      uuid: movementUuid(input, item), productId: item.product_id, sellerId: sale.seller_id, type: "anulacion",
      quantityDelta: item.quantity, sourceType: "seller_sale", sourceId: sale.id, occurredAt: input.voidedAt,
    });
  }
  await tx.execute(sql`
    UPDATE seller_sales SET voided_at = ${fromUtc(input.voidedAt)}, void_reason = ${normalizeVoidReason(input.reason)}
    WHERE id = ${sale.id}`);
  return { saleId: sale.id };
}

/** Now as the UTC "YYYY-MM-DD HH:MM:SS" the void functions take. */
function nowUtc() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

export type PanelVoidResult = { ok: true } | { ok: false; error: string };

/** The panel's void of a sale by its local id; movement uuids are new ones. */
export async function voidSaleFromPanel(kind: "direct" | "seller", saleId: number, reason: string | null): Promise<PanelVoidResult> {
  try {
    await db.transaction(async (tx) => {
      const table = kind === "direct" ? sql`direct_sales` : sql`seller_sales`;
      const found = await tx.execute(sql`SELECT uuid FROM ${table} WHERE id = ${saleId}`);
      const sale = found.rows[0] as { uuid: string } | undefined;
      if (!sale) throw new SaleVoidError("La venta no existe");
      const input: VoidSaleInput = { saleUuid: sale.uuid, voidedAt: nowUtc(), reason, movementUuidFor: () => crypto.randomUUID() };
      await (kind === "direct" ? voidDirectSale(tx, input) : voidSellerSale(tx, input));
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof SaleVoidError) return { ok: false, error: e.message };
    throw e;
  }
}
