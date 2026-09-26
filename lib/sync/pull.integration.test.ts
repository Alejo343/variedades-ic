import { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { pullChanges, type PullResult } from "./pull";

// Contract of GET /api/sync/pull (sub-paso 6 of the mobile sync), against a
// real Postgres. Everything runs in one REPEATABLE READ transaction that is
// rolled back, exactly like the route but without committing the fixtures.
// Needs DATABASE_URL (`npm run test:db`).

const url = process.env.DATABASE_URL;
const owner = { role: "owner" as const, sellerId: null };

type Row = Record<string, unknown>;
const find = (r: PullResult, table: string, uuid: string) => (r.changes[table] ?? []).find((row: Row) => row.uuid === uuid) as Row | undefined;

describe.skipIf(!url)("pullChanges (Postgres real)", () => {
  let c: Client;
  let before: number;
  const ids: Record<string, { id: number; uuid: string }> = {};

  beforeAll(async () => {
    c = new Client({ connectionString: url });
    await c.connect();
  });
  afterAll(async () => { await c?.end(); });

  const ins = async (key: string, sql: string, params: unknown[] = []) => {
    const { rows } = await c.query(`${sql} RETURNING id, uuid`, params);
    ids[key] = rows[0];
    return rows[0] as { id: number; uuid: string };
  };

  beforeEach(async () => {
    await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    before = Number((await c.query("SELECT last_value FROM sync_version_seq")).rows[0].last_value);
    const cat = await ins("cat", `INSERT INTO categories (name, slug) VALUES ('ZZ Cat', 'zz-cat-pull')`);
    const prod = await ins("prod", `INSERT INTO products (name, slug, sku, price, purchase_price, category_id, stock) VALUES ('ZZ Prod', 'zz-prod-pull', 'ZZ-PULL-1', 5000, 3000, $1, 10)`, [cat.id]);
    await ins("img", `INSERT INTO product_images (product_id, url, is_primary) VALUES ($1, '/uploads/products/zz.webp', true)`, [prod.id]);
    const acc = await ins("acc", `INSERT INTO cash_accounts (name) VALUES ('ZZ Caja')`);
    const sale = await ins("sale", `INSERT INTO direct_sales (total_amount, account_id) VALUES (5000, $1)`, [acc.id]);
    await ins("saleItem", `INSERT INTO direct_sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, 1, 5000, 5000)`, [sale.id, prod.id]);
    await ins("cash", `INSERT INTO cash_movements (type, amount, concept, source_type, source_id, account_id) VALUES ('ingreso', 5000, 'Venta', 'direct_sale', $1, $2)`, [sale.id, acc.id]);
    for (const who of ["a", "b"]) {
      const s = await ins(`seller_${who}`, `INSERT INTO sellers (name, commission_type, commission_value) VALUES ($1, 'percentage', 1000)`, [`ZZ Seller ${who}`]);
      const d = await ins(`delivery_${who}`, `INSERT INTO seller_deliveries (seller_id) VALUES ($1)`, [s.id]);
      await ins(`deliveryItem_${who}`, `INSERT INTO seller_delivery_items (delivery_id, product_id, quantity, unit_cost) VALUES ($1, $2, 2, 3000)`, [d.id, prod.id]);
      await ins(`move_${who}`, `INSERT INTO inventory_movements (product_id, owner_type, seller_id, type, quantity_delta) VALUES ($1, 'seller', $2, 'entrega_vendedor', 2)`, [prod.id, s.id]);
      const l = await ins(`loss_${who}`, `INSERT INTO seller_losses (seller_id, type) VALUES ($1, 'dano')`, [s.id]);
      await ins(`lossItem_${who}`, `INSERT INTO seller_loss_items (loss_id, product_id, quantity, unit_cost) VALUES ($1, $2, 1, 3000)`, [l.id, prod.id]);
      const set = await ins(`settlement_${who}`, `INSERT INTO settlements (seller_id, period_date, total_sales, total_commission, total_losses, amount_due) VALUES ($1, '2026-09-20', 5000, 500, 3000, 7500)`, [s.id]);
      await ins(`sellerSale_${who}`, `INSERT INTO seller_sales (seller_id, total_amount, settlement_id) VALUES ($1, 5000, $2)`, [s.id, set.id]);
    }
    await ins("principalMove", `INSERT INTO inventory_movements (product_id, owner_type, type, quantity_delta) VALUES ($1, 'principal', 'compra', 10)`, [ids.prod.id]);
  });
  afterEach(async () => { await c.query("ROLLBACK"); });

  it("el dueño recibe las filas con las referencias como uuid, nunca con id locales", async () => {
    const r = await pullChanges(c, owner, before, 1000);
    const prod = find(r, "products", ids.prod.uuid)!;
    expect(prod).toMatchObject({ name: "ZZ Prod", categoryUuid: ids.cat.uuid, purchasePrice: 3000, stock: 10, active: true });
    expect(prod).not.toHaveProperty("id");
    expect(prod).not.toHaveProperty("categoryId");
    expect(prod.createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/); // same format as the phone's SQLite
    expect(find(r, "product_images", ids.img.uuid)).toMatchObject({ productUuid: ids.prod.uuid, isPrimary: true });
    expect(find(r, "direct_sale_items", ids.saleItem.uuid)).toMatchObject({ saleUuid: ids.sale.uuid, productUuid: ids.prod.uuid });
    expect(find(r, "cash_movements", ids.cash.uuid)).toMatchObject({ sourceType: "direct_sale", sourceUuid: ids.sale.uuid, accountUuid: ids.acc.uuid });
    expect(find(r, "seller_sales", ids.sellerSale_a.uuid)).toMatchObject({ sellerUuid: ids.seller_a.uuid, settlementUuid: ids.settlement_a.uuid });
    expect(find(r, "settlements", ids.settlement_a.uuid)).toMatchObject({ periodDate: "2026-09-20" });
  });

  it("con el cursor devuelto no vuelve a traer nada", async () => {
    const first = await pullChanges(c, owner, before, 1000);
    expect(first.hasMore).toBe(false);
    const again = await pullChanges(c, owner, first.cursor, 1000);
    expect(Object.values(again.changes).flat()).toHaveLength(0);
    expect(again.tombstones).toHaveLength(0);
    expect(again.cursor).toBe(first.cursor);
  });

  it("por páginas: cada fila llega exactamente una vez y el cursor avanza", async () => {
    let cursor = before;
    const seen: string[] = [];
    for (let page = 0; page < 100; page++) {
      const r = await pullChanges(c, owner, cursor, 5);
      seen.push(...Object.values(r.changes).flat().map((row) => row.uuid as string));
      expect(r.cursor).toBeGreaterThanOrEqual(cursor);
      cursor = r.cursor;
      if (!r.hasMore) break;
    }
    const expected = Object.values(ids).map((x) => x.uuid);
    expect(seen.sort()).toEqual([...expected].sort());
  });

  it("un vendedor recibe el catálogo y solo lo suyo, sin costos de compra", async () => {
    const r = await pullChanges(c, { role: "seller", sellerId: ids.seller_a.id }, before, 1000);
    const uuids = new Set(Object.values(r.changes).flat().map((row) => row.uuid as string));
    for (const k of ["cat", "prod", "img", "seller_a", "delivery_a", "deliveryItem_a", "move_a", "loss_a", "lossItem_a", "settlement_a", "sellerSale_a"]) {
      expect(uuids.has(ids[k].uuid), k).toBe(true);
    }
    for (const k of ["seller_b", "delivery_b", "deliveryItem_b", "move_b", "loss_b", "lossItem_b", "settlement_b", "sellerSale_b", "principalMove", "acc", "sale", "saleItem", "cash"]) {
      expect(uuids.has(ids[k].uuid), k).toBe(false);
    }
    for (const t of ["cash_accounts", "cash_movements", "direct_sales", "direct_sale_items", "distributors", "purchase_orders", "purchase_order_items", "purchase_payments"]) {
      expect(r.changes[t], t).toBeUndefined();
    }
    expect(find(r, "products", ids.prod.uuid)!.purchasePrice).toBe(0);
    expect(find(r, "seller_delivery_items", ids.deliveryItem_a.uuid)!.unitCost).toBe(0);
    expect(find(r, "seller_loss_items", ids.lossItem_a.uuid)!.unitCost).toBe(3000); // what the seller owes
  });

  it("un borrado llega como lápida", async () => {
    const r1 = await pullChanges(c, owner, before, 1000);
    await c.query("DELETE FROM product_images WHERE id = $1", [ids.img.id]);
    const r2 = await pullChanges(c, owner, r1.cursor, 1000);
    expect(r2.tombstones).toEqual([{ table: "product_images", uuid: ids.img.uuid }]);
    expect(r2.cursor).toBeGreaterThan(r1.cursor);
  });
});
