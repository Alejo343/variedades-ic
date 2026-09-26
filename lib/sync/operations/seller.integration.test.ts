import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyOperations, type PushPrincipal } from "../push";
import { pullChanges } from "../pull";
import { syncHandlers } from ".";

// Seller operations pushed from a phone (sub-paso 7, parte 2), against a real
// Postgres through the real registry. Fixtures are committed (each operation
// commits on its own) and removed in afterAll. Needs DATABASE_URL.

const url = process.env.DATABASE_URL;
const tag = `zzsell${Date.now()}`;
const u = () => randomUUID();

describe.skipIf(!url)("operaciones del vendedor (Postgres real)", async () => {
  const { db } = await import("@/lib/db");
  const q = async (text: string, params: unknown[] = []) => (await db.$client.query(text, params)).rows;
  const one = async (text: string, params: unknown[] = []) => (await q(text, params))[0];

  let seller: PushPrincipal;
  let owner: PushPrincipal;
  let productId: number;
  let productUuid: string;
  let sellerId: number;
  let sellerUuid: string;
  const push = (principal: PushPrincipal, type: string, payload: unknown) =>
    applyOperations(db, principal, [{ id: u(), type, payload }], syncHandlers).then((r) => r[0]);
  const sellerBalance = async () =>
    Number((await one(`SELECT COALESCE(SUM(quantity_delta), 0) AS b FROM inventory_movements WHERE owner_type = 'seller' AND seller_id = $1 AND product_id = $2`, [sellerId, productId])).b);
  const principalStock = async () => (await one(`SELECT stock FROM products WHERE id = $1`, [productId])).stock as number;

  beforeAll(async () => {
    const p = await one(`INSERT INTO products (name, slug, sku, price, purchase_price, stock) VALUES ($1, $1, $1, 5000, 3000, 10) RETURNING id, uuid`, [tag]);
    const s = await one(`INSERT INTO sellers (name, commission_type, commission_value) VALUES ($1, 'percentage', 1000) RETURNING id, uuid`, [tag]);
    ({ id: productId, uuid: productUuid } = p);
    ({ id: sellerId, uuid: sellerUuid } = s);
    // The seller holds 2 units on consignment.
    await q(`INSERT INTO inventory_movements (product_id, owner_type, seller_id, type, quantity_delta) VALUES ($1, 'seller', $2, 'entrega_vendedor', 2)`, [productId, sellerId]);
    const su = await one(`INSERT INTO users (username, name, password_hash, role, seller_id) VALUES ($1, 'ZZ', 'h', 'seller', $2) RETURNING id`, [`${tag}-s`, sellerId]);
    const ou = await one(`INSERT INTO users (username, name, password_hash, role) VALUES ($1, 'ZZ', 'h', 'owner') RETURNING id`, [`${tag}-o`]);
    const sd = await one(`INSERT INTO device_sessions (user_id, token_hash) VALUES ($1, $2) RETURNING id`, [su.id, `${tag}-s`]);
    const od = await one(`INSERT INTO device_sessions (user_id, token_hash) VALUES ($1, $2) RETURNING id`, [ou.id, `${tag}-o`]);
    seller = { role: "seller", userId: su.id, sessionId: sd.id, sellerId, sellerUuid };
    owner = { role: "owner", userId: ou.id, sessionId: od.id, sellerId: null, sellerUuid: null };
  });

  afterAll(async () => {
    const sales = `SELECT id FROM seller_sales WHERE seller_id = ${sellerId}`;
    const returns = `SELECT id FROM seller_returns WHERE seller_id = ${sellerId}`;
    const losses = `SELECT id FROM seller_losses WHERE seller_id = ${sellerId}`;
    await q(`DELETE FROM seller_sale_items WHERE sale_id IN (${sales})`);
    await q(`DELETE FROM seller_return_items WHERE return_id IN (${returns})`);
    await q(`DELETE FROM seller_loss_items WHERE loss_id IN (${losses})`);
    await q(`DELETE FROM seller_sales WHERE seller_id = $1`, [sellerId]);
    await q(`DELETE FROM seller_returns WHERE seller_id = $1`, [sellerId]);
    await q(`DELETE FROM seller_losses WHERE seller_id = $1`, [sellerId]);
    await q(`DELETE FROM inventory_movements WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM sync_applied_operations WHERE user_id IN (SELECT id FROM users WHERE username LIKE $1)`, [`${tag}%`]);
    await q(`DELETE FROM device_sessions WHERE token_hash LIKE $1`, [`${tag}%`]);
    await q(`DELETE FROM users WHERE username LIKE $1`, [`${tag}%`]);
    await q(`DELETE FROM sellers WHERE id = $1`, [sellerId]);
    await q(`DELETE FROM products WHERE id = $1`, [productId]);
  });

  it("venta: acepta dejar el inventario del vendedor negativo, calcula total y comisión, usa los uuid del celular", async () => {
    const sale = { uuid: u(), itemUuid: u(), movementUuid: u() };
    const result = await push(seller, "createSellerSale", {
      uuid: sale.uuid, sellerUuid, saleDate: "2026-09-20 15:30:00", notes: "sin señal",
      items: [{ uuid: sale.itemUuid, productUuid, quantity: 3, unitPrice: 5000, movementUuid: sale.movementUuid }],
    });
    expect(result.status).toBe("applied");

    expect(await sellerBalance()).toBe(-1); // had 2, sold 3 offline
    expect(await principalStock()).toBe(10); // a seller sale never touches the principal stock
    const row = await one(`SELECT total_amount, commission_amount, notes FROM seller_sales WHERE uuid = $1`, [sale.uuid]);
    expect(row).toEqual({ total_amount: 15000, commission_amount: 1500, notes: "sin señal" }); // 10% commission
    expect(await one(`SELECT quantity, unit_price, subtotal FROM seller_sale_items WHERE uuid = $1`, [sale.itemUuid])).toEqual({ quantity: 3, unit_price: 5000, subtotal: 15000 });
    expect(await one(`SELECT type, quantity_delta, source_type FROM inventory_movements WHERE uuid = $1`, [sale.movementUuid])).toEqual({ type: "venta", quantity_delta: -3, source_type: "seller_sale" });

    // Round trip: the pull returns the sale with the same uuid and the same UTC time the phone sent.
    const client = await db.$client.connect();
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    const pulled = await pullChanges(client, { role: "seller", sellerId }, 0, 100000).finally(async () => {
      await client.query("ROLLBACK");
      client.release();
    });
    expect(pulled.changes.seller_sales?.find((r) => r.uuid === sale.uuid)).toMatchObject({ saleDate: "2026-09-20 15:30:00", sellerUuid, totalAmount: 15000, commissionAmount: 1500 });
  });

  it("devolución: descuenta al vendedor y regresa al inventario principal, en el mismo ledger", async () => {
    const [bBefore, sBefore] = [await sellerBalance(), await principalStock()];
    const ret = { uuid: u(), itemUuid: u(), sellerMovementUuid: u(), principalMovementUuid: u() };
    const result = await push(seller, "createSellerReturn", {
      uuid: ret.uuid, sellerUuid, returnDate: "2026-09-21 10:00:00",
      items: [{ uuid: ret.itemUuid, productUuid, quantity: 1, sellerMovementUuid: ret.sellerMovementUuid, principalMovementUuid: ret.principalMovementUuid }],
    });
    expect(result.status).toBe("applied");
    expect(await sellerBalance()).toBe(bBefore - 1);
    expect(await principalStock()).toBe(sBefore + 1);
    expect(await one(`SELECT owner_type, quantity_delta FROM inventory_movements WHERE uuid = $1`, [ret.principalMovementUuid])).toEqual({ owner_type: "principal", quantity_delta: 1 });
  });

  it("pérdida: el costo lo pone el servidor para un vendedor; el dueño puede fijarlo", async () => {
    const bySeller = { uuid: u(), itemUuid: u() };
    await push(seller, "createSellerLoss", {
      uuid: bySeller.uuid, sellerUuid, type: "dano", lossDate: "2026-09-22 09:00:00",
      items: [{ uuid: bySeller.itemUuid, productUuid, quantity: 1, unitCost: 0, movementUuid: u() }],
    });
    expect(await one(`SELECT unit_cost FROM seller_loss_items WHERE uuid = $1`, [bySeller.itemUuid])).toEqual({ unit_cost: 3000 });

    const byOwner = { uuid: u(), itemUuid: u() };
    const result = await push(owner, "createSellerLoss", {
      uuid: byOwner.uuid, sellerUuid, type: "robo", lossDate: "2026-09-22 09:30:00",
      items: [{ uuid: byOwner.itemUuid, productUuid, quantity: 1, unitCost: 1234, movementUuid: u() }],
    });
    expect(result.status).toBe("applied");
    expect(await one(`SELECT unit_cost FROM seller_loss_items WHERE uuid = $1`, [byOwner.itemUuid])).toEqual({ unit_cost: 1234 });
    expect(await principalStock()).toBe(11); // losses never touch the principal stock
  });

  it("un producto que no existe en el servidor rechaza la operación completa sin dejar nada escrito", async () => {
    const saleUuid = u();
    const result = await push(seller, "createSellerSale", {
      uuid: saleUuid, sellerUuid, saleDate: "2026-09-23 12:00:00",
      items: [
        { uuid: u(), productUuid, quantity: 1, unitPrice: 5000, movementUuid: u() },
        { uuid: u(), productUuid: u(), quantity: 1, unitPrice: 5000, movementUuid: u() },
      ],
    });
    expect(result.status).toBe("rejected");
    expect(result.error).toMatch(/Producto no existe/);
    expect(await q(`SELECT id FROM seller_sales WHERE uuid = $1`, [saleUuid])).toEqual([]);
  });

  it("valida el payload: fecha con formato inválido o cantidad no positiva", async () => {
    const base = { uuid: u(), sellerUuid, saleDate: "2026-09-23T12:00:00Z", items: [{ uuid: u(), productUuid, quantity: 1, unitPrice: 5000, movementUuid: u() }] };
    expect((await push(seller, "createSellerSale", base)).status).toBe("rejected");
    expect((await push(seller, "createSellerSale", { ...base, uuid: u(), saleDate: "2026-09-23 12:00:00", items: [{ ...base.items[0], uuid: u(), quantity: 0 }] })).status).toBe("rejected");
  });
});
