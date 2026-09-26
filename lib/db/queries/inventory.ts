import { db } from "../index";
import { inventoryMovements, products, productSkuSeq } from "../schema";
import { eq, desc, and, lte, gt, sql } from "drizzle-orm";
import { applyMovement, validateAdjustmentReason, type MovementType } from "@/lib/domain/inventory-movement";
import { formatSku, getSkuPrefix } from "@/lib/domain/sku";
import type { InventoryAdjustmentInput } from "@/lib/validations";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type RecordMovementInput = {
  productId: number;
  type: MovementType;
  quantityDelta: number;
  unitCost?: number | null;
  reason?: string | null;
  sourceType?: string | null;
  sourceId?: number | null;
};

export type RecordMovementResult = { ok: true; newStock: number } | { ok: false; error: string };

export async function recordPrincipalMovement(tx: Tx, input: RecordMovementInput): Promise<RecordMovementResult> {
  if (!validateAdjustmentReason(input.type, input.reason)) {
    return { ok: false, error: "El ajuste debe registrar un motivo" };
  }

  const [product] = await tx
    .select({ stock: products.stock })
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);

  if (!product) return { ok: false, error: `Producto ${input.productId} no encontrado` };

  const result = applyMovement(product.stock, input.quantityDelta);
  if (!result.ok) return { ok: false, error: result.reason };

  await tx
    .update(products)
    .set({ stock: result.newBalance, updatedAt: new Date() })
    .where(eq(products.id, input.productId));

  await tx.insert(inventoryMovements).values({
    productId: input.productId,
    ownerType: "principal",
    type: input.type,
    quantityDelta: input.quantityDelta,
    unitCost: input.unitCost ?? null,
    reason: input.reason ?? null,
    sourceType: input.sourceType ?? null,
    sourceId: input.sourceId ?? null,
  });

  return { ok: true, newStock: result.newBalance };
}

export async function createAdjustment(data: InventoryAdjustmentInput): Promise<RecordMovementResult> {
  return db.transaction((tx) =>
    recordPrincipalMovement(tx, {
      productId: data.productId,
      type: "ajuste",
      quantityDelta: data.quantityDelta,
      reason: data.reason,
      sourceType: "manual",
    }),
  );
}

export function getMovementsForProduct(productId: number) {
  return db
    .select()
    .from(inventoryMovements)
    .where(eq(inventoryMovements.productId, productId))
    .orderBy(desc(inventoryMovements.createdAt));
}

export function getRecentMovements(limit = 50) {
  return db
    .select({
      id: inventoryMovements.id,
      productId: inventoryMovements.productId,
      productName: products.name,
      ownerType: inventoryMovements.ownerType,
      type: inventoryMovements.type,
      quantityDelta: inventoryMovements.quantityDelta,
      reason: inventoryMovements.reason,
      sourceType: inventoryMovements.sourceType,
      createdAt: inventoryMovements.createdAt,
    })
    .from(inventoryMovements)
    .leftJoin(products, eq(inventoryMovements.productId, products.id))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(limit);
}

export function getLowStock() {
  return db
    .select({ id: products.id, name: products.name, stock: products.stock, minStock: products.minStock })
    .from(products)
    .where(and(eq(products.active, true), gt(products.minStock, 0), gt(products.stock, 0), lte(products.stock, products.minStock)));
}

export function getOutOfStock() {
  return db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(and(eq(products.active, true), eq(products.stock, 0)));
}

// Stock only goes negative through the mobile sync (a seller phone accepts a
// sale offline even when it would overdraw — see variedades-ic-mobile's
// CLAUDE.md, "Fase 10"): the panel surfaces it so the owner corrects it with
// a manual adjustment instead of discovering it by accident.
export function getNegativeStock() {
  return db
    .select({ id: products.id, name: products.name, stock: products.stock })
    .from(products)
    .where(and(eq(products.active, true), sql`${products.stock} < 0`));
}

export async function generateProductSku(categoryName?: string | null): Promise<string> {
  const result = await db.execute<{ nextval: string }>(
    sql`SELECT nextval(${productSkuSeq.seqName}::regclass) AS nextval`,
  );
  const prefix = getSkuPrefix(categoryName);
  return formatSku(prefix, Number(result.rows[0].nextval));
}
