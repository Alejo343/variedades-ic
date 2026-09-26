import { sql } from "drizzle-orm";
import { z } from "zod";
import { canTransitionPurchaseOrder, type PurchaseOrderStatus } from "@/lib/domain/order-status";
import { defineHandler, SyncRejection } from "../push";
import { changePrincipalStock, fromUtc, idByUuid, rowUuid, utcTimestamp } from "./shared";

// Purchase orders and payments from the owner's phone (sub-paso 7, parte 3d).
// Same rules as the panel: states only move through canTransitionPurchaseOrder,
// receiving is the only path that adds stock, and a payment can't exceed what
// is pending (a money guard against typos — the "accept what already happened
// offline" rule of Fase 10 is about product stock, not money).

const notes = z.string().max(2000).nullish();

export const createPurchaseOrder = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    distributorUuid: rowUuid.nullable(),
    purchaseType: z.enum(["contado", "credito"]),
    orderDate: utcTimestamp,
    expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha con formato inválido").nullable(),
    notes,
    items: z
      .array(z.object({ uuid: rowUuid, productUuid: rowUuid, quantity: z.number().int().min(1), unitCost: z.number().int().min(0) }))
      .min(1),
  }),
  async apply(tx, p) {
    const distributorId = p.distributorUuid ? await idByUuid(tx, "distributors", p.distributorUuid, "Distribuidor") : null;
    const productIds = [];
    for (const item of p.items) productIds.push(await idByUuid(tx, "products", item.productUuid, "Producto"));
    const totalCost = p.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

    const inserted = await tx.execute(sql`
      INSERT INTO purchase_orders (uuid, distributor_id, status, purchase_type, order_date, expected_date, total_cost, notes)
      VALUES (${p.uuid}, ${distributorId}, 'pendiente', ${p.purchaseType}, ${fromUtc(p.orderDate)}, ${p.expectedDate}, ${totalCost}, ${p.notes ?? null})
      RETURNING id`);
    const orderId = (inserted.rows[0] as { id: number }).id;
    for (const [i, item] of p.items.entries()) {
      await tx.execute(sql`
        INSERT INTO purchase_order_items (uuid, order_id, product_id, quantity, unit_cost)
        VALUES (${item.uuid}, ${orderId}, ${productIds[i]}, ${item.quantity}, ${item.unitCost})`);
    }
  },
});

export const transitionPurchaseOrder = defineHandler({
  schema: z.object({
    purchaseOrderUuid: rowUuid,
    to: z.enum(["en_viaje", "recibido", "cancelado"]),
    occurredAt: utcTimestamp,
    // Only for "recibido": the uuid of the stock movement the phone created for each item.
    receivedMovements: z.array(z.object({ itemUuid: rowUuid, movementUuid: rowUuid })).optional(),
  }),
  async apply(tx, p) {
    const orderId = await idByUuid(tx, "purchase_orders", p.purchaseOrderUuid, "Pedido");
    const current = await tx.execute(sql`SELECT status FROM purchase_orders WHERE id = ${orderId} FOR UPDATE`);
    const status = (current.rows[0] as { status: PurchaseOrderStatus }).status;
    if (!canTransitionPurchaseOrder(status, p.to)) {
      throw new SyncRejection(`No se puede pasar un pedido de '${status}' a '${p.to}'`);
    }

    if (p.to === "recibido") {
      const items = await tx.execute(sql`SELECT id, uuid, product_id, quantity, unit_cost FROM purchase_order_items WHERE order_id = ${orderId}`);
      const movementByItem = new Map((p.receivedMovements ?? []).map((m) => [m.itemUuid, m.movementUuid]));
      for (const item of items.rows as { uuid: string; product_id: number; quantity: number; unit_cost: number }[]) {
        const movementUuid = movementByItem.get(item.uuid);
        if (!movementUuid) throw new SyncRejection(`Falta el movimiento de stock del item ${item.uuid} del pedido`);
        await changePrincipalStock(tx, {
          uuid: movementUuid, productId: item.product_id, type: "compra", quantityDelta: item.quantity, unitCost: item.unit_cost,
          sourceType: "purchase_order", sourceId: orderId, occurredAt: p.occurredAt,
        });
      }
    }

    // stock_updated mirrors the panel's own guard (markPurchaseOrderReceived).
    await tx.execute(sql`
      UPDATE purchase_orders SET status = ${p.to}, stock_updated = stock_updated OR ${p.to === "recibido"}, updated_at = now()
      WHERE id = ${orderId}`);
  },
});

export const createPurchasePayment = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    purchaseOrderUuid: rowUuid,
    amount: z.number().int().min(1),
    paidAt: utcTimestamp,
    accountUuid: rowUuid,
    notes,
    cashMovementUuid: rowUuid,
  }),
  async apply(tx, p) {
    const orderId = await idByUuid(tx, "purchase_orders", p.purchaseOrderUuid, "Pedido");
    const accountId = await idByUuid(tx, "cash_accounts", p.accountUuid, "Cuenta");
    const orderRow = await tx.execute(sql`
      SELECT o.purchase_type, o.status, COALESCE(o.total_cost, 0) AS total_cost, d.name AS distributor_name,
        (SELECT COALESCE(SUM(amount), 0) FROM purchase_payments WHERE purchase_order_id = o.id) AS paid
      FROM purchase_orders o LEFT JOIN distributors d ON d.id = o.distributor_id
      WHERE o.id = ${orderId} FOR UPDATE OF o`);
    const o = orderRow.rows[0] as { purchase_type: string; status: string; total_cost: number; distributor_name: string | null; paid: string };

    // Same checks and messages as the panel's createPurchasePayment.
    if (o.purchase_type !== "credito") throw new SyncRejection("Este pedido no es a crédito");
    if (o.status === "cancelado") throw new SyncRejection("No se puede pagar un pedido cancelado");
    const pending = o.total_cost - Number(o.paid);
    if (p.amount > pending) throw new SyncRejection(`Saldo insuficiente: hay ${pending} pendiente, se intentó pagar ${p.amount}`);

    const inserted = await tx.execute(sql`
      INSERT INTO purchase_payments (uuid, purchase_order_id, amount, paid_at, account_id, notes)
      VALUES (${p.uuid}, ${orderId}, ${p.amount}, ${fromUtc(p.paidAt)}, ${accountId}, ${p.notes ?? null})
      RETURNING id`);
    const paymentId = (inserted.rows[0] as { id: number }).id;
    const concept = `Pago a distribuidor${o.distributor_name ? ` ${o.distributor_name}` : ""} — pedido #${orderId}`;
    await tx.execute(sql`
      INSERT INTO cash_movements (uuid, type, amount, concept, movement_date, source_type, source_id, account_id)
      VALUES (${p.cashMovementUuid}, 'gasto', ${p.amount}, ${concept}, ${fromUtc(p.paidAt)}, 'purchase_payment', ${paymentId}, ${accountId})`);
  },
});
