// GET /api/sync/pull (sub-paso 6 of the mobile sync, see variedades-ic-mobile's
// CLAUDE.md, "Fase 10"): the rows of every synced table whose sync_version is
// in (since, upTo], plus tombstones for deletes in that window.
//
// Contract:
// - Must run inside ONE `REPEATABLE READ` transaction (the route opens it), so
//   all 22 tables are read from the same snapshot. Combined with the advisory
//   lock of the sync_bump_version trigger, every committed row has a version
//   below any in-flight write, so returning `cursor = upTo` never skips a row.
// - Rows never carry local ids: every foreign key travels as the referenced
//   row's uuid (`categoryUuid`, `sellerUuid`, ...), and the keys are the
//   phone's Drizzle field names. Timestamps are UTC "YYYY-MM-DD HH:MM:SS"
//   (what the phone's SQLite stores); dates are "YYYY-MM-DD".
// - Paged by version: at most `pageSize` versions per call; `hasMore` tells
//   the phone to call again with the returned cursor.
// - Role scope: an owner gets everything. A seller gets the catalog plus only
//   their own rows, with purchase costs zeroed (products.purchasePrice and
//   delivery unit costs); loss unit costs are kept, since they're what the
//   seller owes. Tables outside a seller's scope are absent from `changes`.

export type PullPrincipal = { role: "owner" | "seller"; sellerId: number | null };
export type PullResult = {
  cursor: number;
  hasMore: boolean;
  changes: Record<string, Record<string, unknown>[]>;
  tombstones: { table: string; uuid: string }[];
};
type Queryable = { query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> };

// Naive timestamps hold the database session's local time (now() on insert),
// so they are read in that zone and converted to UTC.
const ts = (col: string) =>
  `to_char((${col} AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')`;
const day = (col: string) => `to_char(${col}, 'YYYY-MM-DD')`;

type TableSpec = {
  table: string;
  alias: string;
  // SELECT list (without SELECT) and FROM clause (joins resolving uuids).
  select: (isSeller: boolean) => string;
  from: string;
  // null = not visible to a seller; "" = all rows; otherwise a filter on $3 = seller id.
  sellerFilter: string | null;
};

