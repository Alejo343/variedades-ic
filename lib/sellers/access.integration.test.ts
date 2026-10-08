import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Seller app logins, shared by the panel and the owner's phone. Real Postgres;
// fixtures removed in afterAll.

const url = process.env.DATABASE_URL;
const tag = `zzaccess${Date.now()}`;

describe.skipIf(!url)("acceso a la app de un vendedor (Postgres real)", async () => {
  const { db } = await import("@/lib/db");
  const { createSellerAccess, updateSellerAccess } = await import("./access");
  const q = async (text: string, params: unknown[] = []) => (await db.$client.query(text, params)).rows;
  let sellerId: number;
  let otherId: number;

  beforeAll(async () => {
    sellerId = (await q(`INSERT INTO sellers (name, commission_type, commission_value) VALUES ($1, 'percentage', 0) RETURNING id`, [`${tag}-a`]))[0].id;
    otherId = (await q(`INSERT INTO sellers (name, commission_type, commission_value) VALUES ($1, 'percentage', 0) RETURNING id`, [`${tag}-b`]))[0].id;
  });

  afterAll(async () => {
    await q(`DELETE FROM users WHERE seller_id = ANY($1)`, [[sellerId, otherId]]);
    await q(`DELETE FROM sellers WHERE id = ANY($1)`, [[sellerId, otherId]]);
  });

  it("crea el usuario normalizado, uno por vendedor y sin repetir nombre", async () => {
    const created = await createSellerAccess(sellerId, { username: `  ${tag.toUpperCase()} `, password: "secreta123" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ username: tag, active: true });
    expect(created.body).not.toHaveProperty("passwordHash");

    expect((await createSellerAccess(sellerId, { username: `${tag}-2`, password: "secreta123" })).status).toBe(409);
    expect((await createSellerAccess(otherId, { username: tag, password: "secreta123" })).status).toBe(409);
    expect((await createSellerAccess(otherId, { username: `${tag}-b`, password: "corta" })).status).toBe(400);
  });

  it("cambia la contraseña y desactiva el acceso", async () => {
    expect((await updateSellerAccess(sellerId, { password: "otraclave99" })).status).toBe(200);
    const [{ password_hash: hash }] = await q(`SELECT password_hash FROM users WHERE seller_id = $1`, [sellerId]);
    expect(await bcrypt.compare("otraclave99", hash)).toBe(true);
    expect(await bcrypt.compare("secreta123", hash)).toBe(false);

    expect((await updateSellerAccess(sellerId, { active: false })).body).toMatchObject({ active: false });
    expect((await updateSellerAccess(otherId, { active: false })).status).toBe(404); // sin usuario
    expect((await updateSellerAccess(sellerId, {})).status).toBe(400);
  });
});
