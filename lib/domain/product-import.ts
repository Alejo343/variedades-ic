import { toSlug } from "@/lib/validations";
import { parseCOPNumber } from "./purchase-import";

// Catalog import from the downloadable template (Productos → Importar).
//
// Contract:
// - The sheet's first row must contain ALL template headers (any order, case
//   and accents ignored); otherwise the whole file is rejected with the list
//   of missing columns — the user is expected to fill the template, not an
//   arbitrary sheet. Extra columns are ignored.
// - Fully empty rows are skipped silently; any other invalid row is reported.
// - Matching against existing products: SKU first (if given it MUST exist),
//   then código de proveedor, then normalized name.
// - Existing product: non-empty cells overwrite, empty cells keep the current
//   value. "Cantidad" SETS the stock (a count), producing a stock delta.
// - New product: "Precio venta" is required; empty optional cells get the same
//   defaults as the product form. "Cantidad" is the initial stock.
// - A plan with any row error must not be applied (all-or-nothing).

export type ImportColumnKey =
  | "sku"
  | "name"
  | "category"
  | "price"
  | "cost"
  | "quantity"
  | "minStock"
  | "distributorCode"
  | "warrantyMonths"
  | "description"
  | "active";

export type ImportColumn = {
  key: ImportColumnKey;
  header: string;
  required: "always" | "new" | "no";
  help: string;
  example: string;
};

export const PRODUCT_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "sku", header: "SKU", required: "no", help: "Déjalo vacío para crear un producto nuevo (el SKU se genera solo). Escríbelo para actualizar uno que ya existe.", example: "TECN-00002" },
  { key: "name", header: "Nombre", required: "always", help: "Nombre del producto. Si no hay SKU, se usa para encontrar el producto existente.", example: "Audífonos Bluetooth 1Hora" },
  { key: "category", header: "Categoría", required: "no", help: "Debe ser una categoría que ya exista en el panel.", example: "Tecnología" },
  { key: "price", header: "Precio venta", required: "new", help: "Precio al público, en pesos. Obligatorio para productos nuevos.", example: "50000" },
  { key: "cost", header: "Costo", required: "no", help: "Precio de compra, en pesos.", example: "30000" },
  { key: "quantity", header: "Cantidad", required: "no", help: "Unidades que tienes. En productos existentes reemplaza el stock actual (queda como ajuste en el historial).", example: "12" },
  { key: "minStock", header: "Stock mínimo", required: "no", help: "Avisa cuando el stock llegue a este número.", example: "3" },
  { key: "distributorCode", header: "Código proveedor", required: "no", help: "Código que usa tu distribuidor para el producto. Debe ser único.", example: "AUD-1H" },
  { key: "warrantyMonths", header: "Garantía (meses)", required: "no", help: "Meses de garantía.", example: "6" },
  { key: "description", header: "Descripción", required: "no", help: "Texto que se ve en el catálogo público.", example: "Bluetooth 5.3, 20 horas de batería" },
  { key: "active", header: "Activo", required: "no", help: "sí o no. Vacío = sí.", example: "sí" },
];

export type ProductImportRow = {
  rowNumber: number;
  sku: string | null;
  name: string;
  category: string | null;
  price: number | null;
  cost: number | null;
  quantity: number | null;
  minStock: number | null;
  distributorCode: string | null;
  warrantyMonths: number | null;
  description: string | null;
  active: boolean | null;
};

export type RowError = { rowNumber: number; reason: string };

export type ParseProductSheetResult =
  | { ok: false; missingColumns: string[] }
  | { ok: true; rows: ProductImportRow[]; errors: RowError[] };

export function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

const NUMERIC_KEYS: ImportColumnKey[] = ["price", "cost", "quantity", "minStock", "warrantyMonths"];

function parseActive(text: string): boolean | null | "invalid" {
  if (!text) return null;
  const t = normalizeText(text);
  if (["si", "s", "1", "true", "x", "activo"].includes(t)) return true;
  if (["no", "n", "0", "false", "inactivo"].includes(t)) return false;
  return "invalid";
}