const SPECS: TableSpec[] = [
  {
    table: "categories", alias: "c", from: "categories c", sellerFilter: "",
    select: () => `c.uuid, c.name, c.slug, c.description, c.active, ${ts("c.created_at")} AS "createdAt"`,
  },
  {
    table: "products", alias: "p", from: "products p LEFT JOIN categories c ON c.id = p.category_id", sellerFilter: "",
    select: (s) => `p.uuid, p.name, p.slug, p.description, p.sku, p.price, ${s ? "0" : "p.purchase_price"} AS "purchasePrice",
      c.uuid AS "categoryUuid", p.distributor_code AS "distributorCode", p.stock, p.min_stock AS "minStock",
      p.warranty_months AS "warrantyMonths", p.active, ${ts("p.created_at")} AS "createdAt", ${ts("p.updated_at")} AS "updatedAt"`,
  },
  {
    table: "product_images", alias: "i", from: "product_images i JOIN products p ON p.id = i.product_id", sellerFilter: "",
    select: () => `i.uuid, p.uuid AS "productUuid", i.url, i.alt, i.display_order AS "displayOrder", i.is_primary AS "isPrimary"`,
  },
  {
    table: "cash_accounts", alias: "a", from: "cash_accounts a", sellerFilter: null,
    select: () => `a.uuid, a.name, a.type, a.active, a.notes, ${ts("a.created_at")} AS "createdAt"`,
  },
  {
    table: "sellers", alias: "s", from: "sellers s", sellerFilter: "s.id = $3",
    select: () => `s.uuid, s.name, s.phone, s.city, s.commission_type AS "commissionType", s.commission_value AS "commissionValue",
      s.active, s.notes, ${ts("s.created_at")} AS "createdAt"`,
  },
  {
    table: "inventory_movements", alias: "m",
    from: "inventory_movements m JOIN products p ON p.id = m.product_id LEFT JOIN sellers s ON s.id = m.seller_id",
    sellerFilter: "m.owner_type = 'seller' AND m.seller_id = $3",
    select: () => `m.uuid, p.uuid AS "productUuid", m.type, m.quantity_delta AS "quantityDelta", m.reason,
      m.source_type AS "sourceType", m.owner_type AS "ownerType", s.uuid AS "sellerUuid", ${ts("m.created_at")} AS "createdAt"`,
  },
  {
    // source_id is polymorphic (a local id of the table named by source_type): resolved to that row's uuid.
    table: "cash_movements", alias: "m", from: "cash_movements m JOIN cash_accounts a ON a.id = m.account_id", sellerFilter: null,
    select: () => `m.uuid, m.type, m.amount, m.concept, ${ts("m.movement_date")} AS "movementDate", m.source_type AS "sourceType",
      CASE m.source_type
        WHEN 'direct_sale' THEN (SELECT x.uuid FROM direct_sales x WHERE x.id = m.source_id)
        WHEN 'settlement' THEN (SELECT x.uuid FROM settlements x WHERE x.id = m.source_id)
        WHEN 'purchase_payment' THEN (SELECT x.uuid FROM purchase_payments x WHERE x.id = m.source_id)
      END AS "sourceUuid",
      a.uuid AS "accountUuid", m.notes, ${ts("m.created_at")} AS "createdAt"`,
  },
  {
    table: "direct_sales", alias: "d", from: "direct_sales d JOIN cash_accounts a ON a.id = d.account_id", sellerFilter: null,
    select: () => `d.uuid, ${ts("d.sale_date")} AS "saleDate", d.total_amount AS "totalAmount", a.uuid AS "accountUuid", d.notes,
      ${ts("d.created_at")} AS "createdAt"`,
  },
  {
    table: "direct_sale_items", alias: "i",
    from: "direct_sale_items i JOIN direct_sales d ON d.id = i.sale_id JOIN products p ON p.id = i.product_id", sellerFilter: null,
    select: () => `i.uuid, d.uuid AS "saleUuid", p.uuid AS "productUuid", i.quantity, i.unit_price AS "unitPrice", i.subtotal`,
  },
  {
    table: "distributors", alias: "d", from: "distributors d", sellerFilter: null,
    select: () => `d.uuid, d.name, d.city, d.phone, d.notes, d.active, ${ts("d.created_at")} AS "createdAt"`,
  },
  {
    table: "purchase_orders", alias: "o", from: "purchase_orders o LEFT JOIN distributors d ON d.id = o.distributor_id", sellerFilter: null,
    select: () => `o.uuid, d.uuid AS "distributorUuid", o.status, o.purchase_type AS "purchaseType", ${ts("o.order_date")} AS "orderDate",
      ${day("o.expected_date")} AS "expectedDate", o.total_cost AS "totalCost", o.notes, ${ts("o.created_at")} AS "createdAt",
      ${ts("o.updated_at")} AS "updatedAt"`,
  },
  {
    table: "purchase_order_items", alias: "i",
    from: "purchase_order_items i JOIN purchase_orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id", sellerFilter: null,
    select: () => `i.uuid, o.uuid AS "orderUuid", p.uuid AS "productUuid", i.quantity, i.unit_cost AS "unitCost"`,
  },
  {
    table: "purchase_payments", alias: "y",
    from: "purchase_payments y JOIN purchase_orders o ON o.id = y.purchase_order_id JOIN cash_accounts a ON a.id = y.account_id",
    sellerFilter: null,
    select: () => `y.uuid, o.uuid AS "purchaseOrderUuid", y.amount, ${ts("y.paid_at")} AS "paidAt", a.uuid AS "accountUuid", y.notes,
      ${ts("y.created_at")} AS "createdAt"`,
  },
  {
    table: "seller_deliveries", alias: "d", from: "seller_deliveries d JOIN sellers s ON s.id = d.seller_id", sellerFilter: "d.seller_id = $3",
    select: () => `d.uuid, s.uuid AS "sellerUuid", ${ts("d.delivery_date")} AS "deliveryDate", d.notes, ${ts("d.created_at")} AS "createdAt"`,
  },
  {
    table: "seller_delivery_items", alias: "i",
    from: "seller_delivery_items i JOIN seller_deliveries d ON d.id = i.delivery_id JOIN products p ON p.id = i.product_id",
    sellerFilter: "d.seller_id = $3",
    select: (s) => `i.uuid, d.uuid AS "deliveryUuid", p.uuid AS "productUuid", i.quantity, ${s ? "0" : "i.unit_cost"} AS "unitCost"`,
  },
  {
    table: "seller_returns", alias: "r", from: "seller_returns r JOIN sellers s ON s.id = r.seller_id", sellerFilter: "r.seller_id = $3",
    select: () => `r.uuid, s.uuid AS "sellerUuid", ${ts("r.return_date")} AS "returnDate", r.notes, ${ts("r.created_at")} AS "createdAt"`,
  },
  {
    table: "seller_return_items", alias: "i",
    from: "seller_return_items i JOIN seller_returns r ON r.id = i.return_id JOIN products p ON p.id = i.product_id",
    sellerFilter: "r.seller_id = $3",
    select: () => `i.uuid, r.uuid AS "returnUuid", p.uuid AS "productUuid", i.quantity`,
  },
  {
    table: "seller_losses", alias: "l",
    from: "seller_losses l JOIN sellers s ON s.id = l.seller_id LEFT JOIN settlements t ON t.id = l.settlement_id",
    sellerFilter: "l.seller_id = $3",
    select: () => `l.uuid, s.uuid AS "sellerUuid", l.type, ${ts("l.loss_date")} AS "lossDate", t.uuid AS "settlementUuid", l.notes,
      ${ts("l.created_at")} AS "createdAt"`,
  },
  {
    table: "seller_loss_items", alias: "i",
    from: "seller_loss_items i JOIN seller_losses l ON l.id = i.loss_id JOIN products p ON p.id = i.product_id",
    sellerFilter: "l.seller_id = $3",
    select: () => `i.uuid, l.uuid AS "lossUuid", p.uuid AS "productUuid", i.quantity, i.unit_cost AS "unitCost"`,
  },
  {
    table: "settlements", alias: "t", from: "settlements t JOIN sellers s ON s.id = t.seller_id", sellerFilter: "t.seller_id = $3",
    select: () => `t.uuid, s.uuid AS "sellerUuid", ${day("t.period_date")} AS "periodDate", t.total_sales AS "totalSales",
      t.total_commission AS "totalCommission", t.total_losses AS "totalLosses", t.amount_due AS "amountDue", t.status,
      ${ts("t.settled_at")} AS "settledAt", ${ts("t.created_at")} AS "createdAt"`,
  },
  {
    table: "seller_sales", alias: "v",
    from: "seller_sales v JOIN sellers s ON s.id = v.seller_id LEFT JOIN settlements t ON t.id = v.settlement_id",
    sellerFilter: "v.seller_id = $3",
    select: () => `v.uuid, s.uuid AS "sellerUuid", ${ts("v.sale_date")} AS "saleDate", v.total_amount AS "totalAmount",
      v.commission_amount AS "commissionAmount", t.uuid AS "settlementUuid", v.notes, ${ts("v.created_at")} AS "createdAt"`,
  },
  {
    table: "seller_sale_items", alias: "i",
    from: "seller_sale_items i JOIN seller_sales v ON v.id = i.sale_id JOIN products p ON p.id = i.product_id",
    sellerFilter: "v.seller_id = $3",
    select: () => `i.uuid, v.uuid AS "saleUuid", p.uuid AS "productUuid", i.quantity, i.unit_price AS "unitPrice", i.subtotal`,
  },
];

