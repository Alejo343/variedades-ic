import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyOperations, type PushPrincipal } from "../push";
import { syncHandlers } from ".";

// Seller deliveries and settlements pushed by the owner's phone (sub-paso 7,
// parte 3c), against a real Postgres through the real registry. Fixtures are
// committed and removed in afterAll. Needs DATABASE_URL (`npm run test:db`).

const url = process.env.DATABASE_URL;
const tag = `zzdel${Date.now()}`;
const u = () => randomUUID();

describe.skipIf(!url)("entregas y liquidaciones (Postgres real)", async () => {
  const { db } = await import("@/lib/db");
  const q = async (text: string, params: unknown[] = []) => (await db.$client.query(text, params)).rows;
  const one = async (text: string, params: unknown[] = []) => (await q(text, params))[0];

  let owner: PushPrincipal;
  let productId: number, productUuid: string, sellerId: number, sellerUuid: string, accountId: number, accountUuid: string;
  const push = (type: string, payload: unknown) => applyOperations(db, owner, [{ id: u(), type, payload }], syncHandlers).then((r) => r[0]);
  const settlementUuid = u();

  beforeAll(async () => {
    ({ id: productId, uuid: productUuid } = await one(`INSERT INTO products (name, slug, sku, price, purchase_price, stock) VALUES ($1, $1, $1, 5000, 3000, 1) RETURNING id, uuid`, [tag]));
    ({ id: sellerId, uuid: sellerUuid } = await one(`INSERT INTO sellers (name, commission_type, commission_value) VALUES ($1, 'percentage', 1000) RETURNING id, uuid`, [tag]));
    ({ id: accountId, uuid: accountUuid } = await one(`INSERT INTO cash_accounts (name) VALUES ($1) RETURNING id, uuid`, [tag]));
    const ou = await one(`INSERT INTO users (username, name, password_hash, role) VALUES ($1, 'ZZ', 'h', 'owner') RETURNING id`, [tag]);
    const od = await one(`INSERT INTO device_sessions (user_id, token_hash) VALUES ($1, $2) RETURNING id`, [ou.id, tag]);
    owner = { role: "owner", userId: ou.id, sessionId: od.id, sellerId: null, sellerUuid: null };
  });

  afterAll(async () => {
    await q(`DELETE FROM seller_delivery_items WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM seller_sale_items WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM seller_loss_items WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM seller_deliveries WHERE seller_id = $1`, [sellerId]);
    await q(`DELETE FROM seller_sales WHERE seller_id = $1`, [sellerId]);
    await q(`DELETE FROM seller_losses WHERE seller_id = $1`, [sellerId]);
    await q(`DELETE FROM cash_movements WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM settlements WHERE seller_id = $1`, [sellerId]);
    await q(`DELETE FROM inventory_movements WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM products WHERE id = $1`, [productId]);
    await q(`DELETE FROM sellers WHERE id = $1`, [sellerId]);
    await q(`DELETE FROM cash_accounts WHERE id = $1`, [accountId]);
    await q(`DELETE FROM sync_applied_operations WHERE user_id = $1`, [owner.userId]);
    await q(`DELETE FROM device_sessions WHERE token_hash = $1`, [tag]);
    await q(`DELETE FROM users WHERE username = $1`, [tag]);
  });

  it("entrega: descuenta el principal aunque quede negativo y suma al vendedor, dos filas del mismo ledger", async () => {
    const d = { uuid: u(), itemUuid: u(), principalMovementUuid: u(), sellerMovementUuid: u() };
    const r = await push("createSellerDelivery", {
      uuid: d.uuid, sellerUuid, deliveryDate: "2026-09-19 13:00:00", notes: null,
      items: [{ uuid: d.itemUuid, productUuid, quantity: 2, unitCost: 3000, principalMovementUuid: d.principalMovementUuid, sellerMovementUuid: d.sellerMovementUuid }],
    });
    expect(r.status).toBe("applied");
    expect(await one(`SELECT stock FROM products WHERE id = $1`, [productId])).toEqual({ stock: -1 }); // had 1, delivered 2
    expect(await one(`SELECT owner_type, seller_id, quantity_delta FROM inventory_movements WHERE uuid = $1`, [d.sellerMovementUuid])).toEqual({ owner_type: "seller", seller_id: sellerId, quantity_delta: 2 });
    expect(await one(`SELECT owner_type, quantity_delta FROM inventory_movements WHERE uuid = $1`, [d.principalMovementUuid])).toEqual({ owner_type: "principal", quantity_delta: -2 });
    expect(await one(`SELECT quantity, unit_cost FROM seller_delivery_items WHERE uuid = $1`, [d.itemUuid])).toEqual({ quantity: 2, unit_cost: 3000 });
  });

  it("liquidación: el servidor agrega ventas, comisión y pérdidas del día y marca las ventas incluidas", async () => {
    const sale = (saleDate: string, qty: number) => push("createSellerSale", {
      uuid: u(), sellerUuid, saleDate, items: [{ uuid: u(), productUuid, quantity: qty, unitPrice: 5000, movementUuid: u() }],
    });
    await sale("2026-09-20 15:00:00", 1); // 5000, commission 500
    await sale("2026-09-20 16:00:00", 1); // 5000, commission 500
    await push("createSellerLoss", { uuid: u(), sellerUuid, type: "dano", lossDate: "2026-09-20 17:00:00", items: [{ uuid: u(), productUuid, quantity: 1, movementUuid: u() }] }); // 3000

    const r = await push("createSettlement", { uuid: settlementUuid, sellerUuid, periodDate: "2026-09-20" });
    expect(r.status).toBe("applied");
    const s = await one(`SELECT id, total_sales, total_commission, total_losses, amount_due, status FROM settlements WHERE uuid = $1`, [settlementUuid]);
    expect(s).toMatchObject({ total_sales: 10000, total_commission: 1000, total_losses: 3000, amount_due: 12000, status: "pendiente" });
    expect(await q(`SELECT count(*)::int AS n FROM seller_sales WHERE seller_id = $1 AND settlement_id = $2`, [sellerId, s.id])).toEqual([{ n: 2 }]);

    const again = await push("createSettlement", { uuid: u(), sellerUuid, periodDate: "2026-09-20" });
    expect(again.status).toBe("rejected");
    expect(again.error).toMatch(/Ya existe una liquidación/);
  });

  it("marcar liquidada: genera el ingreso en caja por lo que el vendedor entrega, una sola vez", async () => {
    const cashUuid = u();
    const r = await push("markSettlementSettled", { settlementUuid, accountUuid, settledAt: "2026-09-21 09:00:00", cashMovementUuid: cashUuid });
    expect(r.status).toBe("applied");
    expect(await one(`SELECT status, settled_at IS NOT NULL AS settled FROM settlements WHERE uuid = $1`, [settlementUuid])).toEqual({ status: "liquidada", settled: true });
    const cash = await one(`SELECT type, amount, concept, source_type, account_id FROM cash_movements WHERE uuid = $1`, [cashUuid]);
    expect(cash).toEqual({ type: "ingreso", amount: 12000, concept: `Liquidación vendedor #${sellerId} — 2026-09-20`, source_type: "settlement", account_id: accountId });

    const twice = await push("markSettlementSettled", { settlementUuid, accountUuid, settledAt: "2026-09-21 09:05:00", cashMovementUuid: u() });
    expect(twice.status).toBe("rejected");
    expect(twice.error).toMatch(/No se puede liquidar/);
  });
});
