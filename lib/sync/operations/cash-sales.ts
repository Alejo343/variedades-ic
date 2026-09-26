import { sql } from "drizzle-orm";
import { z } from "zod";
import { validateAdjustmentReason } from "@/lib/domain/inventory-movement";
import { defineHandler, SyncRejection } from "../push";
import { changePrincipalStock, fromUtc, idByUuid, rowUuid, utcTimestamp } from "./shared";

// Cash movements, in-store sales and inventory adjustments from the owner's
// phone (sub-paso 7, parte 3b). Rows mirror what the panel writes (concepts,
// source types), but stock may go negative: the operation already happened
// offline (CLAUDE.md, "Fase 10").

const notes = z.string().max(2000).nullish();

export const createCashMovement = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    type: z.enum(["ingreso", "gasto"]),
    amount: z.number().int().min(1),
    concept: z.string().trim().min(1).max(200),
    movementDate: utcTimestamp,
    accountUuid: rowUuid,
    notes,
  }),
  async apply(tx, p) {
    const accountId = await idByUuid(tx, "cash_accounts", p.accountUuid, "Cuenta");
    await tx.execute(sql`
      INSERT INTO cash_movements (uuid, type, amount, concept, movement_date, source_type, account_id, notes)
      VALUES (${p.uuid}, ${p.type}, ${p.amount}, ${p.concept}, ${fromUtc(p.movementDate)}, 'manual', ${accountId}, ${p.notes ?? null})`);
  },
});

export const createDirectSale = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    saleDate: utcTimestamp,
    accountUuid: rowUuid,
    notes,
    // The income row in cash_movements — required whenever the total is > 0
    // (a phone that omits it for a paid sale is a bug, not a valid zero-total
    // sale, so that case is rejected below rather than silently skipped).
    cashMovementUuid: rowUuid.optional(),
    items: z
      .array(z.object({ uuid: rowUuid, productUuid: rowUuid, quantity: z.number().int().min(1), unitPrice: z.number().int().min(0), movementUuid: rowUuid }))
      .min(1),
  }),
  async apply(tx, p) {
    const accountId = await idByUuid(tx, "cash_accounts", p.accountUuid, "Cuenta");
    const productIds = [];
    for (const item of p.items) productIds.push(await idByUuid(tx, "products", item.productUuid, "Producto"));
    const totalAmount = p.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const inserted = await tx.execute(sql`
      INSERT INTO direct_sales (uuid, sale_date, total_amount, account_id, notes)
      VALUES (${p.uuid}, ${fromUtc(p.saleDate)}, ${totalAmount}, ${accountId}, ${p.notes ?? null})
      RETURNING id`);
    const saleId = (inserted.rows[0] as { id: number }).id;

    for (const [i, item] of p.items.entries()) {
      await tx.execute(sql`
        INSERT INTO direct_sale_items (uuid, sale_id, product_id, quantity, unit_price, subtotal)
        VALUES (${item.uuid}, ${saleId}, ${productIds[i]}, ${item.quantity}, ${item.unitPrice}, ${item.quantity * item.unitPrice})`);
      await changePrincipalStock(tx, {
        uuid: item.movementUuid, productId: productIds[i], type: "venta", quantityDelta: -item.quantity,
        sourceType: "direct_sale", sourceId: saleId, occurredAt: p.saleDate,
      });
    }

    if (totalAmount > 0) {
      if (!p.cashMovementUuid) throw new SyncRejection("Falta el movimiento de caja de la venta");
      await tx.execute(sql`
        INSERT INTO cash_movements (uuid, type, amount, concept, movement_date, source_type, source_id, account_id)
        VALUES (${p.cashMovementUuid}, 'ingreso', ${totalAmount}, ${`Venta en local #${saleId}`}, ${fromUtc(p.saleDate)}, 'direct_sale', ${saleId}, ${accountId})`);
    }
  },
});

export const createInventoryAdjustment = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    productUuid: rowUuid,
    quantityDelta: z.number().int().refine((n) => n !== 0, "La cantidad no puede ser 0"),
    reason: z.string().max(2000),
    occurredAt: utcTimestamp,
  }),
  async apply(tx, p) {
    if (!validateAdjustmentReason("ajuste", p.reason)) throw new SyncRejection("Un ajuste de inventario necesita un motivo");
    const productId = await idByUuid(tx, "products", p.productUuid, "Producto");
    await changePrincipalStock(tx, {
      uuid: p.uuid, productId, type: "ajuste", quantityDelta: p.quantityDelta, reason: p.reason.trim(),
      sourceType: "manual", sourceId: null, occurredAt: p.occurredAt,
    });
  },
});
