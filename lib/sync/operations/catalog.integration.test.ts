import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyOperations, type PushPrincipal } from "../push";
import { syncHandlers } from ".";

// Catalog upserts pushed by the owner's phone (sub-paso 7, parte 3a), against
// a real Postgres through the real registry. Fixtures are committed and
// removed in afterAll. Needs DATABASE_URL (`npm run test:db`).

const url = process.env.DATABASE_URL;
const tag = `zzcat${Date.now()}`;
const u = () => randomUUID();

describe.skipIf(!url)("operaciones de catálogo (Postgres real)", async () => {
  const { db } = await import("@/lib/db");
  const q = async (text: string, params: unknown[] = []) => (await db.$client.query(text, params)).rows;
  const one = async (text: string, params: unknown[] = []) => (await q(text, params))[0];

  let owner: PushPrincipal;
  const push = (type: string, payload: unknown) => applyOperations(db, owner, [{ id: u(), type, payload }], syncHandlers).then((r) => r[0]);
  const catUuid = u();
  const prodUuid = u();
  const img = { a: u(), b: u() };

  beforeAll(async () => {
    const ou = await one(`INSERT INTO users (username, name, password_hash, role) VALUES ($1, 'ZZ', 'h', 'owner') RETURNING id`, [tag]);
    const od = await one(`INSERT INTO device_sessions (user_id, token_hash) VALUES ($1, $2) RETURNING id`, [ou.id, tag]);
    owner = { role: "owner", userId: ou.id, sessionId: od.id, sellerId: null, sellerUuid: null };
  });

  afterAll(async () => {
    await q(`DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE slug LIKE $1)`, [`${tag}%`]);
    await q(`DELETE FROM products WHERE slug LIKE $1`, [`${tag}%`]);
    await q(`DELETE FROM categories WHERE slug LIKE $1`, [`${tag}%`]);
    await q(`DELETE FROM sellers WHERE name LIKE $1`, [`${tag}%`]);
    await q(`DELETE FROM distributors WHERE name LIKE $1`, [`${tag}%`]);
    await q(`DELETE FROM cash_accounts WHERE name LIKE $1`, [`${tag}%`]);
    await q(`DELETE FROM sync_applied_operations WHERE user_id = $1`, [owner.userId]);
    await q(`DELETE FROM device_sessions WHERE token_hash = $1`, [tag]);
    await q(`DELETE FROM users WHERE username = $1`, [tag]);
  });

  it("categoría: crea con el uuid del celular y luego actualiza la misma fila", async () => {
    expect((await push("upsertCategory", { uuid: catUuid, name: "Tecnología", slug: `${tag}-tec`, description: null, active: true })).status).toBe("applied");
    expect((await push("upsertCategory", { uuid: catUuid, name: "Tecnología y más", slug: `${tag}-tec`, description: "x", active: true })).status).toBe("applied");
    expect(await q(`SELECT name, description FROM categories WHERE uuid = $1`, [catUuid])).toEqual([{ name: "Tecnología y más", description: "x" }]);
  });

  it("producto nuevo: el servidor asigna el SKU con el prefijo de la categoría y el stock arranca en 0", async () => {
    const r = await push("upsertProduct", {
      uuid: prodUuid, name: "Audífonos", slug: `${tag}-aud`, description: null, price: 50000, purchasePrice: 30000,
      categoryUuid: catUuid, distributorCode: `${tag}-AUD1`, minStock: 2, warrantyMonths: 6, active: true,
      sku: "GEN-00001", stock: 99, // the phone's provisional values must be ignored
      images: [
        { uuid: img.a, url: "/uploads/products/a.webp", alt: null, displayOrder: 0, isPrimary: true },
        { uuid: img.b, url: "/uploads/products/b.webp", alt: null, displayOrder: 1, isPrimary: false },
      ],
    });
    expect(r.status).toBe("applied");
    const p = await one(`SELECT sku, stock, price, category_id IS NOT NULL AS has_cat FROM products WHERE uuid = $1`, [prodUuid]);
    expect(p.sku).toMatch(/^TECN-\d{5}$/);
    expect(p).toMatchObject({ stock: 0, price: 50000, has_cat: true });
    expect(await q(`SELECT uuid, is_primary FROM product_images WHERE product_id = (SELECT id FROM products WHERE uuid = $1) ORDER BY display_order`, [prodUuid])).toEqual([
      { uuid: img.a, is_primary: true },
      { uuid: img.b, is_primary: false },
    ]);
  });

  it("producto existente: actualiza sin tocar stock ni campos que solo tiene la web; el SKU automático sigue a la categoría; la foto quitada deja lápida", async () => {
    await q(`UPDATE products SET featured = true, whatsapp_text = 'hola', stock = 7 WHERE uuid = $1`, [prodUuid]);
    const { sku } = await one(`SELECT sku FROM products WHERE uuid = $1`, [prodUuid]);
    const r = await push("upsertProduct", {
      uuid: prodUuid, name: "Audífonos Pro", slug: `${tag}-aud`, description: null, price: 55000, purchasePrice: 30000,
      categoryUuid: null, distributorCode: null, minStock: 2, warrantyMonths: null, active: true,
      images: [{ uuid: img.b, url: "/uploads/products/b.webp", alt: null, displayOrder: 0, isPrimary: true }],
    });
    expect(r.status).toBe("applied");
    expect(await one(`SELECT name, price, sku, stock, featured, whatsapp_text, category_id FROM products WHERE uuid = $1`, [prodUuid])).toEqual({
      // Tecnología → sin categoría: TECN-NNNNN becomes GEN-NNNNN (same number).
      name: "Audífonos Pro", price: 55000, sku: sku.replace(/^TECN-/, "GEN-"), stock: 7, featured: true, whatsapp_text: "hola", category_id: null,
    });
    expect(await q(`SELECT uuid, is_primary, display_order FROM product_images WHERE product_id = (SELECT id FROM products WHERE uuid = $1)`, [prodUuid])).toEqual([
      { uuid: img.b, is_primary: true, display_order: 0 },
    ]);
    expect(await q(`SELECT table_name FROM sync_tombstones WHERE uuid = $1`, [img.a])).toEqual([{ table_name: "product_images" }]);
  });

  it("producto con SKU propio: cambiar de categoría no lo toca", async () => {
    const customSku = `${tag}-SKU`.toUpperCase();
    await q(`UPDATE products SET sku = $2 WHERE uuid = $1`, [prodUuid, customSku]);
    const r = await push("upsertProduct", {
      uuid: prodUuid, name: "Audífonos Pro", slug: `${tag}-aud`, description: null, price: 55000, purchasePrice: 30000,
      categoryUuid: catUuid, distributorCode: null, minStock: 2, warrantyMonths: null, active: true,
    });
    expect(r.status).toBe("applied");
    expect(await one(`SELECT sku, category_id IS NOT NULL AS has_cat FROM products WHERE uuid = $1`, [prodUuid])).toEqual({ sku: customSku, has_cat: true });
    await push("upsertProduct", {
      uuid: prodUuid, name: "Audífonos Pro", slug: `${tag}-aud`, description: null, price: 55000, purchasePrice: 30000,
      categoryUuid: null, distributorCode: null, minStock: 2, warrantyMonths: null, active: true,
    });
  });

  it("producto: sin `images` no toca la galería", async () => {
    await push("upsertProduct", {
      uuid: prodUuid, name: "Audífonos Pro", slug: `${tag}-aud`, description: null, price: 56000, purchasePrice: 30000,
      categoryUuid: null, distributorCode: null, minStock: 2, warrantyMonths: null, active: true,
    });
    expect(await q(`SELECT uuid FROM product_images WHERE product_id = (SELECT id FROM products WHERE uuid = $1)`, [prodUuid])).toEqual([{ uuid: img.b }]);
  });

  it("rechaza fotos no subidas, galerías sin exactamente una principal, categorías inexistentes y slugs ajenos", async () => {
    const base = { name: "X", description: null, price: 1, purchasePrice: 0, categoryUuid: null, distributorCode: null, minStock: 0, warrantyMonths: null, active: true };
    const local = await push("upsertProduct", { ...base, uuid: u(), slug: `${tag}-x1`, images: [{ uuid: u(), url: "file:///data/foto.jpg", alt: null, displayOrder: 0, isPrimary: true }] });
    expect(local).toMatchObject({ status: "rejected" });
    expect(local.error).toMatch(/subido/);
    const twoPrimaries = await push("upsertProduct", { ...base, uuid: u(), slug: `${tag}-x2`, images: [
      { uuid: u(), url: "/uploads/products/1.webp", alt: null, displayOrder: 0, isPrimary: true },
      { uuid: u(), url: "/uploads/products/2.webp", alt: null, displayOrder: 1, isPrimary: true },
    ] });
    expect(twoPrimaries.status).toBe("rejected");
    expect((await push("upsertProduct", { ...base, uuid: u(), slug: `${tag}-x3`, categoryUuid: u() })).error).toMatch(/Categoría no existe/);
    expect((await push("upsertProduct", { ...base, uuid: u(), slug: `${tag}-aud` })).error).toMatch(/Ya existe/);
  });

  it("vendedor, distribuidor y cuenta: crean y actualizan por uuid", async () => {
    const s = u(), d = u(), a = u();
    await push("upsertSeller", { uuid: s, name: `${tag}-Maria`, phone: null, city: "Bogotá", commissionType: "percentage", commissionValue: 1500, active: true, notes: null });
    await push("upsertSeller", { uuid: s, name: `${tag}-Maria`, phone: "300", city: "Medellín", commissionType: "fixed_per_unit", commissionValue: 2000, active: false, notes: null });
    expect(await one(`SELECT city, commission_type, commission_value, active FROM sellers WHERE uuid = $1`, [s])).toEqual({ city: "Medellín", commission_type: "fixed_per_unit", commission_value: 2000, active: false });

    await push("upsertDistributor", { uuid: d, name: `${tag}-Dist`, city: null, phone: null, notes: null, active: true });
    await push("upsertDistributor", { uuid: d, name: `${tag}-Dist`, city: "Cali", phone: null, notes: null, active: true });
    expect(await one(`SELECT city FROM distributors WHERE uuid = $1`, [d])).toEqual({ city: "Cali" });

    await push("upsertCashAccount", { uuid: a, name: `${tag}-Nequi`, type: "banco", active: true, notes: null });
    await push("upsertCashAccount", { uuid: a, name: `${tag}-Nequi`, type: "banco", active: false, notes: "cerrada" });
    expect(await one(`SELECT type, active, notes FROM cash_accounts WHERE uuid = $1`, [a])).toEqual({ type: "banco", active: false, notes: "cerrada" });
  });
});
