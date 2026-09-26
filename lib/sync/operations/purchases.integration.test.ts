import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyOperations, type PushPrincipal } from "../push";
import { syncHandlers } from ".";

// Purchase orders and payments pushed by the owner's phone (sub-paso 7,
// parte 3d), against a real Postgres through the real registry. Fixtures are
// committed and removed in afterAll. Needs DATABASE_URL (`npm run test:db`).

const url = process.env.DATABASE_URL;
const tag = `zzbuy${Date.now()}`;
const u = () => randomUUID();

describe.skipIf(!url)("compras a distribuidores (Postgres real)", async () => {
  const { db } = await import("@/lib/db");
  const q = async (text: string, params: unknown[] = []) => (await db.$client.query(text, params)).rows;
  const one = async (text: string, params: unknown[] = []) => (await q(text, params))[0];

  let owner: PushPrincipal;
  let p1: { id: number; uuid: string }, p2: { id: number; uuid: string };
  let distributorId: number, distributorUuid: string, accountId: number, accountUuid: string;
  const push = (type: string, payload: unknown) => applyOperations(db, owner, [{ id: u(), type, payload }], syncHandlers).then((r) => r[0]);
  const stock = async (id: number) => (await one(`SELECT stock FROM products WHERE id = $1`, [id])).stock as number;
  const order = { uuid: u(), item1: u(), item2: u() };

  beforeAll(async () => {
    p1 = await one(`INSERT INTO products (name, slug, sku, price, stock) VALUES ($1, $1, $1, 5000, 0) RETURNING id, uuid`, [`${tag}-1`]);
    p2 = await one(`INSERT INTO products (name, slug, sku, price, stock) VALUES ($1, $1, $1, 5000, 0) RETURNING id, uuid`, [`${tag}-2`]);
    ({ id: distributorId, uuid: distributorUuid } = await one(`INSERT INTO distributors (name) VALUES ($1) RETURNING id, uuid`, [tag]));
    ({ id: accountId, uuid: accountUuid } = await one(`INSERT INTO cash_accounts (name) VALUES ($1) RETURNING id, uuid`, [tag]));
    const ou = await one(`INSERT INTO users (username, name, password_hash, role) VALUES ($1, 'ZZ', 'h', 'owner') RETURNING id`, [tag]);
    const od = await one(`INSERT INTO device_sessions (user_id, token_hash) VALUES ($1, $2) RETURNING id`, [ou.id, tag]);
    owner = { role: "owner", userId: ou.id, sessionId: od.id, sellerId: null, sellerUuid: null };
  });

  afterAll(async () => {
    const orders = `SELECT id FROM purchase_orders WHERE distributor_id = ${distributorId}`;
    await q(`DELETE FROM cash_movements WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM purchase_payments WHERE purchase_order_id IN (${orders})`);
    await q(`DELETE FROM purchase_order_items WHERE order_id IN (${orders})`);
    await q(`DELETE FROM purchase_orders WHERE distributor_id = $1`, [distributorId]);
    await q(`DELETE FROM inventory_movements WHERE product_id IN ($1, $2)`, [p1.id, p2.id]);
    await q(`DELETE FROM products WHERE id IN ($1, $2)`, [p1.id, p2.id]);
    await q(`DELETE FROM distributors WHERE id = $1`, [distributorId]);
    await q(`DELETE FROM cash_accounts WHERE id = $1`, [accountId]);
    await q(`DELETE FROM sync_applied_operations WHERE user_id = $1`, [owner.userId]);
    await q(`DELETE FROM device_sessions WHERE token_hash = $1`, [tag]);
    await q(`DELETE FROM users WHERE username = $1`, [tag]);
  });

  it("crear pedido: el total sale de los items y arranca pendiente", async () => {
    const r = await push("createPurchaseOrder", {
      uuid: order.uuid, distributorUuid, purchaseType: "credito", orderDate: "2026-09-18 10:00:00", expectedDate: "2026-09-25", notes: null,
      items: [
        { uuid: order.item1, productUuid: p1.uuid, quantity: 10, unitCost: 3000 },
        { uuid: order.item2, productUuid: p2.uuid, quantity: 5, unitCost: 2000 },
      ],
    });
    expect(r.status).toBe("applied");
    expect(await one(`SELECT status, purchase_type, total_cost, to_char(expected_date, 'YYYY-MM-DD') AS expected FROM purchase_orders WHERE uuid = $1`, [order.uuid])).toEqual({
      status: "pendiente", purchase_type: "credito", total_cost: 40000, expected: "2026-09-25",
    });
  });

  it("transiciones: no salta estados; recibir suma el stock de cada item con los uuid del celular, una sola vez", async () => {
    const received = (movements: { itemUuid: string; movementUuid: string }[]) =>
      push("transitionPurchaseOrder", { purchaseOrderUuid: order.uuid, to: "recibido", occurredAt: "2026-09-24 16:00:00", receivedMovements: movements });
    const m1 = u(), m2 = u();

    expect((await received([{ itemUuid: order.item1, movementUuid: m1 }, { itemUuid: order.item2, movementUuid: m2 }])).status).toBe("rejected"); // pendiente → recibido
    expect((await push("transitionPurchaseOrder", { purchaseOrderUuid: order.uuid, to: "en_viaje", occurredAt: "2026-09-20 09:00:00" })).status).toBe("applied");

    const missing = await received([{ itemUuid: order.item1, movementUuid: u() }]);
    expect(missing.status).toBe("rejected");
    expect(await stock(p1.id)).toBe(0);

    expect((await received([{ itemUuid: order.item1, movementUuid: m1 }, { itemUuid: order.item2, movementUuid: m2 }])).status).toBe("applied");
    expect([await stock(p1.id), await stock(p2.id)]).toEqual([10, 5]);
    expect(await one(`SELECT type, quantity_delta, unit_cost, source_type FROM inventory_movements WHERE uuid = $1`, [m1])).toEqual({
      type: "compra", quantity_delta: 10, unit_cost: 3000, source_type: "purchase_order",
    });
    expect(await one(`SELECT status, stock_updated FROM purchase_orders WHERE uuid = $1`, [order.uuid])).toEqual({ status: "recibido", stock_updated: true });

    expect((await received([{ itemUuid: order.item1, movementUuid: u() }, { itemUuid: order.item2, movementUuid: u() }])).status).toBe("rejected");
    expect(await stock(p1.id)).toBe(10);
  });

  it("pagos: a crédito descuentan el saldo y la caja; no se paga de más, ni de contado ni cancelado", async () => {
    const pay = (purchaseOrderUuid: string, amount: number, cashMovementUuid = u()) =>
      push("createPurchasePayment", { uuid: u(), purchaseOrderUuid, amount, paidAt: "2026-09-26 10:00:00", accountUuid, notes: null, cashMovementUuid });
    const cash = u();
    expect((await pay(order.uuid, 15000, cash)).status).toBe("applied");
    expect(await one(`SELECT type, amount, concept, source_type, account_id FROM cash_movements WHERE uuid = $1`, [cash])).toEqual({
      type: "gasto", amount: 15000, concept: expect.stringMatching(new RegExp(`^Pago a distribuidor ${tag} — pedido #\\d+$`)), source_type: "purchase_payment", account_id: accountId,
    });
    const over = await pay(order.uuid, 30000); // pending is 25000
    expect(over.status).toBe("rejected");
    expect(over.error).toMatch(/Saldo insuficiente/);

    const cashOrder = u();
    await push("createPurchaseOrder", { uuid: cashOrder, distributorUuid, purchaseType: "contado", orderDate: "2026-09-18 10:00:00", expectedDate: null, items: [{ uuid: u(), productUuid: p1.uuid, quantity: 1, unitCost: 100 }] });
    expect((await pay(cashOrder, 100)).error).toMatch(/no es a crédito/);

    const cancelled = u();
    await push("createPurchaseOrder", { uuid: cancelled, distributorUuid, purchaseType: "credito", orderDate: "2026-09-18 10:00:00", expectedDate: null, items: [{ uuid: u(), productUuid: p1.uuid, quantity: 1, unitCost: 100 }] });
    expect((await push("transitionPurchaseOrder", { purchaseOrderUuid: cancelled, to: "cancelado", occurredAt: "2026-09-19 10:00:00" })).status).toBe("applied");
    expect((await pay(cancelled, 100)).error).toMatch(/cancelado/);
    expect((await push("transitionPurchaseOrder", { purchaseOrderUuid: order.uuid, to: "cancelado", occurredAt: "2026-09-27 10:00:00" })).status).toBe("rejected"); // recibido is terminal
  });
});
