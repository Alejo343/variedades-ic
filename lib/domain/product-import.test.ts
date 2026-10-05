import { describe, expect, it } from "vitest";
import {
  PRODUCT_IMPORT_COLUMNS,
  parseProductSheet,
  planProductImport,
  type ExistingProduct,
  type ProductImportRow,
} from "./product-import";

const HEADER = PRODUCT_IMPORT_COLUMNS.map((c) => c.header);

function sheetRow(values: Partial<Record<string, unknown>>): unknown[] {
  return HEADER.map((h) => values[h] ?? "");
}

function row(partial: Partial<ProductImportRow>): ProductImportRow {
  return {
    rowNumber: 2,
    sku: null,
    name: "Producto",
    category: null,
    price: null,
    cost: null,
    quantity: null,
    minStock: null,
    distributorCode: null,
    warrantyMonths: null,
    description: null,
    active: null,
    ...partial,
  };
}

const EXISTING: ExistingProduct[] = [
  {
    id: 1,
    name: "Audífonos Bluetooth",
    sku: "TECN-00001",
    slug: "audifonos-bluetooth",
    distributorCode: "AUD-1",
    stock: 10,
    price: 50000,
    purchasePrice: 30000,
    categoryId: 1,
    minStock: 2,
    warrantyMonths: null,
    description: null,
    active: true,
  },
  {
    id: 2,
    name: "Cargador USB-C",
    sku: "TECN-00002",
    slug: "cargador-usb-c",
    distributorCode: null,
    stock: 0,
    price: 25000,
    purchasePrice: null,
    categoryId: null,
    minStock: 0,
    warrantyMonths: null,
    description: null,
    active: true,
  },
];

const CATEGORIES = [
  { id: 1, name: "Tecnología" },
  { id: 2, name: "Belleza" },
];