export const SYNCED_TABLES = SPECS.map((s) => s.table);

// Upper bound of this page: the pageSize-th pending version across every
// synced table and the tombstones. Counted without the role filter, so a
// seller's page may carry fewer rows — never skips any.
async function pageWindow(q: Queryable, since: number, pageSize: number) {
  const versions = [...SYNCED_TABLES, "sync_tombstones"]
    .map((t) => `SELECT sync_version AS v FROM "${t}" WHERE sync_version > $1`)
    .join(" UNION ALL ");
  const { rows } = await q.query(
    `SELECT (SELECT v FROM (${versions}) x ORDER BY v OFFSET $2 - 1 LIMIT 1) AS nth, (SELECT max(v) FROM (${versions}) x) AS max`,
    [since, pageSize],
  );
  const nth = rows[0].nth === null ? null : Number(rows[0].nth);
  const max = rows[0].max === null ? null : Number(rows[0].max);
  if (max === null) return { upTo: since, hasMore: false };
  if (nth === null || nth >= max) return { upTo: max, hasMore: false };
  return { upTo: nth, hasMore: true };
}

export async function pullChanges(q: Queryable, principal: PullPrincipal, since: number, pageSize: number): Promise<PullResult> {
  const isSeller = principal.role === "seller";
  if (isSeller && principal.sellerId === null) throw new Error("Un vendedor sin sellerId no puede sincronizar");

  const { upTo, hasMore } = await pageWindow(q, since, pageSize);
  const changes: PullResult["changes"] = {};
  if (upTo === since) return { cursor: since, hasMore: false, changes, tombstones: [] };

  const visible = SPECS.filter((s) => !isSeller || s.sellerFilter !== null);
  for (const spec of visible) {
    const scoped = isSeller && spec.sellerFilter;
    const where = `${spec.alias}.sync_version > $1 AND ${spec.alias}.sync_version <= $2${scoped ? ` AND ${spec.sellerFilter}` : ""}`;
    const params = scoped ? [since, upTo, principal.sellerId] : [since, upTo];
    const { rows } = await q.query(
      `SELECT ${spec.select(isSeller)} FROM ${spec.from} WHERE ${where} ORDER BY ${spec.alias}.sync_version`,
      params,
    );
    if (rows.length) changes[spec.table] = rows;
  }

  const { rows: tombstones } = await q.query(
    `SELECT table_name AS "table", uuid FROM sync_tombstones WHERE sync_version > $1 AND sync_version <= $2 AND table_name = ANY($3) ORDER BY sync_version`,
    [since, upTo, visible.map((s) => s.table)],
  );

  return { cursor: upTo, hasMore, changes, tombstones: tombstones as PullResult["tombstones"] };
}
