import { describe, expect, it } from "vitest";
import { productSchema, sellerUserCreateSchema, sellerUserUpdateSchema, syncLoginSchema, syncPushSchema, toSlug } from "./validations";

describe("toSlug", () => {
  it("convierte a minúsculas", () => {
    expect(toSlug("Auriculares")).toBe("auriculares");
  });

  it("reemplaza espacios por guiones", () => {
    expect(toSlug("Crema Facial Hidratante")).toBe("crema-facial-hidratante");
  });

  it("colapsa espacios múltiples en un solo guion", () => {
    expect(toSlug("Set  de   Belleza")).toBe("set-de-belleza");
  });

  it("quita acentos", () => {
    expect(toSlug("Cámara Réflex")).toBe("camara-reflex");
  });

  it("quita caracteres especiales", () => {
    expect(toSlug("Audífonos (Bluetooth) 5.0!")).toBe("audifonos-bluetooth-50");
  });

  it("recorta espacios al inicio y al final", () => {
    expect(toSlug("  Producto  ")).toBe("producto");
  });

  it("devuelve string vacío para entrada vacía", () => {
    expect(toSlug("")).toBe("");
  });
});

describe("sellerUserCreateSchema", () => {
  it("normaliza el usuario (minúsculas, sin espacios alrededor)", () => {
    const parsed = sellerUserCreateSchema.parse({ username: "  Maria.Gomez ", password: "clave-segura" });
    expect(parsed).toEqual({ username: "maria.gomez", password: "clave-segura" });
  });

  it("rechaza usuario corto, con espacios internos o caracteres raros", () => {
    expect(sellerUserCreateSchema.safeParse({ username: "ab", password: "clave-segura" }).success).toBe(false);
    expect(sellerUserCreateSchema.safeParse({ username: "maria gomez", password: "clave-segura" }).success).toBe(false);
    expect(sellerUserCreateSchema.safeParse({ username: "maría", password: "clave-segura" }).success).toBe(false);
  });

  it("exige contraseña de al menos 8 caracteres", () => {
    expect(sellerUserCreateSchema.safeParse({ username: "maria", password: "1234567" }).success).toBe(false);
  });
});

describe("sellerUserUpdateSchema", () => {
  it("acepta cambiar solo la contraseña o solo el estado", () => {
    expect(sellerUserUpdateSchema.parse({ password: "otra-clave" })).toEqual({ password: "otra-clave" });
    expect(sellerUserUpdateSchema.parse({ active: false })).toEqual({ active: false });
  });

  it("rechaza un cambio vacío o una contraseña corta", () => {
    expect(sellerUserUpdateSchema.safeParse({}).success).toBe(false);
    expect(sellerUserUpdateSchema.safeParse({ password: "corta" }).success).toBe(false);
  });
});

describe("syncLoginSchema", () => {
  it("normaliza el usuario y acepta el correo del dueño tal cual", () => {
    expect(syncLoginSchema.parse({ username: " Dueno+Tienda@Mail.com ", password: "x", deviceName: "Moto G" })).toEqual({
      username: "dueno+tienda@mail.com",
      password: "x",
      deviceName: "Moto G",
    });
  });

  it("exige usuario y contraseña; el nombre del celular es opcional", () => {
    expect(syncLoginSchema.safeParse({ username: "  ", password: "x" }).success).toBe(false);
    expect(syncLoginSchema.safeParse({ username: "maria", password: "" }).success).toBe(false);
    expect(syncLoginSchema.parse({ username: "maria", password: "x" }).deviceName).toBeUndefined();
  });
});

describe("syncPushSchema", () => {
  const op = { id: "3f2a9c1e-7b4d-4e1a-9c2f-8d6b5a4e3f21", type: "createSellerSale", payload: { any: "thing" } };

  it("acepta un lote de operaciones con id uuid y payload libre", () => {
    expect(syncPushSchema.parse({ operations: [op] })).toEqual({ operations: [op] });
  });

  it("rechaza lotes vacíos, de más de 100, ids que no son uuid o ids repetidos", () => {
    expect(syncPushSchema.safeParse({ operations: [] }).success).toBe(false);
    expect(syncPushSchema.safeParse({ operations: Array.from({ length: 101 }, (_, i) => ({ ...op, id: `3f2a9c1e-7b4d-4e1a-9c2f-${String(i).padStart(12, "0")}` })) }).success).toBe(false);
    expect(syncPushSchema.safeParse({ operations: [{ ...op, id: "7" }] }).success).toBe(false);
    expect(syncPushSchema.safeParse({ operations: [op, op] }).success).toBe(false);
  });
});

describe("productSchema.sku", () => {
  const base = { name: "Producto", slug: "producto", price: 1000 };

  it("vacío o ausente significa 'automático / sin cambio'", () => {
    expect(productSchema.parse(base).sku).toBeUndefined();
    expect(productSchema.parse({ ...base, sku: "   " }).sku).toBeUndefined();
  });

  it("normaliza un SKU propio a mayúsculas", () => {
    expect(productSchema.parse({ ...base, sku: " mi-sku-1 " }).sku).toBe("MI-SKU-1");
  });

  it("rechaza un SKU con espacios o caracteres no permitidos", () => {
    expect(productSchema.safeParse({ ...base, sku: "MI SKU" }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, sku: "SKU#1" }).success).toBe(false);
  });
});
