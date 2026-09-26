import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyOperations, type PushPrincipal } from "../push";
import { syncHandlers } from ".";

// Cash movements, in-store sales and inventory adjustments pushed by the
// owner's phone (sub-paso 7, parte 3b), against a real Postgres through the
// real registry. Fixtures are committed and removed in afterAll.

const url = process.env.DATABASE_URL;
const tag = `zzcash${Date.now()}`;
const u = () => randomUUID();
const utc = (col: string) => `to_char((${col} AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')`;

describe.skipIf(!url)("caja, ventas en local y ajustes (Postgres real)", async () => {
  const { db } = await import("@/lib/db");
  const q = async (text: string, params: unknown[] = []) => (await db.$client.query(text, params)).rows;
  const one = async (text: string, params: unknown[] = []) => (await q(text, params))[0];

  let owner: PushPrincipal;
  let productId: number;
  let productUuid: string;
  let accountId: number;
  let accountUuid: string;
  const push = (type: string, payload: unknown) => applyOperations(db, owner, [{ id: u(), type, payload }], syncHandlers).then((r) => r[0]);
  const stock = async () => (await one(`SELECT stock FROM products WHERE id = $1`, [productId])).stock as number;

  beforeAll(async () => {
    ({ id: productId, uuid: productUuid } = await one(`INSERT INTO products (name, slug, sku, price, stock) VALUES ($1, $1, $1, 5000, 2) RETURNING id, uuid`, [tag]));
    ({ id: accountId, uuid: accountUuid } = await one(`INSERT INTO cash_accounts (name) VALUES ($1) RETURNING id, uuid`, [tag]));
    const ou = await one(`INSERT INTO users (username, name, password_hash, role) VALUES ($1, 'ZZ', 'h', 'owner') RETURNING id`, [tag]);
    const od = await one(`INSERT INTO device_sessions (user_id, token_hash) VALUES ($1, $2) RETURNING id`, [ou.id, tag]);
    owner = { role: "owner", userId: ou.id, sessionId: od.id, sellerId: null, sellerUuid: null };
  });

  afterAll(async () => {
    await q(`DELETE FROM direct_sale_items WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM cash_movements WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM direct_sales WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM inventory_movements WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM products WHERE id = $1`, [productId]);
    await q(`DELETE FROM cash_accounts WHERE id = $1`, [accountId]);
    await q(`DELETE FROM sync_applied_operations WHERE user_id = $1`, [owner.userId]);
    await q(`DELETE FROM device_sessions WHERE token_hash = $1`, [tag]);
    await q(`DELETE FROM users WHERE username = $1`, [tag]);
  });

  it("movimiento manual de caja: con la fecha real del celular y en la cuenta elegida", async () => {
    const m = u();
    const r = await push("createCashMovement", { uuid: m, type: "gasto", amount: 20000, concept: "Pago de arriendo", movementDate: "2026-09-20 14:00:00", accountUuid, notes: null });
    expect(r.status).toBe("applied");
    expect(await one(`SELECT type, amount, concept, source_type, account_id, ${utc("movement_date")} AS at FROM cash_movements WHERE uuid = $1`, [m])).toEqual({
      type: "gasto", amount: 20000, concept: "Pago de arriendo", source_type: "manual", account_id: accountId, at: "2026-09-20 14:00:00",
    });
    expect((await push("createCashMovement", { uuid: u(), type: "gasto", amount: 0, concept: "x", movementDate: "2026-09-20 14:00:00", accountUuid })).status).toBe("rejected");
  });

  it("venta en local: descuenta el stock aunque quede negativo y genera el ingreso en caja con sus uuid", async () => {
    const sale = { uuid: u(), itemUuid: u(), movementUuid: u(), cashUuid: u() };
    const r = await push("createDirectSale", {
      uuid: sale.uuid, saleDate: "2026-09-21 11:00:00", accountUuid, notes: null, cashMovementUuid: sale.cashUuid,
      items: [{ uuid: sale.itemUuid, productUuid, quantity: 3, unitPrice: 5000, movementUuid: sale.movementUuid }],
    });
    expect(r.status).toBe("applied");
    expect(await stock()).toBe(-1); // had 2, sold 3 offline
    const { id: saleId, total_amount } = await one(`SELECT id, total_amount FROM direct_sales WHERE uuid = $1`, [sale.uuid]);
    expect(total_amount).toBe(15000);
    expect(await one(`SELECT type, quantity_delta, source_type, source_id FROM inventory_movements WHERE uuid = $1`, [sale.movementUuid])).toEqual({
      type: "venta", quantity_delta: -3, source_type: "direct_sale", source_id: saleId,
    });
    expect(await one(`SELECT type, amount, concept, source_type, source_id, account_id FROM cash_movements WHERE uuid = $1`, [sale.cashUuid])).toEqual({
      type: "ingreso", amount: 15000, concept: `Venta en local #${saleId}`, source_type: "direct_sale", source_id: saleId, account_id: accountId,
    });
  });

  it("total 0 no exige movimiento de caja; total > 0 sin cashMovementUuid se rechaza", async () => {
    const free = await push("createDirectSale", {
      uuid: u(), saleDate: "2026-09-21 11:30:00", accountUuid, items: [{ uuid: u(), productUuid, quantity: 1, unitPrice: 0, movementUuid: u() }],
    });
    expect(free.status).toBe("applied");

    const paidWithoutCash = await push("createDirectSale", {
      uuid: u(), saleDate: "2026-09-21 11:31:00", accountUuid, items: [{ uuid: u(), productUuid, quantity: 1, unitPrice: 5000, movementUuid: u() }],
    });
    expect(paidWithoutCash.status).toBe("rejected");
    expect(paidWithoutCash.error).toMatch(/Falta el movimiento de caja/);
  });

  it("una cuenta inexistente rechaza la venta completa sin descontar nada", async () => {
    const before = await stock();
    const saleUuid = u();
    const r = await push("createDirectSale", {
      uuid: saleUuid, saleDate: "2026-09-21 12:00:00", accountUuid: u(), cashMovementUuid: u(),
      items: [{ uuid: u(), productUuid, quantity: 1, unitPrice: 5000, movementUuid: u() }],
    });
    expect(r.status).toBe("rejected");
    expect(r.error).toMatch(/Cuenta no existe/);
    expect(await stock()).toBe(before);
    expect(await q(`SELECT id FROM direct_sales WHERE uuid = $1`, [saleUuid])).toEqual([]);
  });

  it("ajuste de inventario: exige motivo y cantidad distinta de 0", async () => {
    const before = await stock();
    const m = u();
    expect((await push("createInventoryAdjustment", { uuid: m, productUuid, quantityDelta: 5, reason: "Conteo físico", occurredAt: "2026-09-22 08:00:00" })).status).toBe("applied");
    expect(await stock()).toBe(before + 5);
    expect(await one(`SELECT type, quantity_delta, reason, source_type, owner_type FROM inventory_movements WHERE uuid = $1`, [m])).toEqual({
      type: "ajuste", quantity_delta: 5, reason: "Conteo físico", source_type: "manual", owner_type: "principal",
    });
    expect((await push("createInventoryAdjustment", { uuid: u(), productUuid, quantityDelta: 1, reason: "   ", occurredAt: "2026-09-22 08:00:00" })).status).toBe("rejected");
    expect((await push("createInventoryAdjustment", { uuid: u(), productUuid, quantityDelta: 0, reason: "x", occurredAt: "2026-09-22 08:00:00" })).status).toBe("rejected");
  });
});
