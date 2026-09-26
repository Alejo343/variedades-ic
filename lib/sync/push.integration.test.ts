import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { applyOperations, defineHandler, SyncRejection, type OperationHandlers, type PushPrincipal } from "./push";

// Contract of the push mechanism (sub-paso 7, parte 1), against a real
// Postgres, with throwaway handlers — the real ones come in partes 2-3.
// Each operation commits on its own, so fixtures are committed and removed in
// afterAll. Needs DATABASE_URL (`npm run test:db`).

const url = process.env.DATABASE_URL;
const tag = `zzpush${Date.now()}`;

describe.skipIf(!url)("applyOperations (Postgres real)", async () => {
  const { db } = await import("@/lib/db");
  const q = async (text: string, params: unknown[] = []) => (await db.$client.query(text, params)).rows;

  let owner: PushPrincipal;
  let seller: PushPrincipal;
  const opIds: string[] = [];
  const op = (type: string, payload: unknown) => {
    const id = randomUUID();
    opIds.push(id);
    return { id, type, payload };
  };

  const handlers: OperationHandlers = {
    upsertCategory: defineHandler({
      schema: z.object({ slug: z.string() }),
      apply: async (tx, p) => { await tx.execute(sql`INSERT INTO categories (name, slug) VALUES ('ZZ', ${p.slug})`); },
    }),
    // Writes, then rejects: the write must be rolled back.
    upsertDistributor: defineHandler({
      schema: z.object({ name: z.string() }),
      apply: async (tx, p) => {
        await tx.execute(sql`INSERT INTO distributors (name) VALUES (${p.name})`);
        throw new SyncRejection("Distribuidor inválido");
      },
    }),
    upsertSeller: defineHandler({
      schema: z.object({}),
      apply: async () => { throw new Error("fallo inesperado (bug o base caída)"); },
    }),
    createSellerSale: defineHandler({
      schema: z.object({ sellerUuid: z.string(), slug: z.string() }),
      sellerUuid: (p) => p.sellerUuid,
      apply: async (tx, p) => { await tx.execute(sql`INSERT INTO categories (name, slug) VALUES ('ZZ', ${p.slug})`); },
    }),
  };

  beforeAll(async () => {
    const [s] = await q(`INSERT INTO sellers (name, commission_type, commission_value) VALUES ($1, 'percentage', 1000) RETURNING id, uuid`, [tag]);
    const [ou] = await q(`INSERT INTO users (username, name, password_hash, role) VALUES ($1, 'ZZ', 'h', 'owner') RETURNING id`, [`${tag}-owner`]);
    const [su] = await q(`INSERT INTO users (username, name, password_hash, role, seller_id) VALUES ($1, 'ZZ', 'h', 'seller', $2) RETURNING id`, [`${tag}-seller`, s.id]);
    const [od] = await q(`INSERT INTO device_sessions (user_id, token_hash) VALUES ($1, $2) RETURNING id`, [ou.id, `${tag}-o`]);
    const [sd] = await q(`INSERT INTO device_sessions (user_id, token_hash) VALUES ($1, $2) RETURNING id`, [su.id, `${tag}-s`]);
    owner = { role: "owner", userId: ou.id, sessionId: od.id, sellerId: null, sellerUuid: null };
    seller = { role: "seller", userId: su.id, sessionId: sd.id, sellerId: s.id, sellerUuid: s.uuid };
  });

  afterAll(async () => {
    await q(`DELETE FROM sync_applied_operations WHERE op_id = ANY($1::uuid[])`, [opIds]);
    await q(`DELETE FROM categories WHERE slug LIKE $1`, [`${tag}%`]);
    await q(`DELETE FROM distributors WHERE name LIKE $1`, [`${tag}%`]);
    await q(`DELETE FROM device_sessions WHERE token_hash LIKE $1`, [`${tag}%`]);
    await q(`DELETE FROM users WHERE username LIKE $1`, [`${tag}%`]);
    await q(`DELETE FROM sellers WHERE name = $1`, [tag]);
  });

  it("aplica, y reenviar la misma operación no la aplica dos veces", async () => {
    const o = op("upsertCategory", { slug: `${tag}-a` });
    expect(await applyOperations(db, owner, [o], handlers)).toEqual([{ id: o.id, status: "applied" }]);
    expect(await applyOperations(db, owner, [o], handlers)).toEqual([{ id: o.id, status: "applied", duplicate: true }]);
    expect(await q(`SELECT count(*)::int AS n FROM categories WHERE slug = $1`, [`${tag}-a`])).toEqual([{ n: 1 }]);
  });

  it("un rechazo deshace lo que la operación alcanzó a escribir y se recuerda", async () => {
    const o = op("upsertDistributor", { name: `${tag}-dist` });
    expect(await applyOperations(db, owner, [o], handlers)).toEqual([{ id: o.id, status: "rejected", error: "Distribuidor inválido" }]);
    expect(await q(`SELECT count(*)::int AS n FROM distributors WHERE name = $1`, [`${tag}-dist`])).toEqual([{ n: 0 }]);
    expect(await applyOperations(db, owner, [o], handlers)).toEqual([{ id: o.id, status: "rejected", error: "Distribuidor inválido", duplicate: true }]);
  });

  it("rechaza payload inválido, violaciones de integridad, tipos desconocidos o sin implementar", async () => {
    const bad = op("upsertCategory", { slug: 123 });
    const dupe = op("upsertCategory", { slug: `${tag}-a` }); // slug already taken → 23505
    const unknown = op("dropDatabase", {});
    const notYet = op("createPurchaseOrder", {});
    const results = await applyOperations(db, owner, [bad, dupe, unknown, notYet], handlers);
    expect(results.map((r) => r.status)).toEqual(["rejected", "rejected", "rejected", "rejected"]);
    expect(results[1].error).toMatch(/ya existe|duplicad/i);
    expect(results[2].error).toMatch(/desconocida/);
  });

  it("un vendedor solo aplica operaciones propias", async () => {
    const own = op("createSellerSale", { sellerUuid: seller.sellerUuid, slug: `${tag}-own` });
    const other = op("createSellerSale", { sellerUuid: randomUUID(), slug: `${tag}-other` });
    const ownerOnly = op("upsertCategory", { slug: `${tag}-nope` });
    const results = await applyOperations(db, seller, [own, other, ownerOnly], handlers);
    expect(results.map((r) => r.status)).toEqual(["applied", "rejected", "rejected"]);
    expect(await q(`SELECT slug FROM categories WHERE slug IN ($1, $2, $3)`, [`${tag}-own`, `${tag}-other`, `${tag}-nope`])).toEqual([{ slug: `${tag}-own` }]);
  });

  it("un error inesperado no se registra y detiene el lote (las siguientes quedan pendientes)", async () => {
    const before = op("upsertCategory", { slug: `${tag}-before` });
    const boom = op("upsertSeller", {});
    const after = op("upsertCategory", { slug: `${tag}-after` });
    const results = await applyOperations(db, owner, [before, boom, after], handlers);
    expect(results.map((r) => r.status)).toEqual(["applied", "error", "skipped"]);
    expect(await q(`SELECT count(*)::int AS n FROM sync_applied_operations WHERE op_id = $1`, [boom.id])).toEqual([{ n: 0 }]);
    expect(await q(`SELECT count(*)::int AS n FROM categories WHERE slug = $1`, [`${tag}-after`])).toEqual([{ n: 0 }]);
  });
});
