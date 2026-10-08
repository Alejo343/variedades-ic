import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyOperations, type PushPrincipal } from "../push";
import { syncHandlers } from ".";

// A 'store' seller sells the principal inventory from their phone: the sale is
// a direct_sale tagged with them (money straight into the chosen account, with
// their commission). A 'consignment' seller may not. Real Postgres through the
// real registry; fixtures removed in afterAll.

const url = process.env.DATABASE_URL;
const tag = `zzstore${Date.now()}`;
const u = () => randomUUID();

describe.skipIf(!url)("vendedor de tienda: venta en local (Postgres real)", async () => {
  const { db } = await import("@/lib/db");
  const q = async (text: string, params: unknown[] = []) => (await db.$client.query(text, params)).rows;
  const one = async (text: string, params: unknown[] = []) => (await q(text, params))[0];

  let owner: PushPrincipal;
  let store: PushPrincipal;
  let consignment: PushPrincipal;
  let productId: number;
  let productUuid: string;
  let accountId: number;
  let accountUuid: string;
  const userIds: number[] = [];
  const sellerIds: number[] = [];

  const push = (who: PushPrincipal, type: string, payload: unknown) =>
    applyOperations(db, who, [{ id: u(), type, payload }], syncHandlers).then((r) => r[0]);
  const sale = (sellerUuid: string | undefined, quantity = 3) => ({
    uuid: u(), saleDate: "2026-10-07 15:00:00", accountUuid, sellerUuid, cashMovementUuid: u(),
    items: [{ uuid: u(), productUuid, quantity, unitPrice: 5000, movementUuid: u() }],
  });
  const stock = async () => (await one(`SELECT stock FROM products WHERE id = $1`, [productId])).stock as number;

  async function principalFor(role: "owner" | "seller", sellerId: number | null, sellerUuid: string | null, suffix: string) {
    const user = await one(
      `INSERT INTO users (username, name, password_hash, role, seller_id) VALUES ($1, 'ZZ', 'h', $2, $3) RETURNING id`,
      [`${tag}-${suffix}`, role, sellerId],
    );
    userIds.push(user.id);
    const session = await one(`INSERT INTO device_sessions (user_id, token_hash) VALUES ($1, $2) RETURNING id`, [user.id, `${tag}-${suffix}`]);
    return { role, userId: user.id, sessionId: session.id, sellerId, sellerUuid } satisfies PushPrincipal;
  }

  beforeAll(async () => {
    ({ id: productId, uuid: productUuid } = await one(`INSERT INTO products (name, slug, sku, price, stock) VALUES ($1, $1, $1, 5000, 10) RETURNING id, uuid`, [tag]));
    ({ id: accountId, uuid: accountUuid } = await one(`INSERT INTO cash_accounts (name) VALUES ($1) RETURNING id, uuid`, [tag]));
    const s = await one(
      `INSERT INTO sellers (name, commission_type, commission_value, inventory_mode) VALUES ($1, 'percentage', 1000, 'store') RETURNING id, uuid`,
      [`${tag}-store`],
    );
    const c = await one(`INSERT INTO sellers (name, commission_type, commission_value) VALUES ($1, 'percentage', 1000) RETURNING id, uuid`, [`${tag}-cons`]);
    sellerIds.push(s.id, c.id);
    owner = await principalFor("owner", null, null, "o");
    store = await principalFor("seller", s.id, s.uuid, "s");
    consignment = await principalFor("seller", c.id, c.uuid, "c");
  });

  afterAll(async () => {
    await q(`DELETE FROM direct_sale_items WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM cash_movements WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM direct_sales WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM commission_payments WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM inventory_movements WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM products WHERE id = $1`, [productId]);
    await q(`DELETE FROM cash_accounts WHERE id = $1`, [accountId]);
    await q(`DELETE FROM sync_applied_operations WHERE user_id = ANY($1)`, [userIds]);
    await q(`DELETE FROM device_sessions WHERE user_id = ANY($1)`, [userIds]);
    await q(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);
    await q(`DELETE FROM sellers WHERE id = ANY($1)`, [sellerIds]);
  });

  it("vendedor de tienda: descuenta el inventario principal, entra a caja y guarda su comisión", async () => {
    const before = await stock();
    const payload = sale(store.sellerUuid!);
    const r = await push(store, "createDirectSale", payload);
    expect(r.status).toBe("applied");
    expect(await stock()).toBe(before - 3);
    expect(await one(`SELECT seller_id, total_amount, commission_amount FROM direct_sales WHERE uuid = $1`, [payload.uuid])).toEqual({
      seller_id: store.sellerId, total_amount: 15000, commission_amount: 1500,
    });
    expect(await one(`SELECT type, amount, account_id FROM cash_movements WHERE uuid = $1`, [payload.cashMovementUuid])).toEqual({
      type: "ingreso", amount: 15000, account_id: accountId,
    });
  });

  it("vendedor de consignación: se rechaza y no toca el stock", async () => {
    const before = await stock();
    const r = await push(consignment, "createDirectSale", sale(consignment.sellerUuid!));
    expect(r.status).toBe("rejected");
    expect(r.error).toMatch(/consignación/);
    expect(await stock()).toBe(before);
  });

  it("un vendedor no puede registrar a nombre de otro ni sin vendedor", async () => {
    expect((await push(store, "createDirectSale", sale(consignment.sellerUuid!))).status).toBe("rejected");
    expect((await push(store, "createDirectSale", sale(undefined))).status).toBe("rejected");
  });

  it("no se le entrega mercancía a un vendedor de tienda", async () => {
    const r = await push(owner, "createSellerDelivery", {
      uuid: u(), sellerUuid: store.sellerUuid, deliveryDate: "2026-10-07 15:00:00",
      items: [{ uuid: u(), productUuid, quantity: 1, unitCost: 3000, principalMovementUuid: u(), sellerMovementUuid: u() }],
    });
    expect(r.status).toBe("rejected");
    expect(r.error).toMatch(/vendedor de tienda/);
  });

  it("pasar a tienda exige que no le quede inventario en consignación", async () => {
    const seller = { uuid: consignment.sellerUuid, name: `${tag}-cons`, commissionType: "percentage", commissionValue: 1000, active: true };
    await q(`INSERT INTO inventory_movements (product_id, owner_type, seller_id, type, quantity_delta) VALUES ($1, 'seller', $2, 'entrega_vendedor', 2)`, [productId, consignment.sellerId]);
    const blocked = await push(owner, "upsertSeller", { ...seller, inventoryMode: "store" });
    expect(blocked.status).toBe("rejected");
    expect(blocked.error).toMatch(/consignación/);

    // Without the field (an older app) the mode is kept.
    expect((await push(owner, "upsertSeller", seller)).status).toBe("applied");
    expect((await one(`SELECT inventory_mode FROM sellers WHERE id = $1`, [consignment.sellerId])).inventory_mode).toBe("consignment");

    await q(`INSERT INTO inventory_movements (product_id, owner_type, seller_id, type, quantity_delta) VALUES ($1, 'seller', $2, 'devolucion', -2)`, [productId, consignment.sellerId]);
    expect((await push(owner, "upsertSeller", { ...seller, inventoryMode: "store" })).status).toBe("applied");
    expect((await one(`SELECT inventory_mode FROM sellers WHERE id = $1`, [consignment.sellerId])).inventory_mode).toBe("store");
  });

  it("pagar comisiones: cubre todo lo pendiente hasta la fecha, genera el gasto y no paga dos veces", async () => {
    const { pull } = { pull: (await import("../pull")).pullChanges };
    // One more store sale after the date: must stay pending.
    const later = { ...sale(store.sellerUuid!, 1), saleDate: "2026-10-09 15:00:00" };
    expect((await push(store, "createDirectSale", later)).status).toBe("applied");

    const pending = Number((await one(
      `SELECT COALESCE(SUM(commission_amount), 0) AS t FROM direct_sales WHERE seller_id = $1 AND commission_payment_id IS NULL AND DATE(sale_date) <= '2026-10-08'`,
      [store.sellerId],
    )).t);
    expect(pending).toBe(1500);

    const payment = { uuid: u(), sellerUuid: store.sellerUuid, periodDate: "2026-10-08", accountUuid, paidAt: "2026-10-08 20:00:00", cashMovementUuid: u() };
    // A seller can never pay commissions (owner only).
    expect((await push(store, "createCommissionPayment", payment)).status).toBe("rejected");
    expect((await push(owner, "createCommissionPayment", payment)).status).toBe("applied");

    expect(await one(`SELECT sale_count, total_commission FROM commission_payments WHERE uuid = $1`, [payment.uuid])).toEqual({ sale_count: 1, total_commission: 1500 });
    expect(await one(`SELECT type, amount, source_type FROM cash_movements WHERE uuid = $1`, [payment.cashMovementUuid])).toEqual({
      type: "gasto", amount: 1500, source_type: "commission_payment",
    });
    expect((await one(`SELECT commission_payment_id FROM direct_sales WHERE uuid = $1`, [later.uuid])).commission_payment_id).toBeNull();

    // Nothing left up to that date: a second payment is rejected.
    const again = await push(owner, "createCommissionPayment", { ...payment, uuid: u(), cashMovementUuid: u() });
    expect(again.status).toBe("rejected");
    expect(again.error).toMatch(/No hay comisiones pendientes/);

    // The store seller's pull brings the payment and the sale linked to it.
    const client = await db.$client.connect();
    try {
      const r = await pull(client, { role: "seller", sellerId: store.sellerId }, 0, 100000);
      expect((r.changes.commission_payments ?? []).find((row) => row.uuid === payment.uuid)).toMatchObject({ totalCommission: 1500, periodDate: "2026-10-08" });
      const paidSale = (r.changes.direct_sales ?? []).find((row) => row.commissionPaymentUuid === payment.uuid);
      expect(paidSale).toBeDefined();
    } finally {
      client.release();
    }
  });

  it("venta del dueño: sin vendedor ni comisión", async () => {
    const payload = sale(undefined, 1);
    expect((await push(owner, "createDirectSale", payload)).status).toBe("applied");
    expect(await one(`SELECT seller_id, commission_amount FROM direct_sales WHERE uuid = $1`, [payload.uuid])).toEqual({
      seller_id: null, commission_amount: 0,
    });
  });
});
