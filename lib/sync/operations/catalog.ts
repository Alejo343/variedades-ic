import { sql } from "drizzle-orm";
import { z } from "zod";
import { CONSIGNED_STOCK_BLOCKS_STORE_MODE, hasConsignedStock } from "@/lib/db/queries/seller-inventory";
import { formatSku, getSkuPrefix } from "@/lib/domain/sku";
import { defineHandler, SyncRejection, type Tx } from "../push";
import { idByUuid, rowUuid } from "./shared";

// Catalog upserts from the owner's phone (sub-paso 7, parte 3a): insert the
// row with the phone's uuid, or overwrite the whole record if it exists. Two
// edits of the same row: the one that reaches the server last wins (a single
// owner edits the catalog; comparing edit times would need updated_at on four
// more tables and trusting each phone's clock). Web-only columns (featured,
// whatsapp_text, category color/image) are never touched by an update.

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = z.string().max(2000).nullish();

async function exists(tx: Tx, table: string, uuid: string) {
  const result = await tx.execute(sql`SELECT id FROM ${sql.identifier(table)} WHERE uuid = ${uuid}`);
  return (result.rows[0] as { id: number } | undefined)?.id ?? null;
}

export const upsertCategory = defineHandler({
  schema: z.object({ uuid: rowUuid, name: text(100), slug: text(100), description: optionalText, active: z.boolean() }),
  async apply(tx, p) {
    await tx.execute(sql`
      INSERT INTO categories (uuid, name, slug, description, active)
      VALUES (${p.uuid}, ${p.name}, ${p.slug}, ${p.description ?? null}, ${p.active})
      ON CONFLICT (uuid) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, active = EXCLUDED.active`);
  },
});

const imageSchema = z.object({
  uuid: rowUuid,
  url: z.string().min(1).max(500).refine((url) => !url.startsWith("file:"), "La foto todavía no se ha subido al servidor"),
  alt: z.string().max(200).nullish(),
  displayOrder: z.number().int().min(0),
  isPrimary: z.boolean(),
});

export const upsertProduct = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    name: text(200),
    slug: text(200),
    description: optionalText,
    price: z.number().int().min(0),
    purchasePrice: z.number().int().min(0),
    categoryUuid: rowUuid.nullable(),
    distributorCode: z.string().trim().min(1).max(100).nullable(),
    minStock: z.number().int().min(0),
    warrantyMonths: z.number().int().min(0).nullable(),
    active: z.boolean(),
    // Absent = leave the gallery alone; present = the full gallery.
    images: z
      .array(imageSchema)
      .refine((imgs) => imgs.length === 0 || imgs.filter((i) => i.isPrimary).length === 1, "La galería debe tener exactamente una foto principal")
      .optional(),
    // sku and stock are never taken from the phone: the server assigns the SKU
    // and stock only moves through inventory movements (zod drops them).
  }),
  async apply(tx, p) {
    const categoryId = p.categoryUuid ? await idByUuid(tx, "categories", p.categoryUuid, "Categoría") : null;
    let productId = await exists(tx, "products", p.uuid);

    if (productId === null) {
      // Same SKU scheme as the panel's generateProductSku.
      const category = categoryId === null ? null : await tx.execute(sql`SELECT name FROM categories WHERE id = ${categoryId}`);
      const categoryName = (category?.rows[0] as { name: string } | undefined)?.name ?? null;
      const seq = await tx.execute(sql`SELECT nextval('product_sku_seq') AS n`);
      const sku = formatSku(getSkuPrefix(categoryName), Number((seq.rows[0] as { n: string }).n));
      const inserted = await tx.execute(sql`
        INSERT INTO products (uuid, name, slug, description, sku, price, purchase_price, category_id, distributor_code, min_stock, warranty_months, active)
        VALUES (${p.uuid}, ${p.name}, ${p.slug}, ${p.description ?? null}, ${sku}, ${p.price}, ${p.purchasePrice}, ${categoryId},
                ${p.distributorCode}, ${p.minStock}, ${p.warrantyMonths}, ${p.active})
        RETURNING id`);
      productId = (inserted.rows[0] as { id: number }).id;
    } else {
      await tx.execute(sql`
        UPDATE products SET name = ${p.name}, slug = ${p.slug}, description = ${p.description ?? null}, price = ${p.price},
          purchase_price = ${p.purchasePrice}, category_id = ${categoryId}, distributor_code = ${p.distributorCode},
          min_stock = ${p.minStock}, warranty_months = ${p.warrantyMonths}, active = ${p.active}, updated_at = now()
        WHERE id = ${productId}`);
    }

    if (p.images) await replaceGallery(tx, productId, p.images);
  },
});

