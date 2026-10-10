import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyOperations, type PushPrincipal } from "../push";
import { syncHandlers } from ".";

// A transfer between cash accounts pushed by the owner's phone: two cash
// movements (gasto in the origin, ingreso in the destination) with the uuids
// the phone generated and sourceType 'transferencia', so neither counts as
// business income/expense (lib/domain/cash.ts). Real Postgres, real registry.

const url = process.env.DATABASE_URL;
const tag = `zztransfer${Date.now()}`;
const u = () => randomUUID();

describe.skipIf(!url)("transferencia entre cuentas (Postgres real)", async () => {
  const { db } = await import("@/lib/db");
  const q = async (text: string, params: unknown[] = []) => (await db.$client.query(text, params)).rows;
  const one = async (text: string, params: unknown[] = []) => (await q(text, params))[0];

  let owner: PushPrincipal;
  let ownerUserId: number;
  let from: { id: number; uuid: string };
  let to: { id: number; uuid: string };
  const push = (type: string, payload: unknown, id = u()) => applyOperations(db, owner, [{ id, type, payload }], syncHandlers).then((r) => r[0]);
  const balance = async (accountId: number) =>
    Number(
      (await one(`SELECT COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE -amount END), 0) AS b FROM cash_movements WHERE account_id = $1`, [accountId])).b,
    );

  beforeAll(async () => {
    from = await one(`INSERT INTO cash_accounts (name) VALUES ($1) RETURNING id, uuid`, [`${tag}-caja`]);
    to = await one(`INSERT INTO cash_accounts (name, type) VALUES ($1, 'banco') RETURNING id, uuid`, [`${tag}-banco`]);
    const ou = await one(`INSERT INTO users (username, name, password_hash, role) VALUES ($1, 'ZZ', 'h', 'owner') RETURNING id`, [tag]);
    ownerUserId = ou.id;
    const od = await one(`INSERT INTO device_sessions (user_id, token_hash) VALUES ($1, $2) RETURNING id`, [ou.id, tag]);
    owner = { role: "owner", userId: ou.id, sessionId: od.id, sellerId: null, sellerUuid: null };
  });

  afterAll(async () => {
    await q(`DELETE FROM cash_movements WHERE account_id IN ($1, $2)`, [from.id, to.id]);
    await q(`DELETE FROM cash_accounts WHERE id IN ($1, $2)`, [from.id, to.id]);
    await q(`DELETE FROM sync_applied_operations WHERE user_id = $1`, [ownerUserId]);
    await q(`DELETE FROM device_sessions WHERE user_id = $1`, [ownerUserId]);
    await q(`DELETE FROM users WHERE id = $1`, [ownerUserId]);
  });

  it("crea un gasto en el origen y un ingreso en el destino con los uuid del celular, sin duplicar al reenviar", async () => {
    const outMovementUuid = u();
    const inMovementUuid = u();
    const opId = u();
    const payload = {
      fromAccountUuid: from.uuid,
      toAccountUuid: to.uuid,
      amount: 70000,
      transferDate: "2026-10-08 15:00:00",
      notes: "Consignación",
      outMovementUuid,
      inMovementUuid,
    };
    expect((await push("createCashTransfer", payload, opId)).status).toBe("applied");
    expect((await push("createCashTransfer", payload, opId)).duplicate).toBe(true);

    const rows = await q(`SELECT uuid, type, amount, concept, source_type, notes FROM cash_movements WHERE account_id IN ($1, $2) ORDER BY type`, [from.id, to.id]);
    expect(rows).toEqual([
      { uuid: outMovementUuid, type: "gasto", amount: 70000, concept: `Transferencia: ${tag}-caja → ${tag}-banco`, source_type: "transferencia", notes: "Consignación" },
      { uuid: inMovementUuid, type: "ingreso", amount: 70000, concept: `Transferencia: ${tag}-caja → ${tag}-banco`, source_type: "transferencia", notes: "Consignación" },
    ]);
    expect(await balance(from.id)).toBe(-70000);
    expect(await balance(to.id)).toBe(70000);
  });

  it("rechaza la misma cuenta y una cuenta que no existe, sin escribir nada", async () => {
    const before = (await q(`SELECT id FROM cash_movements WHERE account_id IN ($1, $2)`, [from.id, to.id])).length;
    const base = { amount: 100, transferDate: "2026-10-08 15:00:00", outMovementUuid: u(), inMovementUuid: u() };
    const same = await push("createCashTransfer", { ...base, fromAccountUuid: from.uuid, toAccountUuid: from.uuid });
    expect(same.status).toBe("rejected");
    expect(same.error).toContain("distintas");
    const missing = await push("createCashTransfer", { ...base, outMovementUuid: u(), inMovementUuid: u(), fromAccountUuid: from.uuid, toAccountUuid: u() });
    expect(missing.status).toBe("rejected");
    expect((await q(`SELECT id FROM cash_movements WHERE account_id IN ($1, $2)`, [from.id, to.id])).length).toBe(before);
  });

  it("el panel (createCashTransfer de lib/db/queries/cash) escribe las mismas dos filas", async () => {
    const { createCashTransfer } = await import("@/lib/db/queries/cash");
    const before = { from: await balance(from.id), to: await balance(to.id) };
    const rows = await createCashTransfer({ fromAccountId: to.id, toAccountId: from.id, amount: 20000 });
    expect(rows.map((r) => [r.type, r.amount, r.sourceType, r.accountId])).toEqual([
      ["gasto", 20000, "transferencia", to.id],
      ["ingreso", 20000, "transferencia", from.id],
    ]);
    expect(await balance(to.id)).toBe(before.to - 20000);
    expect(await balance(from.id)).toBe(before.from + 20000);
    await expect(createCashTransfer({ fromAccountId: to.id, toAccountId: to.id, amount: 1 })).rejects.toThrow("distintas");
  });
});
