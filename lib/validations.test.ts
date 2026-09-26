import { describe, expect, it } from "vitest";
import { sellerUserCreateSchema, sellerUserUpdateSchema, toSlug } from "./validations";

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