export function parseProductSheet(sheetRows: unknown[][]): ParseProductSheetResult {
  const header = (sheetRows[0] ?? []).map((h) => normalizeText(cellText(h)));
  const indexOf = new Map<ImportColumnKey, number>();
  const missing: string[] = [];
  for (const col of PRODUCT_IMPORT_COLUMNS) {
    const idx = header.indexOf(normalizeText(col.header));
    if (idx === -1) missing.push(col.header);
    else indexOf.set(col.key, idx);
  }
  if (missing.length > 0) return { ok: false, missingColumns: missing };

  const rows: ProductImportRow[] = [];
  const errors: RowError[] = [];

  sheetRows.slice(1).forEach((raw, i) => {
    const rowNumber = i + 2;
    const cell = (key: ImportColumnKey) => cellText(raw?.[indexOf.get(key)!]);
    if (PRODUCT_IMPORT_COLUMNS.every((c) => cell(c.key) === "")) return;

    const name = cell("name");
    if (!name) {
      errors.push({ rowNumber, reason: "Falta el nombre" });
      return;
    }

    const numbers: Partial<Record<ImportColumnKey, number | null>> = {};
    for (const key of NUMERIC_KEYS) {
      const text = cell(key);
      if (!text) {
        numbers[key] = null;
        continue;
      }
      const n = parseCOPNumber(raw?.[indexOf.get(key)!]);
      if (n === null || /^-/.test(text)) {
        const col = PRODUCT_IMPORT_COLUMNS.find((c) => c.key === key)!;
        errors.push({ rowNumber, reason: `"${col.header}" no es un número válido: ${text}` });
        return;
      }
      numbers[key] = n;
    }

    const active = parseActive(cell("active"));
    if (active === "invalid") {
      errors.push({ rowNumber, reason: `"Activo" debe ser sí o no: ${cell("active")}` });
      return;
    }

    rows.push({
      rowNumber,
      sku: cell("sku") || null,
      name,
      category: cell("category") || null,
      price: numbers.price ?? null,
      cost: numbers.cost ?? null,
      quantity: numbers.quantity ?? null,
      minStock: numbers.minStock ?? null,
      distributorCode: cell("distributorCode") || null,
      warrantyMonths: numbers.warrantyMonths ?? null,
      description: cell("description") || null,
      active,
    });
  });

  return { ok: true, rows, errors };
}

export type ExistingProduct = {
  id: number;
  name: string;
  sku: string;
  slug: string;
  distributorCode: string | null;
  stock: number;
  price: number;
  purchasePrice: number | null;
  categoryId: number | null;
  minStock: number;
  warrantyMonths: number | null;
  description: string | null;
  active: boolean;
};

export type ExistingCategory = { id: number; name: string };

export type ProductFields = {
  name: string;
  price: number;
  purchasePrice: number;
  categoryId: number | null;
  minStock: number;
  distributorCode: string | null;
  warrantyMonths: number | null;
  description: string | null;
  active: boolean;
};

export type FieldChange = { field: string; from: string; to: string };

export type PlannedCreate = {
  rowNumber: number;
  slug: string;
  categoryName: string | null;
  fields: ProductFields;
  initialStock: number;
};

export type PlannedUpdate = {
  rowNumber: number;
  productId: number;
  sku: string;
  name: string;
  fields: Partial<ProductFields>;
  changes: FieldChange[];
  /** quantity − current stock; 0 when the count matches or no quantity was given. */
  stockDelta: number;
};

export type ProductImportPlan = {
  creates: PlannedCreate[];
  updates: PlannedUpdate[];
  unchanged: { rowNumber: number; productId: number; name: string }[];
  errors: RowError[];
};

const FIELD_LABEL: Record<keyof ProductFields, string> = {
  name: "Nombre",
  price: "Precio venta",
  purchasePrice: "Costo",
  categoryId: "Categoría",
  minStock: "Stock mínimo",
  distributorCode: "Código proveedor",
  warrantyMonths: "Garantía",
  description: "Descripción",
  active: "Activo",
};

