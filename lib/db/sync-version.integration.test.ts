import { randomUUID } from "crypto";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Contract of "what changed since X" for the mobile sync (see
// variedades-ic-mobile's CLAUDE.md, "Fase 10", sub-paso 2), checked against a
// real Postgres — it lives in triggers, which no unit test can exercise:
// - every insert/update of a synced table stamps sync_version from one global
//   sequence, so a pull can ask for "sync_version > cursor" across tables;
// - writers are serialized (advisory lock taken before nextval), so versions
//   become visible in increasing order and a cursor never skips a row that
//   commits late with a smaller version;
// - a delete leaves a tombstone (table, uuid, version) for pulls to replay.
//
// Needs DATABASE_URL (`npm run test:db`); skipped by plain `npm run test`.
// Every write runs in a transaction that is rolled back, so the dev data is
// left untouched (only the sequence advances, which is harmless).

const url = process.env.DATABASE_URL;

async function connect() {
  const c = new Client({ connectionString: url });
  await c.connect();
  return c;
}

async function insertCategory(c: Client) {
  const slug = `sync-test-${randomUUID()}`;
  const { rows } = await c.query(
    `INSERT INTO categories (name, slug) VALUES ('Sync test', $1) RETURNING id, uuid, sync_version`,
    [slug],
  );
  return rows[0] as { id: number; uuid: string; sync_version: string };
}

describe.skipIf(!url)("sync_version + sync_tombstones (Postgres real)", () => {
  let c1: Client;
  let c2: Client;

  beforeAll(async () => {
    c1 = await connect();
    c2 = await connect();
  });

  afterAll(async () => {
    await c1?.end();
    await c2?.end();
  });

  it("las 22 tablas sincronizables tienen el trigger y ninguna fila quedó sin versión", async () => {
    const { rows: tables } = await c1.query(
      `SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'sync_version' AND table_name <> 'sync_tombstones'`,
    );
    expect(tables).toHaveLength(22);
    for (const { table_name } of tables) {
      const { rows: triggers } = await c1.query(
        `SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = $1 AND trigger_name IN ('sync_bump_version', 'sync_record_tombstone') GROUP BY trigger_name`,
        [table_name],
      );
      expect(triggers.map((t) => t.trigger_name).sort(), table_name).toEqual(["sync_bump_version", "sync_record_tombstone"]);
      const { rows } = await c1.query(`SELECT count(*)::int AS n FROM "${table_name}" WHERE sync_version = 0`);
      expect(rows[0].n, table_name).toBe(0);
    }
  });

  it("insert y update estampan una versión creciente; delete deja lápida con versión mayor", async () => {
    await c1.query("BEGIN");
    try {
      const inserted = await insertCategory(c1);
      const { rows: [{ max }] } = await c1.query(`SELECT max(sync_version) AS max FROM categories WHERE id <> $1`, [inserted.id]);
      expect(BigInt(inserted.sync_version)).toBeGreaterThan(BigInt(max ?? 0));

      const { rows: [updated] } = await c1.query(`UPDATE categories SET name = 'Sync test 2' WHERE id = $1 RETURNING sync_version`, [inserted.id]);
      expect(BigInt(updated.sync_version)).toBeGreaterThan(BigInt(inserted.sync_version));

      await c1.query(`DELETE FROM categories WHERE id = $1`, [inserted.id]);
      const { rows: tombstones } = await c1.query(`SELECT table_name, uuid, sync_version FROM sync_tombstones WHERE uuid = $1`, [inserted.uuid]);
      expect(tombstones).toHaveLength(1);
      expect(tombstones[0].table_name).toBe("categories");
      expect(BigInt(tombstones[0].sync_version)).toBeGreaterThan(BigInt(updated.sync_version));
    } finally {
      await c1.query("ROLLBACK");
    }
  });

  it("un segundo escritor espera al primero y recibe una versión mayor (sin huecos para el cursor)", async () => {
    await c1.query("BEGIN");
    await c2.query("BEGIN");
    try {
      const first = await insertCategory(c1);

      let secondDone = false;
      const second = insertCategory(c2).then((r) => { secondDone = true; return r; });
      await new Promise((r) => setTimeout(r, 300));
      expect(secondDone).toBe(false); // blocked on the advisory lock while c1 is open

      await c1.query("ROLLBACK");
      const secondRow = await second;
      expect(BigInt(secondRow.sync_version)).toBeGreaterThan(BigInt(first.sync_version));
    } finally {
      await c1.query("ROLLBACK").catch(() => {});
      await c2.query("ROLLBACK");
    }
  });
});
