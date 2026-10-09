// SKU = product code. Auto-generated SKUs follow `{PREFIX}-{sequence}` where
// PREFIX comes from the category name (getSkuPrefix) and the sequence from the
// Postgres sequence `product_sku_seq` (at least 5 digits). The owner can also
// type their own SKU ("SKU propio"), which is kept as-is.

export function getSkuPrefix(categoryName?: string | null): string {
  if (!categoryName || !categoryName.trim()) {
    return "GEN";
  }
  const letters = categoryName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return letters.slice(0, 4) || "GEN";
}

export function formatSku(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(5, "0")}`;
}

const SKU_PATTERN = /^[A-Z0-9._-]{1,50}$/;

/**
 * Canonical form of a typed SKU: trimmed and uppercase. Returns null when it
 * isn't a valid SKU (empty, inner spaces, accents/other symbols, > 50 chars).
 */
export function normalizeSku(input: string): string | null {
  const sku = input.trim().toUpperCase();
  return SKU_PATTERN.test(sku) ? sku : null;
}

const AUTO_SKU = /^([A-Z]{1,4})-(\d{5,})$/;

/** `{prefix, sequence}` when the SKU has the auto-generated shape, else null. */
export function parseAutoSku(sku: string): { prefix: string; sequence: number } | null {
  const m = AUTO_SKU.exec(sku);
  return m ? { prefix: m[1], sequence: Number(m[2]) } : null;
}

/**
 * When a product moves to another category, its SKU follows only if it is
 * still the auto SKU of the OLD category (same prefix): the prefix changes and
 * the number is kept (TECN-00012 → BELL-00012). Custom SKUs, or auto-looking
 * SKUs that no longer match their category, are left alone. Returns the new
 * SKU, or null when nothing should change.
 */
export function skuAfterCategoryChange(
  currentSku: string,
  oldCategoryName: string | null | undefined,
  newCategoryName: string | null | undefined,
): string | null {
  const auto = parseAutoSku(currentSku);
  if (!auto) return null;
  const oldPrefix = getSkuPrefix(oldCategoryName);
  const newPrefix = getSkuPrefix(newCategoryName);
  if (auto.prefix !== oldPrefix || newPrefix === oldPrefix) return null;
  return formatSku(newPrefix, auto.sequence);
}
