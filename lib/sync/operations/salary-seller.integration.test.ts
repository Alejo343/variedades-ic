import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyOperations, type PushPrincipal } from "../push";
import { syncHandlers } from ".";

// A salaried store seller (lib/domain/salary.ts): sells like any store seller
// but their sales carry no commission, and the owner pays their salary one
// period at a time. Real Postgres through the real registry; fixtures removed
// in afterAll.

const url = process.env.DATABASE_URL;
const tag = `zzsalary${Date.now()}`;
const u = () => randomUUID();

describe.skipIf(!url)("vendedor de tienda con sueldo (Postgres real)", async () => {
  const { db } = await import("@/lib/db");
  const { pullChanges } = await import("../pull");
  const { paySalary } = await import("@/lib/db/queries/salary-payments");
  const q = async (text: string, params: unknown[] = []) => (await db.$client.query(text, params)).rows;
  const one = async (text: string, params: unknown[] = []) => (await q(text, params))[0];

  let owner: PushPrincipal;
  let salaried: PushPrincipal;
  let productUuid: string;
  let productId: number;
  let accountId: number;
  let accountUuid: string;
  let commissionSeller: { id: number; uuid: string };
  let consignmentUuid: string;
  const userIds: number[] = [];
  const sellerIds: number[] = [];

  const push = (who: PushPrincipal, type: string, payload: unknown) =>
    applyOperations(db, who, [{ id: u(), type, payload }], syncHandlers).then((r) => r[0]);
  const sale = (sellerUuid: string) => ({
    uuid: u(), saleDate: "2026-10-20 15:00:00", accountUuid, sellerUuid, cashMovementUuid: u(),
    items: [{ uuid: u(), productUuid, quantity: 2, unitPrice: 5000, movementUuid: u() }],
  });
  const salaryRow = (sellerUuid: string, name: string, extra: Record<string, unknown> = {}) => ({
    uuid: sellerUuid, name, inventoryMode: "store", active: true,
    payType: "salary", salaryAmount: 300000, salaryPeriod: "weekly", salaryStartDate: "2026-10-14", ...extra,
  });
  const payment = (sellerUuid: string, extra: Record<string, unknown> = {}) => ({
    uuid: u(), sellerUuid, period: "weekly", periodStart: "2026-10-12", amount: 280000, accountUuid,
    paidAt: "2026-10-19 20:00:00", cashMovementUuid: u(), notes: "descontado 1 día", ...extra,
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
      `INSERT INTO products (name, slug, sku, price, commission_bps, stock) VALUES ($1, $1, $1, 5000, 1000, 50) RETURNING id, uuid`,
      [tag],
    ));
    ({ id: accountId, uuid: accountUuid } = await one(`INSERT INTO cash_accounts (name) VALUES ($1) RETURNING id, uuid`, [tag]));
    const s = await one(`INSERT INTO sellers (name, inventory_mode) VALUES ($1, 'store') RETURNING id, uuid`, [`${tag}-sal`]);
    commissionSeller = await one(`INSERT INTO sellers (name, inventory_mode) VALUES ($1, 'store') RETURNING id, uuid`, [`${tag}-com`]);
    const c = await one(`INSERT INTO sellers (name) VALUES ($1) RETURNING id, uuid`, [`${tag}-cons`]);
    consignmentUuid = c.uuid;
    sellerIds.push(s.id, commissionSeller.id, c.id);
    owner = await principalFor("owner", null, null, "o");
    salaried = await principalFor("seller", s.id, s.uuid, "s");
  });

  afterAll(async () => {
    await q(`DELETE FROM direct_sale_items WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM cash_movements WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM direct_sales WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM commission_payments WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM salary_payments WHERE account_id = $1`, [accountId]);
    await q(`DELETE FROM inventory_movements WHERE product_id = $1`, [productId]);
    await q(`DELETE FROM products WHERE id = $1`, [productId]);
    await q(`DELETE FROM cash_accounts WHERE id = $1`, [accountId]);
    await q(`DELETE FROM sync_applied_operations WHERE user_id = ANY($1)`, [userIds]);
    await q(`DELETE FROM device_sessions WHERE user_id = ANY($1)`, [userIds]);
    await q(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);
    await q(`DELETE FROM sellers WHERE id = ANY($1)`, [sellerIds]);
  });

  it("upsertSeller: guarda el sueldo con la fecha de inicio que manda el celular", async () => {
    const r = await push(owner, "upsertSeller", salaryRow(salaried.sellerUuid!, `${tag}-sal`));
    expect(r.status).toBe("applied");
    expect(await one(`SELECT pay_type, salary_amount, salary_period, to_char(salary_start_date, 'YYYY-MM-DD') AS start FROM sellers WHERE id = $1`, [salaried.sellerId])).toEqual({
      pay_type: "salary", salary_amount: 300000, salary_period: "weekly", start: "2026-10-14",
    });
  });

  it("una app vieja (sin los campos) no le quita el sueldo", async () => {
    const r = await push(owner, "upsertSeller", { uuid: salaried.sellerUuid, name: `${tag}-sal`, inventoryMode: "store", active: true });
    expect(r.status).toBe("applied");
    expect((await one(`SELECT pay_type FROM sellers WHERE id = $1`, [salaried.sellerId])).pay_type).toBe("salary");
  });

  it("rechaza sueldo para consignación o sin monto, sin escribir nada", async () => {
    const cons = await push(owner, "upsertSeller", salaryRow(consignmentUuid, `${tag}-cons`, { inventoryMode: "consignment" }));
    expect(cons.status).toBe("rejected");
    expect(cons.error).toMatch(/tienda/);
    const noAmount = await push(owner, "upsertSeller", salaryRow(salaried.sellerUuid!, `${tag}-sal`, { salaryAmount: null }));
    expect(noAmount.status).toBe("rejected");
    expect((await one(`SELECT salary_amount FROM sellers WHERE id = $1`, [salaried.sellerId])).salary_amount).toBe(300000);
  });

  it("la venta de un vendedor con sueldo no lleva comisión", async () => {
    const payload = sale(salaried.sellerUuid!);
    expect((await push(salaried, "createDirectSale", payload)).status).toBe("applied");
    expect(await one(`SELECT total_amount, commission_amount FROM direct_sales WHERE uuid = $1`, [payload.uuid])).toEqual({
      total_amount: 10000, commission_amount: 0,
    });
  });

  it("pasar a sueldo exige haber pagado sus comisiones", async () => {
    const payload = sale(commissionSeller.uuid);
    expect((await push(owner, "createDirectSale", payload)).status).toBe("applied");
    const blocked = await push(owner, "upsertSeller", salaryRow(commissionSeller.uuid, `${tag}-com`));
    expect(blocked.status).toBe("rejected");
    expect(blocked.error).toMatch(/comisiones sin pagar/);

    const pay = { uuid: u(), sellerUuid: commissionSeller.uuid, periodDate: "2026-10-20", accountUuid, paidAt: "2026-10-20 20:00:00", cashMovementUuid: u() };
    expect((await push(owner, "createCommissionPayment", pay)).status).toBe("applied");
    expect((await push(owner, "upsertSeller", salaryRow(commissionSeller.uuid, `${tag}-com`))).status).toBe("applied");
  });

  it("pagar sueldo: un período, con el monto dado, genera el gasto y no se paga dos veces", async () => {
    const payload = payment(salaried.sellerUuid!);
    // A seller can never pay salaries (owner only).
    expect((await push(salaried, "createSalaryPayment", payload)).status).toBe("rejected");
    expect((await push(owner, "createSalaryPayment", payload)).status).toBe("applied");

    expect(await one(`SELECT period, to_char(period_start, 'YYYY-MM-DD') AS start, amount, notes FROM salary_payments WHERE uuid = $1`, [payload.uuid])).toEqual({
      period: "weekly", start: "2026-10-12", amount: 280000, notes: "descontado 1 día",
    });
    expect(await one(`SELECT type, amount, source_type, concept FROM cash_movements WHERE uuid = $1`, [payload.cashMovementUuid])).toEqual({
      type: "gasto", amount: 280000, source_type: "salary_payment", concept: `Sueldo ${tag}-sal · 12–18 oct 2026`,
    });

    const again = await push(owner, "createSalaryPayment", payment(salaried.sellerUuid!));
    expect(again.status).toBe("rejected");
    expect(again.error).toMatch(/ya está pagado/);
  });

  it("rechaza un período que no empieza en lunes", async () => {
    const r = await push(owner, "createSalaryPayment", payment(salaried.sellerUuid!, { periodStart: "2026-10-14" }));
    expect(r.status).toBe("rejected");
  });

  it("el pull trae la forma de pago y los pagos de sueldo al dueño y al propio vendedor", async () => {
    const paid = await one(`SELECT uuid FROM salary_payments WHERE seller_id = $1`, [salaried.sellerId]);
    const client = await db.$client.connect();
    try {
      const mine = await pullChanges(client, { role: "seller", sellerId: salaried.sellerId }, 0, 100000);
      expect((mine.changes.sellers ?? []).find((s) => s.uuid === salaried.sellerUuid)).toMatchObject({
        payType: "salary", salaryAmount: 300000, salaryPeriod: "weekly", salaryStartDate: "2026-10-14",
      });
      expect((mine.changes.salary_payments ?? []).map((p) => p.uuid)).toEqual([paid.uuid]);
      expect(mine.changes.salary_payments?.[0]).toMatchObject({ sellerUuid: salaried.sellerUuid, period: "weekly", periodStart: "2026-10-12", amount: 280000, accountUuid });

      const all = await pullChanges(client, { role: "owner", sellerId: null }, 0, 100000);
      const expense = (all.changes.cash_movements ?? []).find((m) => m.sourceType === "salary_payment" && m.sourceUuid === paid.uuid);
      expect(expense).toMatchObject({ type: "gasto", amount: 280000 });
    } finally {
      client.release();
    }
  });

  it("el panel paga con la misma regla", async () => {
    await db.transaction((tx) =>
      paySalary(tx, { sellerId: salaried.sellerId!, period: "weekly", periodStart: "2026-10-05", amount: 300000, accountId }),
    );
    await expect(
      db.transaction((tx) => paySalary(tx, { sellerId: salaried.sellerId!, period: "weekly", periodStart: "2026-10-05", amount: 300000, accountId })),
    ).rejects.toThrow(/ya está pagado/);
  });
});
