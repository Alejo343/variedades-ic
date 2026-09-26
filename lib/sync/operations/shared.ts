import { sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { SyncRejection, type Tx } from "../push";

// Building blocks shared by the push handlers (sub-paso 7).

// Timestamps travel in UTC "YYYY-MM-DD HH:MM:SS" (what the phone's SQLite
// stores, and what the pull returns).
export const utcTimestamp = z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, "Fecha con formato inválido");
export const rowUuid = z.uuid();

// The web's timestamp columns hold the database session's local time (what
// now() stores), so a UTC value from the phone is converted into that zone —
// the inverse of the pull's conversion.
export const fromUtc = (value: string): SQL => sql`((${value})::timestamp AT TIME ZONE 'UTC') AT TIME ZONE current_setting('TimeZone')`;

type UuidTable = "products" | "sellers" | "categories" | "cash_accounts" | "distributors" | "direct_sales" | "purchase_orders" | "settlements";

// Local id of the row with that uuid, or a rejection naming what's missing
// (usually: an operation that depended on another one that was rejected).
export async function idByUuid(tx: Tx, table: UuidTable, uuid: string, label: string): Promise<number> {
  const result = await tx.execute(sql`SELECT id FROM ${sql.identifier(table)} WHERE uuid = ${uuid}`);
  const row = result.rows[0] as { id: number } | undefined;
  if (!row) throw new SyncRejection(`${label} no existe en el servidor (${uuid})`);
  return row.id;
}

// Principal stock change for a sync operation: unlike the panel's
// recordPrincipalMovement, it never refuses a negative result — the
// operation already happened offline (see CLAUDE.md, "Fase 10").
export async function changePrincipalStock(
  tx: Tx,
  m: {
    uuid: string; productId: number; type: string; quantityDelta: number; sourceType: string; sourceId: number | null;
    occurredAt: string; unitCost?: number | null; reason?: string | null;
  },
) {
  await tx.execute(sql`UPDATE products SET stock = stock + ${m.quantityDelta}, updated_at = now() WHERE id = ${m.productId}`);
  await tx.execute(sql`
    INSERT INTO inventory_movements (uuid, product_id, owner_type, type, quantity_delta, unit_cost, reason, source_type, source_id, created_at)
    VALUES (${m.uuid}, ${m.productId}, 'principal', ${m.type}, ${m.quantityDelta}, ${m.unitCost ?? null}, ${m.reason ?? null},
            ${m.sourceType}, ${m.sourceId}, ${fromUtc(m.occurredAt)})`);
}

// Seller-ledger row (consigned inventory); never touches products.stock and
// never refuses a negative balance, same reason as above.
export async function recordSellerMovement(
  tx: Tx,
  m: { uuid: string; productId: number; sellerId: number; type: string; quantityDelta: number; sourceType: string; sourceId: number; occurredAt: string; unitCost?: number | null },
) {
  await tx.execute(sql`
    INSERT INTO inventory_movements (uuid, product_id, owner_type, seller_id, type, quantity_delta, unit_cost, source_type, source_id, created_at)
    VALUES (${m.uuid}, ${m.productId}, 'seller', ${m.sellerId}, ${m.type}, ${m.quantityDelta}, ${m.unitCost ?? null}, ${m.sourceType}, ${m.sourceId}, ${fromUtc(m.occurredAt)})`);
}
