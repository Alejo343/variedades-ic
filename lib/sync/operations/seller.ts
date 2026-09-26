import { sql } from "drizzle-orm";
import { z } from "zod";
import { calculateCommission } from "@/lib/domain/commission";
import { defineHandler, SyncRejection, type Tx } from "../push";
import { changePrincipalStock, fromUtc, idByUuid, recordSellerMovement, rowUuid, utcTimestamp } from "./shared";

// Operations a seller records on their phone (sub-paso 7, parte 2): sale,
// return and loss of their own consigned inventory. The owner may push them
// too (on behalf of a seller).
//
// Unlike the panel's createSellerSale/Return/Loss (online, fail-fast), these
// accept leaving the seller's inventory negative: the operation already
// happened offline, and the owner corrects it afterwards (CLAUDE.md, "Fase 10").
// Every row is inserted with the uuid the phone generated, so the next pull
// matches the phone's own rows instead of duplicating them.

const quantity = z.number().int().min(1);
const notes = z.string().max(2000).nullish();

async function requireSeller(tx: Tx, uuid: string) {
  const result = await tx.execute(sql`SELECT id, commission_type, commission_value FROM sellers WHERE uuid = ${uuid}`);
  const row = result.rows[0] as { id: number; commission_type: "percentage" | "fixed_per_unit"; commission_value: number } | undefined;
  if (!row) throw new SyncRejection(`Vendedor no existe en el servidor (${uuid})`);
  return row;
}

export const createSellerSale = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    sellerUuid: rowUuid,
    saleDate: utcTimestamp,
    notes,
    items: z
      .array(z.object({ uuid: rowUuid, productUuid: rowUuid, quantity, unitPrice: z.number().int().min(0), movementUuid: rowUuid }))
      .min(1),
  }),
  sellerUuid: (p) => p.sellerUuid,
  async apply(tx, p) {
    const seller = await requireSeller(tx, p.sellerUuid);
    const productIds = [];
    for (const item of p.items) productIds.push(await idByUuid(tx, "products", item.productUuid, "Producto"));

    const totalAmount = p.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const totalQuantity = p.items.reduce((sum, i) => sum + i.quantity, 0);
    // Server-side, with the seller's current configuration — the phone's own
    // estimate is replaced by this value on the next pull.
    const commissionAmount = calculateCommission({ type: seller.commission_type, value: seller.commission_value }, totalAmount, totalQuantity);

    const inserted = await tx.execute(sql`
      INSERT INTO seller_sales (uuid, seller_id, sale_date, total_amount, commission_amount, notes)
      VALUES (${p.uuid}, ${seller.id}, ${fromUtc(p.saleDate)}, ${totalAmount}, ${commissionAmount}, ${p.notes ?? null})
      RETURNING id`);
    const saleId = (inserted.rows[0] as { id: number }).id;

    for (const [i, item] of p.items.entries()) {
      await tx.execute(sql`
        INSERT INTO seller_sale_items (uuid, sale_id, product_id, quantity, unit_price, subtotal)
        VALUES (${item.uuid}, ${saleId}, ${productIds[i]}, ${item.quantity}, ${item.unitPrice}, ${item.quantity * item.unitPrice})`);
      await recordSellerMovement(tx, {
        uuid: item.movementUuid, productId: productIds[i], sellerId: seller.id, type: "venta", quantityDelta: -item.quantity,
        unitCost: item.unitPrice, sourceType: "seller_sale", sourceId: saleId, occurredAt: p.saleDate,
      });
    }
  },
});

export const createSellerReturn = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    sellerUuid: rowUuid,
    returnDate: utcTimestamp,
    notes,
    items: z
      .array(z.object({ uuid: rowUuid, productUuid: rowUuid, quantity, sellerMovementUuid: rowUuid, principalMovementUuid: rowUuid }))
      .min(1),
  }),
  sellerUuid: (p) => p.sellerUuid,
  async apply(tx, p) {
    const sellerId = await idByUuid(tx, "sellers", p.sellerUuid, "Vendedor");
    const productIds = [];
    for (const item of p.items) productIds.push(await idByUuid(tx, "products", item.productUuid, "Producto"));

    const inserted = await tx.execute(sql`
      INSERT INTO seller_returns (uuid, seller_id, return_date, notes)
      VALUES (${p.uuid}, ${sellerId}, ${fromUtc(p.returnDate)}, ${p.notes ?? null})
      RETURNING id`);
    const returnId = (inserted.rows[0] as { id: number }).id;

    for (const [i, item] of p.items.entries()) {
      await tx.execute(sql`
        INSERT INTO seller_return_items (uuid, return_id, product_id, quantity)
        VALUES (${item.uuid}, ${returnId}, ${productIds[i]}, ${item.quantity})`);
      // Two rows of the same ledger: out of the seller, back into the principal.
      await recordSellerMovement(tx, {
        uuid: item.sellerMovementUuid, productId: productIds[i], sellerId, type: "devolucion", quantityDelta: -item.quantity,
        sourceType: "seller_return", sourceId: returnId, occurredAt: p.returnDate,
      });
      await changePrincipalStock(tx, {
        uuid: item.principalMovementUuid, productId: productIds[i], type: "devolucion", quantityDelta: item.quantity,
        sourceType: "seller_return", sourceId: returnId, occurredAt: p.returnDate,
      });
    }
  },
});

export const createSellerLoss = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    sellerUuid: rowUuid,
    type: z.enum(["perdida", "dano", "robo"]),
    lossDate: utcTimestamp,
    notes,
    items: z
      .array(z.object({ uuid: rowUuid, productUuid: rowUuid, quantity, unitCost: z.number().int().min(0).optional(), movementUuid: rowUuid }))
      .min(1),
  }),
  sellerUuid: (p) => p.sellerUuid,
  async apply(tx, p, { principal }) {
    const sellerId = await idByUuid(tx, "sellers", p.sellerUuid, "Vendedor");
    const products = [];
    for (const item of p.items) {
      const id = await idByUuid(tx, "products", item.productUuid, "Producto");
      const cost = await tx.execute(sql`SELECT purchase_price FROM products WHERE id = ${id}`);
      products.push({ id, purchasePrice: (cost.rows[0] as { purchase_price: number }).purchase_price });
    }

    const inserted = await tx.execute(sql`
      INSERT INTO seller_losses (uuid, seller_id, type, loss_date, notes)
      VALUES (${p.uuid}, ${sellerId}, ${p.type}, ${fromUtc(p.lossDate)}, ${p.notes ?? null})
      RETURNING id`);
    const lossId = (inserted.rows[0] as { id: number }).id;

    for (const [i, item] of p.items.entries()) {
      // A seller's phone never knows purchase costs (the pull zeroes them), so
      // the server prices the loss; the owner may set it explicitly.
      const unitCost = principal.role === "owner" && item.unitCost !== undefined ? item.unitCost : products[i].purchasePrice;
      await tx.execute(sql`
        INSERT INTO seller_loss_items (uuid, loss_id, product_id, quantity, unit_cost)
        VALUES (${item.uuid}, ${lossId}, ${products[i].id}, ${item.quantity}, ${unitCost})`);
      await recordSellerMovement(tx, {
        uuid: item.movementUuid, productId: products[i].id, sellerId, type: p.type, quantityDelta: -item.quantity,
        unitCost, sourceType: "seller_loss", sourceId: lossId, occurredAt: p.lossDate,
      });
    }
  },
});