// Replaces the whole gallery, keeping rows (and their uuids) that stay; the
// removed ones leave tombstones through the delete trigger.
async function replaceGallery(tx: Tx, productId: number, images: z.infer<typeof imageSchema>[]) {
  for (const img of images) {
    const owner = await tx.execute(sql`SELECT product_id FROM product_images WHERE uuid = ${img.uuid}`);
    const ownerId = (owner.rows[0] as { product_id: number } | undefined)?.product_id;
    if (ownerId !== undefined && ownerId !== productId) throw new SyncRejection(`La foto ${img.uuid} pertenece a otro producto`);
  }
  // One comma-joined parameter; an empty gallery gives an empty array, so every row goes.
  const keep = images.map((i) => i.uuid).join(",");
  await tx.execute(sql`
    DELETE FROM product_images WHERE product_id = ${productId}
      AND NOT (uuid = ANY(string_to_array(${keep}, ',')::uuid[]))`);
  for (const img of images) {
    await tx.execute(sql`
      INSERT INTO product_images (uuid, product_id, url, alt, display_order, is_primary)
      VALUES (${img.uuid}, ${productId}, ${img.url}, ${img.alt ?? null}, ${img.displayOrder}, ${img.isPrimary})
      ON CONFLICT (uuid) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, display_order = EXCLUDED.display_order, is_primary = EXCLUDED.is_primary`);
  }
}

export const upsertSeller = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    name: text(200),
    phone: z.string().max(50).nullish(),
    city: z.string().max(100).nullish(),
    commissionType: z.enum(["percentage", "fixed_per_unit"]),
    commissionValue: z.number().int().min(0),
    // Optional so an app version that predates it never resets a seller's mode.
    inventoryMode: z.enum(["consignment", "store"]).optional(),
    active: z.boolean(),
    notes: optionalText,
  }),
  async apply(tx, p) {
    if (p.inventoryMode === "store") {
      const current = await tx.execute(sql`SELECT id, inventory_mode FROM sellers WHERE uuid = ${p.uuid}`);
      const row = current.rows[0] as { id: number; inventory_mode: string } | undefined;
      if (row && row.inventory_mode !== "store" && (await hasConsignedStock(tx, row.id))) {
        throw new SyncRejection(CONSIGNED_STOCK_BLOCKS_STORE_MODE);
      }
    }
    await tx.execute(sql`
      INSERT INTO sellers (uuid, name, phone, city, commission_type, commission_value, inventory_mode, active, notes)
      VALUES (${p.uuid}, ${p.name}, ${p.phone ?? null}, ${p.city ?? null}, ${p.commissionType}, ${p.commissionValue},
        ${p.inventoryMode ?? "consignment"}, ${p.active}, ${p.notes ?? null})
      ON CONFLICT (uuid) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, city = EXCLUDED.city,
        commission_type = EXCLUDED.commission_type, commission_value = EXCLUDED.commission_value,
        inventory_mode = COALESCE(${p.inventoryMode ?? null}, sellers.inventory_mode), active = EXCLUDED.active, notes = EXCLUDED.notes`);
  },
});

export const upsertDistributor = defineHandler({
  schema: z.object({
    uuid: rowUuid,
    name: text(200),
    city: z.string().max(100).nullish(),
    phone: z.string().max(50).nullish(),
    notes: optionalText,
    active: z.boolean(),
  }),
  async apply(tx, p) {
    await tx.execute(sql`
      INSERT INTO distributors (uuid, name, city, phone, notes, active)
      VALUES (${p.uuid}, ${p.name}, ${p.city ?? null}, ${p.phone ?? null}, ${p.notes ?? null}, ${p.active})
      ON CONFLICT (uuid) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, phone = EXCLUDED.phone, notes = EXCLUDED.notes, active = EXCLUDED.active`);
  },
});

export const upsertCashAccount = defineHandler({
  schema: z.object({ uuid: rowUuid, name: text(100), type: z.enum(["efectivo", "banco"]), active: z.boolean(), notes: optionalText }),
  async apply(tx, p) {
    await tx.execute(sql`
      INSERT INTO cash_accounts (uuid, name, type, active, notes)
      VALUES (${p.uuid}, ${p.name}, ${p.type}, ${p.active}, ${p.notes ?? null})
      ON CONFLICT (uuid) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, active = EXCLUDED.active, notes = EXCLUDED.notes`);
  },
});
