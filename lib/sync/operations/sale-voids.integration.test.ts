import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { aggregatePeriod } from "@/lib/db/queries/settlements";
import { pendingCommission } from "@/lib/db/queries/commission-payments";
import { SALE_ALREADY_VOIDED, SALE_COMMISSION_PAID, SALE_IN_SETTLEMENT } from "@/lib/domain/sale-void";
import { applyOperations, type PushPrincipal } from "../push";
import { syncHandlers } from ".";

// Voiding a sale (lib/domain/sale-void.ts) from the owner's phone: units back
// with the phone's movement uuids, the cash income gone (with its tombstone),
// the sale kept and marked, and refused when the sale is already in a
// settlement / a paid commission. Real Postgres through the real registry.

const url = process.env.DATABASE_URL;
const tag = `zzvoid${Date.now()}`;
const u = () => randomUUID();

describe.skipIf(!url)("anular ventas (Postgres real)", async () => {
  const { db } = await import("@/lib/db");
  const q = async (text: string, params: unknown[] = []) => (await db.$client.query(text, params)).rows;
  const one = async (text: string, params: unknown[] = []) => (await q(text, params))[0];

  let owner: PushPrincipal;
  let storeSeller: PushPrincipal;
  let productId: number;
  let productUuid: string;
  let accountUuid: string;
  let accountId: number;
  let storeId: number;
  let storeUuid: string;
  let consId: number;
  let consUuid: string;
  const userIds: number[] = [];

  const push = (who: PushPrincipal, type: string, payload: unknown) =>
    applyOperations(db, who, [{ id: u(), type, payload }], syncHandlers).then((r) => r[0]);
  const stock = async () => (await one(`SELECT stock FROM products WHERE id = $1`, [productId])).stock as number;
  const sellerStock = async (sellerId: number) =>
    Number((await one(`SELECT COALESCE(SUM(quantity_delta), 0) AS s FROM inventory_movements WHERE owner_type = 'seller' AND seller_id = $1`, [sellerId])).s);

  async function directSale(sellerUuid?: string, quantity = 2) {
    const payload = {
      uuid: u(), saleDate: "2026-10-20 15:00:00", accountUuid, sellerUuid, cashMovementUuid: u(),
      items: [{ uuid: u(), productUuid, quantity, unitPrice: 5000, movementUuid: u() }],
    };
    expect((await push(sellerUuid ? storeSeller : owner, "createDirectSale", payload)).status).toBe("applied");
    return payload;
  }
  async function sellerSale(quantity = 2) {
    const payload = {
      uuid: u(), sellerUuid: consUuid, saleDate: "2026-10-20 15:00:00",
      items: [{ uuid: u(), productUuid, quantity, unitPrice: 5000, movementUuid: u() }],
    };
    expect((await push(owner, "createSellerSale", payload)).status).toBe("applied");
    return payload;
  }
  const voidOf = (sale: { uuid: string; items: { uuid: string }[] }, reason?: string) => ({
    saleUuid: sale.uuid, voidedAt: "2026-10-21 10:00:00", reason,
    items: sale.items.map((i) => ({ itemUuid: i.uuid, movementUuid: u() })),
  });

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
    ({ id: productId, uuid: productUuid } = await one(
      `INSERT INTO products (name, slug, sku, price, commission_bps, stock) VALUES ($1, $1, $1, 5000, 1000, 20) RETURNING id, uuid`, [tag]));
    ({ id: accountId, uuid: accountUuid } = await one(`INSERT INTO cash_accounts (name) VALUES ($1) RETURNING id, uuid`, [tag]));
    ({ id: storeId, uuid: storeUuid } = await one(`INSERT INTO sellers (name, inventory_mode) VALUES ($1, 'store') RETURNING id, uuid`, [`${tag}-s`]));
    ({ id: consId, uuid: consUuid } = await one(`INSERT INTO sellers (name) VALUES ($1) RETURNING id, uuid`, [`${tag}-c`]));
    owner = await principalFor("owner", null, null, "o");
    storeSeller = await principalFor("seller", storeId, storeUuid, "s");
    // The consignment seller holds 10 units to sell.
    await q(`INSERT INTO inventory_movements (product_id, owner_type, seller_id, type, quantity_delta) VALUES ($1, 'seller', $2, 'entrega_vendedor', 10)`, [productId, consId]);
  });

  afterAll(async () => {
    await q(`DELETE FROM direct_sale_items WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM seller_sale_items WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM cash_movements WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM direct_sales WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM commission_payments WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM seller_sales WHERE seller_id = $1`, [consId]);
    await q(`DELETE FROM settlements WHERE seller_id = $1`, [consId]);
    await q(`DELETE FROM inventory_movements WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM products WHERE id = $1`, [productId]);
    await q(`DELETE FROM cash_accounts WHERE id = $1`, [accountId]);
    await q(`DELETE FROM sync_applied_operations WHERE user_id = ANY($1)`, [userIds]);
    await q(`DELETE FROM device_sessions WHERE user_id = ANY($1)`, [userIds]);
    await q(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);
    await q(`DELETE FROM sellers WHERE id = ANY($1)`, [[storeId, consId]]);
  });

  it("venta en local: devuelve el stock con el uuid del celular, borra el ingreso y marca la venta", async () => {
    const before = await stock();
    const sale = await directSale(undefined, 3);
    expect(await stock()).toBe(before - 3);
    const income = await one(`SELECT uuid FROM cash_movements WHERE uuid = $1`, [sale.cashMovementUuid]);
    expect(income).toBeTruthy();

    const op = voidOf(sale, "  Cobré de más  ");
    expect((await push(owner, "voidDirectSale", op)).status).toBe("applied");

    expect(await stock()).toBe(before);
    const back = await one(`SELECT type, quantity_delta, owner_type, source_type FROM inventory_movements WHERE uuid = $1`, [op.items[0].movementUuid]);
    expect(back).toEqual({ type: "anulacion", quantity_delta: 3, owner_type: "principal", source_type: "direct_sale" });
    expect(await one(`SELECT 1 FROM cash_movements WHERE uuid = $1`, [sale.cashMovementUuid])).toBeUndefined();
    expect(await one(`SELECT 1 AS ok FROM sync_tombstones WHERE table_name = 'cash_movements' AND uuid = $1`, [sale.cashMovementUuid])).toEqual({ ok: 1 });
    const row = await one(`SELECT voided_at IS NOT NULL AS voided, void_reason FROM direct_sales WHERE uuid = $1`, [sale.uuid]);
    expect(row).toEqual({ voided: true, void_reason: "Cobré de más" });
  });

  it("no se anula dos veces", async () => {
    const sale = await directSale();
    expect((await push(owner, "voidDirectSale", voidOf(sale))).status).toBe("applied");
    const again = await push(owner, "voidDirectSale", voidOf(sale));
    expect(again).toMatchObject({ status: "rejected", error: SALE_ALREADY_VOIDED });
  });

  it("si falta el movimiento de un producto, se rechaza sin escribir nada", async () => {
    const sale = await directSale();
    const before = await stock();
    const r = await push(owner, "voidDirectSale", { ...voidOf(sale), items: [{ itemUuid: u(), movementUuid: u() }] });
    expect(r.status).toBe("rejected");
    expect(await stock()).toBe(before);
    expect((await one(`SELECT voided_at FROM direct_sales WHERE uuid = $1`, [sale.uuid])).voided_at).toBeNull();
  });

  it("un vendedor no puede anular, ni su propia venta", async () => {
    const sale = await directSale(storeUuid);
    const r = await push(storeSeller, "voidDirectSale", voidOf(sale));
    expect(r.status).toBe("rejected");
  });

  it("venta de tienda: anulada sale de la comisión pendiente; con la comisión pagada no se anula", async () => {
    const pending = await directSale(storeUuid);
    const before = await pendingCommission(db, storeId, "2026-10-31");
    expect((await push(owner, "voidDirectSale", voidOf(pending))).status).toBe("applied");
    const after = await pendingCommission(db, storeId, "2026-10-31");
    expect(after.saleCount).toBe(before.saleCount - 1);

    const paid = await directSale(storeUuid);
    const payment = {
      uuid: u(), sellerUuid: storeUuid, periodDate: "2026-10-31", accountUuid, paidAt: "2026-10-22 10:00:00", cashMovementUuid: u(),
    };
    expect((await push(owner, "createCommissionPayment", payment)).status).toBe("applied");
    expect(await push(owner, "voidDirectSale", voidOf(paid))).toMatchObject({ status: "rejected", error: SALE_COMMISSION_PAID });
  });

  it("venta de consignación: devuelve las unidades al vendedor, no entra a la liquidación, y ya liquidada no se anula", async () => {
    const before = await sellerStock(consId);
    const voided = await sellerSale(2);
    expect(await sellerStock(consId)).toBe(before - 2);
    expect((await push(owner, "voidSellerSale", voidOf(voided))).status).toBe("applied");
    expect(await sellerStock(consId)).toBe(before);

    const kept = await sellerSale(1);
    expect((await aggregatePeriod(db, consId, "2026-10-31")).totalSales).toBe(5000);
    const settlement = { uuid: u(), sellerUuid: consUuid, periodDate: "2026-10-31" };
    expect((await push(owner, "createSettlement", settlement)).status).toBe("applied");
    expect((await one(`SELECT settlement_id FROM seller_sales WHERE uuid = $1`, [voided.uuid])).settlement_id).toBeNull();
    expect(await push(owner, "voidSellerSale", voidOf(kept))).toMatchObject({ status: "rejected", error: SALE_IN_SETTLEMENT });
  });
});