describe("parseProductSheet", () => {
  it("rechaza un archivo que no tiene la estructura de la plantilla", () => {
    const result = parseProductSheet([["Código", "Nombre", "Cantidad", "Valor", "Total"]]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missingColumns).toContain("Precio venta");
  });

  it("acepta encabezados en otro orden, sin tildes ni mayúsculas", () => {
    const header = [...HEADER].reverse().map((h) => h.toUpperCase().replace("Í", "I"));
    const result = parseProductSheet([header]);
    expect(result.ok).toBe(true);
  });

  it("lee una fila completa y convierte montos con formato", () => {
    const result = parseProductSheet([
      HEADER,
      sheetRow({ Nombre: " Mouse ", "Precio venta": "$35.000", Costo: 20000, Cantidad: "7", Activo: "No", Categoría: "Tecnología" }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      rowNumber: 2,
      name: "Mouse",
      price: 35000,
      cost: 20000,
      quantity: 7,
      active: false,
      category: "Tecnología",
      sku: null,
    });
  });

  it("salta filas vacías y reporta las inválidas con su número de fila", () => {
    const result = parseProductSheet([
      HEADER,
      sheetRow({}),
      sheetRow({ "Precio venta": 1000 }),
      sheetRow({ Nombre: "X", Cantidad: "muchas" }),
      sheetRow({ Nombre: "Y", Activo: "tal vez" }),
      sheetRow({ Nombre: "Z", Cantidad: "-3" }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toEqual([]);
    expect(result.errors.map((e) => e.rowNumber)).toEqual([3, 4, 5, 6]);
  });
});

describe("planProductImport", () => {
  it("crea un producto nuevo con valores por defecto y stock inicial", () => {
    const plan = planProductImport([row({ name: "Plancha", price: 80000, quantity: 4, category: "belleza" })], EXISTING, CATEGORIES);
    expect(plan.errors).toEqual([]);
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0]).toMatchObject({
      slug: "plancha",
      categoryName: "Belleza",
      initialStock: 4,
      fields: { name: "Plancha", price: 80000, purchasePrice: 0, categoryId: 2, minStock: 0, active: true },
    });
  });

  it("exige precio para productos nuevos", () => {
    const plan = planProductImport([row({ name: "Plancha" })], EXISTING, CATEGORIES);
    expect(plan.creates).toEqual([]);
    expect(plan.errors[0].reason).toContain("Precio venta");
  });

  it("actualiza por SKU solo lo que cambia y fija el stock (delta = cantidad − actual)", () => {
    const plan = planProductImport(
      [row({ sku: "tecn-00001", name: "Audífonos Bluetooth", price: 55000, cost: 30000, quantity: 7 })],
      EXISTING,
      CATEGORIES,
    );
    expect(plan.errors).toEqual([]);
    expect(plan.updates).toHaveLength(1);
    const u = plan.updates[0];
    expect(u.productId).toBe(1);
    expect(u.fields).toEqual({ price: 55000 });
    expect(u.stockDelta).toBe(-3);
    expect(u.changes.map((c) => c.field)).toEqual(["Precio venta", "Stock"]);
  });

  it("encuentra por nombre (sin tildes ni mayúsculas) y por código de proveedor", () => {
    const plan = planProductImport(
      [
        row({ rowNumber: 2, name: "audifonos bluetooth", quantity: 10 }),
        row({ rowNumber: 3, name: "Cargador con otro nombre", distributorCode: "NUEVO-1" }),
      ],
      [EXISTING[0], { ...EXISTING[1], distributorCode: "nuevo-1" }],
      CATEGORIES,
    );
    expect(plan.errors).toEqual([]);
    expect(plan.unchanged.map((u) => u.productId)).toEqual([1]);
    expect(plan.updates[0]).toMatchObject({ productId: 2, fields: { name: "Cargador con otro nombre", distributorCode: "NUEVO-1" } });
  });

  it("celdas vacías no borran datos existentes", () => {
    const plan = planProductImport([row({ sku: "TECN-00001", name: "Audífonos Bluetooth" })], EXISTING, CATEGORIES);
    expect(plan.updates).toEqual([]);
    expect(plan.unchanged).toHaveLength(1);
  });

  it("reporta SKU inexistente, categoría inexistente y código de proveedor ajeno", () => {
    const plan = planProductImport(
      [
        row({ rowNumber: 2, sku: "TECN-99999", name: "A", price: 1 }),
        row({ rowNumber: 3, name: "B", price: 1, category: "Juguetes" }),
        row({ rowNumber: 4, sku: "TECN-00002", name: "Cargador USB-C", distributorCode: "AUD-1" }),
      ],
      EXISTING,
      CATEGORIES,
    );
    expect(plan.creates).toEqual([]);
    expect(plan.errors.map((e) => e.rowNumber)).toEqual([2, 3, 4]);
  });

  it("detecta filas repetidas dentro del mismo archivo", () => {
    const plan = planProductImport(
      [
        row({ rowNumber: 2, name: "Nuevo", price: 1 }),
        row({ rowNumber: 3, name: "NUEVO", price: 2 }),
        row({ rowNumber: 4, sku: "TECN-00002", name: "Cargador USB-C", quantity: 1 }),
        row({ rowNumber: 5, name: "cargador usb-c", quantity: 2 }),
      ],
      EXISTING,
      CATEGORIES,
    );
    expect(plan.creates).toHaveLength(1);
    expect(plan.updates).toHaveLength(1);
    expect(plan.errors.map((e) => e.rowNumber)).toEqual([3, 5]);
  });

  it("genera slugs únicos frente a existentes y entre filas nuevas", () => {
    const plan = planProductImport(
      [row({ rowNumber: 2, name: "Cargador USB C", price: 1 })],
      [{ ...EXISTING[1], name: "Otro nombre" }],
      CATEGORIES,
    );
    expect(plan.creates[0].slug).toBe("cargador-usb-c-2");
  });
});