function uniqueSlug(base: string, used: Set<string>): string {
  const root = base || "producto";
  if (!used.has(root)) return root;
  let n = 2;
  while (used.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

export function planProductImport(
  rows: ProductImportRow[],
  existing: ExistingProduct[],
  categories: ExistingCategory[],
): ProductImportPlan {
  const plan: ProductImportPlan = { creates: [], updates: [], unchanged: [], errors: [] };

  const bySku = new Map(existing.map((p) => [p.sku.toLowerCase(), p]));
  const byCode = new Map(existing.filter((p) => p.distributorCode).map((p) => [p.distributorCode!.toLowerCase(), p]));
  const byName = new Map(existing.map((p) => [normalizeText(p.name), p]));
  const categoryByName = new Map(categories.map((c) => [normalizeText(c.name), c]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const usedSlugs = new Set(existing.map((p) => p.slug));

  // Who already "owns" each key within this file, to catch duplicated rows.
  const seenProduct = new Map<number, number>();
  const seenNewName = new Map<string, number>();
  const seenCode = new Map<string, number>();

  for (const row of rows) {
    let match: ExistingProduct | undefined;
    if (row.sku) {
      match = bySku.get(row.sku.toLowerCase());
      if (!match) {
        plan.errors.push({ rowNumber: row.rowNumber, reason: `El SKU ${row.sku} no existe. Déjalo vacío para crear un producto nuevo.` });
        continue;
      }
    } else if (row.distributorCode && byCode.has(row.distributorCode.toLowerCase())) {
      match = byCode.get(row.distributorCode.toLowerCase());
    } else {
      match = byName.get(normalizeText(row.name));
    }

    let categoryId: number | null | undefined;
    if (row.category) {
      const cat = categoryByName.get(normalizeText(row.category));
      if (!cat) {
        plan.errors.push({ rowNumber: row.rowNumber, reason: `La categoría "${row.category}" no existe. Créala primero en Categorías.` });
        continue;
      }
      categoryId = cat.id;
    }

    if (row.distributorCode) {
      const code = row.distributorCode.toLowerCase();
      const owner = byCode.get(code);
      if (owner && owner.id !== match?.id) {
        plan.errors.push({ rowNumber: row.rowNumber, reason: `El código de proveedor ${row.distributorCode} ya lo tiene "${owner.name}".` });
        continue;
      }
      const prevRow = seenCode.get(code);
      if (prevRow !== undefined) {
        plan.errors.push({ rowNumber: row.rowNumber, reason: `Código de proveedor repetido (también en la fila ${prevRow}).` });
        continue;
      }
    }

    if (match) {
      const prevRow = seenProduct.get(match.id);
      if (prevRow !== undefined) {
        plan.errors.push({ rowNumber: row.rowNumber, reason: `"${match.name}" aparece dos veces (también en la fila ${prevRow}).` });
        continue;
      }
      seenProduct.set(match.id, row.rowNumber);
      if (row.distributorCode) seenCode.set(row.distributorCode.toLowerCase(), row.rowNumber);

      const fields: Partial<ProductFields> = {};
      const changes: FieldChange[] = [];
      const set = <K extends keyof ProductFields>(key: K, next: ProductFields[K] | null | undefined, current: ProductFields[K], show?: (v: ProductFields[K]) => string) => {
        if (next === null || next === undefined || next === current) return;
        fields[key] = next;
        const fmt = show ?? ((v: ProductFields[K]) => (v === null || v === undefined || v === "" ? "—" : String(v)));
        changes.push({ field: FIELD_LABEL[key], from: fmt(current), to: fmt(next) });
      };
      const catName = (id: number | null) => (id === null ? "—" : (categoryName.get(id) ?? "—"));
      const yesNo = (v: boolean) => (v ? "sí" : "no");
      const money = (v: number) => `$${v.toLocaleString("es-CO")}`;

      // A name that only differs in case/accents/spaces is the same name: don't rename.
      if (normalizeText(row.name) !== normalizeText(match.name)) set("name", row.name, match.name);
      set("price", row.price, match.price, money);
      set("purchasePrice", row.cost, match.purchasePrice ?? 0, money);
      set("categoryId", categoryId, match.categoryId, catName);
      set("minStock", row.minStock, match.minStock);
      set("distributorCode", row.distributorCode, match.distributorCode);
      set("warrantyMonths", row.warrantyMonths, match.warrantyMonths);
      set("description", row.description, match.description);
      set("active", row.active, match.active, yesNo);

      const stockDelta = row.quantity === null ? 0 : row.quantity - match.stock;
      if (stockDelta !== 0) changes.push({ field: "Stock", from: String(match.stock), to: String(row.quantity) });

      if (changes.length === 0) {
        plan.unchanged.push({ rowNumber: row.rowNumber, productId: match.id, name: match.name });
      } else {
        plan.updates.push({ rowNumber: row.rowNumber, productId: match.id, sku: match.sku, name: match.name, fields, changes, stockDelta });
      }
      continue;
    }

    // New product
    const key = normalizeText(row.name);
    const prevNew = seenNewName.get(key);
    if (prevNew !== undefined) {
      plan.errors.push({ rowNumber: row.rowNumber, reason: `"${row.name}" aparece dos veces (también en la fila ${prevNew}).` });
      continue;
    }
    if (row.price === null) {
      plan.errors.push({ rowNumber: row.rowNumber, reason: `"${row.name}" es nuevo y le falta el Precio venta.` });
      continue;
    }
    seenNewName.set(key, row.rowNumber);
    if (row.distributorCode) seenCode.set(row.distributorCode.toLowerCase(), row.rowNumber);

    const slug = uniqueSlug(toSlug(row.name), usedSlugs);
    usedSlugs.add(slug);
    plan.creates.push({
      rowNumber: row.rowNumber,
      slug,
      categoryName: categoryId ? (categoryName.get(categoryId) ?? null) : null,
      fields: {
        name: row.name,
        price: row.price,
        purchasePrice: row.cost ?? 0,
        categoryId: categoryId ?? null,
        minStock: row.minStock ?? 0,
        distributorCode: row.distributorCode,
        warrantyMonths: row.warrantyMonths,
        description: row.description,
        active: row.active ?? true,
      },
      initialStock: row.quantity ?? 0,
    });
  }

  return plan;
}
