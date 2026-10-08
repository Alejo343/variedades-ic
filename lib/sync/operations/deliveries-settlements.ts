import { sql } from "drizzle-orm";
import { z } from "zod";
import { STORE_SELLER_NO_DELIVERIES } from "@/lib/db/queries/seller-inventory";
import { aggregatePeriod, markIncludedInSettlement } from "@/lib/db/queries/settlements";
import { calculateSettlement } from "@/lib/domain/settlement";
import { canTransitionSettlement, type SettlementStatus } from "@/lib/domain/settlement-status";
import { defineHandler, SyncRejection } from "../push";
import { changePrincipalStock, fromUtc, idByUuid, recordSellerMovement, rowUuid, utcTimestamp } from "./shared";

// Seller deliveries and settlements from the owner's phone (sub-paso 7,
// parte 3c). Settlement totals are always computed by the server from its own
// data, with the panel's own aggregation (everything pending up to the date) —
// the phone's local preview is replaced on the next pull.

export const createSellerDelivery = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    sellerUuid: rowUuid,
    deliveryDate: utcTimestamp,
    notes: z.string().max(2000).nullish(),
    items: z
      .array(
        z.object({
          uuid: rowUuid,
          productUuid: rowUuid,
          quantity: z.number().int().min(1),
          unitCost: z.number().int().min(0),
          principalMovementUuid: rowUuid,
          sellerMovementUuid: rowUuid,
        }),
      )
      .min(1),
  }),
  async apply(tx, p) {
    const sellerId = await idByUuid(tx, "sellers", p.sellerUuid, "Vendedor");
    const mode = await tx.execute(sql`SELECT inventory_mode FROM sellers WHERE id = ${sellerId}`);
    if ((mode.rows[0] as { inventory_mode: string }).inventory_mode === "store") throw new SyncRejection(STORE_SELLER_NO_DELIVERIES);
    const productIds = [];
    for (const item of p.items) productIds.push(await idByUuid(tx, "products", item.productUuid, "Producto"));

    const inserted = await tx.execute(sql`
      INSERT INTO seller_deliveries (uuid, seller_id, delivery_date, notes)
      VALUES (${p.uuid}, ${sellerId}, ${fromUtc(p.deliveryDate)}, ${p.notes ?? null})
      RETURNING id`);
    const deliveryId = (inserted.rows[0] as { id: number }).id;

    for (const [i, item] of p.items.entries()) {
      await tx.execute(sql`
        INSERT INTO seller_delivery_items (uuid, delivery_id, product_id, quantity, unit_cost)
        VALUES (${item.uuid}, ${deliveryId}, ${productIds[i]}, ${item.quantity}, ${item.unitCost})`);
      // Two rows of the same ledger: out of the principal, into the seller.
      await changePrincipalStock(tx, {
        uuid: item.principalMovementUuid, productId: productIds[i], type: "entrega_vendedor", quantityDelta: -item.quantity,
        unitCost: item.unitCost, sourceType: "seller_delivery", sourceId: deliveryId, occurredAt: p.deliveryDate,
      });
      await recordSellerMovement(tx, {
        uuid: item.sellerMovementUuid, productId: productIds[i], sellerId, type: "entrega_vendedor", quantityDelta: item.quantity,
        unitCost: item.unitCost, sourceType: "seller_delivery", sourceId: deliveryId, occurredAt: p.deliveryDate,
      });
    }
  },
});

export const createSettlement = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    sellerUuid: rowUuid,
    periodDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha con formato inválido"),
  }),
  async apply(tx, p) {
    const sellerId = await idByUuid(tx, "sellers", p.sellerUuid, "Vendedor");
    const existing = await tx.execute(sql`SELECT id FROM settlements WHERE seller_id = ${sellerId} AND period_date = ${p.periodDate}`);
    if (existing.rows.length) throw new SyncRejection("Ya existe una liquidación para este vendedor en esta fecha");

    // Exactly the panel's rule (everything pending up to periodDate), shared code.
    const totals = await aggregatePeriod(tx, sellerId, p.periodDate);
    const { amountDue } = calculateSettlement(totals);

    const inserted = await tx.execute(sql`
      INSERT INTO settlements (uuid, seller_id, period_date, total_sales, total_commission, total_losses, amount_due)
      VALUES (${p.uuid}, ${sellerId}, ${p.periodDate}, ${totals.totalSales}, ${totals.totalCommission}, ${totals.totalLosses}, ${amountDue})
      RETURNING id`);
    await markIncludedInSettlement(tx, sellerId, p.periodDate, (inserted.rows[0] as { id: number }).id);
  },
});

export const markSettlementSettled = defineHandler({
  schema: z.object({
    settlementUuid: rowUuid,
    accountUuid: rowUuid,
    settledAt: utcTimestamp,
    // Required only when amount_due > 0 — same reasoning as createDirectSale's
    // cashMovementUuid: a settlement that owes the seller nothing generates
    // no income row, so the phone has nothing to name here.
    cashMovementUuid: rowUuid.optional(),
  }),
  async apply(tx, p) {
    const settlementId = await idByUuid(tx, "settlements", p.settlementUuid, "Liquidación");
    const accountId = await idByUuid(tx, "cash_accounts", p.accountUuid, "Cuenta");
    const current = await tx.execute(sql`
      SELECT status, seller_id, amount_due, to_char(period_date, 'YYYY-MM-DD') AS period_date FROM settlements WHERE id = ${settlementId} FOR UPDATE`);
    const s = current.rows[0] as { status: SettlementStatus; seller_id: number; amount_due: number; period_date: string };
    if (!canTransitionSettlement(s.status, "liquidada")) {
      throw new SyncRejection(`No se puede liquidar una liquidación en estado '${s.status}'`);
    }

    await tx.execute(sql`UPDATE settlements SET status = 'liquidada', settled_at = ${fromUtc(p.settledAt)} WHERE id = ${settlementId}`);
    if (s.amount_due > 0) {
      if (!p.cashMovementUuid) throw new SyncRejection("Falta el movimiento de caja de la liquidación");
      // Same concept as the panel's markSettlementLiquidada.
      await tx.execute(sql`
        INSERT INTO cash_movements (uuid, type, amount, concept, movement_date, source_type, source_id, account_id)
        VALUES (${p.cashMovementUuid}, 'ingreso', ${s.amount_due}, ${`Liquidación vendedor #${s.seller_id} — ${s.period_date}`},
                ${fromUtc(p.settledAt)}, 'settlement', ${settlementId}, ${accountId})`);
    }
  },
});
