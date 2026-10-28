import { db } from "../index";
import { categories, products } from "../schema";
import { eq } from "drizzle-orm";
import {
  planProductImport,
  productsToSheetRows,
  sellerHoldingsSheetRows,
  type ProductImportPlan,
  type ProductImportRow,
} from "@/lib/domain/product-import";
import { recordPrincipalMovement } from "./inventory";
import { nextAutoSku, skuForCategoryChange } from "./sku";
import { getAllSellerHoldings } from "./seller-inventory";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function loadCatalog(dbOrTx: typeof db | Tx) {
  return Promise.all([
    dbOrTx
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        slug: products.slug,
        distributorCode: products.distributorCode,
        stock: products.stock,
        price: products.price,
        purchasePrice: products.purchasePrice,
        commissionBps: products.commissionBps,
        categoryId: products.categoryId,
        minStock: products.minStock,
        warrantyMonths: products.warrantyMonths,
        description: products.description,
        active: products.active,
      })
      .from(products),
    dbOrTx.select({ id: categories.id, name: categories.name }).from(categories),
  ]);
}

async function loadPlan(dbOrTx: typeof db | Tx, rows: ProductImportRow[]): Promise<ProductImportPlan> {
  const [existing, cats] = await loadCatalog(dbOrTx);
  return planProductImport(rows, existing, cats);
}

/**
 * The whole catalog as rows of the import template, to edit and upload back,
 * plus what sellers hold: a read-only column there and its detail by seller.
 */
export async function exportProductSheet(): Promise<{ rows: unknown[][]; sellerRows: unknown[][] }> {
  const [[existing, cats], holdings] = await Promise.all([loadCatalog(db), getAllSellerHoldings()]);
  const heldBySellers = new Map<number, number>();
  for (const h of holdings) heldBySellers.set(h.productId, (heldBySellers.get(h.productId) ?? 0) + h.quantity);
  for (const [id, q] of heldBySellers) if (q === 0) heldBySellers.delete(id);
  return { rows: productsToSheetRows(existing, cats, heldBySellers), sellerRows: sellerHoldingsSheetRows(holdings) };
}

/** Read-only: what the import would do, for the preview screen. */
export function previewProductImport(rows: ProductImportRow[]) {
  return loadPlan(db, rows);
}

export type ApplyProductImportResult =
  | { ok: true; created: number; updated: number; unchanged: number }
  | { ok: false; error: string; plan?: ProductImportPlan };

const CREATE_REASON = "Carga inicial (importación de Excel)";
const UPDATE_REASON = "Conteo (importación de Excel)";

/**
 * All-or-nothing: re-plans inside the transaction against fresh data and
 * refuses to write anything if any row has an error. Stock never goes into the
 * product row directly — new products start at 0 and every stock change is an
 * `ajuste` in the inventory ledger, so the history explains every unit.
 */
export async function applyProductImport(rows: ProductImportRow[]): Promise<ApplyProductImportResult> {
  try {
    return await db.transaction(async (tx) => {
      const plan = await loadPlan(tx, rows);
      if (plan.errors.length > 0) {
        return { ok: false as const, error: "El archivo tiene errores; corrígelos y vuelve a subirlo.", plan };
      }

      for (const c of plan.creates) {
        const sku = await nextAutoSku(tx, c.categoryName);
        const [created] = await tx
          .insert(products)
          .values({ ...c.fields, slug: c.slug, sku, stock: 0 })
          .returning({ id: products.id });
        if (c.initialStock > 0) {
          const res = await recordPrincipalMovement(tx, {
            productId: created.id,
            type: "ajuste",
            quantityDelta: c.initialStock,
            reason: CREATE_REASON,
            sourceType: "manual",
          });
          if (!res.ok) throw new Error(`Fila ${c.rowNumber}: ${res.error}`);
        }
      }

      for (const u of plan.updates) {
        if (Object.keys(u.fields).length > 0) {
          let sku: string | null = null;
          if (u.fields.categoryId !== undefined) {
            const [current] = await tx
              .select({ id: products.id, sku: products.sku, categoryId: products.categoryId })
              .from(products)
              .where(eq(products.id, u.productId));
            sku = await skuForCategoryChange(tx, current, u.fields.categoryId);
          }
          await tx
            .update(products)
            .set({ ...u.fields, ...(sku ? { sku } : {}), updatedAt: new Date() })
            .where(eq(products.id, u.productId));
        }
        if (u.stockDelta !== 0) {
          const res = await recordPrincipalMovement(tx, {
            productId: u.productId,
            type: "ajuste",
            quantityDelta: u.stockDelta,
            reason: UPDATE_REASON,
            sourceType: "manual",
          });
          if (!res.ok) throw new Error(`Fila ${u.rowNumber}: ${res.error}`);
        }
      }

      return { ok: true as const, created: plan.creates.length, updated: plan.updates.length, unchanged: plan.unchanged.length };
    });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return { ok: false, error: "Un código de proveedor o un producto ya existe con esos datos. Revisa el archivo." };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
