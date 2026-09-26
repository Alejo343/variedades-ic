import { randomUUID } from "crypto";
import { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Role rules enforced by the users table itself (sub-paso 3 of the mobile
// sync, see lib/domain/users.ts): a seller always has exactly one sellers row,
// an owner never has one, and a sellers row has at most one login. Each test
// runs in a transaction that is rolled back. Needs DATABASE_URL (`npm run test:db`).

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("users: reglas de rol en la base (Postgres real)", () => {
  let c: Client;
  let sellerId: number;

  beforeAll(async () => {
    c = new Client({ connectionString: url });
    await c.connect();
  });
  afterAll(async () => { await c?.end(); });

  beforeEach(async () => {
    await c.query("BEGIN");
    const { rows } = await c.query(`INSERT INTO sellers (name, commission_type, commission_value) VALUES ('Test', 'percentage', 1000) RETURNING id`);
    sellerId = rows[0].id;
  });
  afterEach(async () => { await c.query("ROLLBACK"); });

  const insertUser = (role: string, seller: number | null, username = `u-${randomUUID()}`) =>
    c.query(`INSERT INTO users (username, name, password_hash, role, seller_id) VALUES ($1, 'X', 'h', $2, $3)`, [username, role, seller]);

  // A failed statement aborts the transaction; a savepoint keeps it usable.
  async function rejects(p: () => Promise<unknown>, pattern: RegExp) {
    await c.query("SAVEPOINT s");
    await expect(p()).rejects.toThrow(pattern);
    await c.query("ROLLBACK TO SAVEPOINT s");
  }

  it("acepta un dueño sin vendedor y un vendedor con su vendedor", async () => {
    await insertUser("owner", null);
    await insertUser("seller", sellerId);
  });

  it("rechaza un vendedor sin vendedor, un dueño con vendedor y un rol desconocido", async () => {
    await rejects(() => insertUser("seller", null), /users_seller_iff_role_seller/);
    await rejects(() => insertUser("owner", sellerId), /users_seller_iff_role_seller/);
    await rejects(() => insertUser("admin", null), /users_role_valid/);
  });

  it("un vendedor tiene un solo usuario y el nombre de usuario es único", async () => {
    await insertUser("seller", sellerId, "maria");
    const { rows } = await c.query(`INSERT INTO sellers (name, commission_type, commission_value) VALUES ('Otro', 'percentage', 1000) RETURNING id`);
    await rejects(() => insertUser("seller", sellerId), /users_seller_id_unique/);
    await rejects(() => insertUser("seller", rows[0].id, "maria"), /users_username_unique/);
  });
});
