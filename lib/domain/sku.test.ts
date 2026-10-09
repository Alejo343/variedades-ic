import { describe, expect, it } from "vitest";
import { formatSku, getSkuPrefix, normalizeSku, parseAutoSku, skuAfterCategoryChange } from "./sku";

describe("getSkuPrefix", () => {
  it("toma las primeras 4 letras de la categoría, en mayúsculas y sin tildes", () => {
    expect(getSkuPrefix("Tecnología")).toBe("TECN");
  });

  it("usa el prefijo genérico cuando no hay categoría", () => {
    expect(getSkuPrefix(null)).toBe("GEN");
    expect(getSkuPrefix(undefined)).toBe("GEN");
    expect(getSkuPrefix("   ")).toBe("GEN");
  });

  it("conserva prefijos más cortos que 4 letras", () => {
    expect(getSkuPrefix("TV")).toBe("TV");
  });
});

describe("formatSku", () => {
  it("combina prefijo y secuencia con relleno de ceros a 5 dígitos", () => {
    expect(formatSku("ELEC", 1)).toBe("ELEC-00001");
  });

  it("rellena secuencias intermedias", () => {
    expect(formatSku("GEN", 42)).toBe("GEN-00042");
  });

  it("no trunca secuencias que superan 5 dígitos", () => {
    expect(formatSku("GEN", 100000)).toBe("GEN-100000");
  });
});

describe("normalizeSku", () => {
  it("pasa a mayúsculas y quita espacios de los extremos", () => {
    expect(normalizeSku("  abc-12 ")).toBe("ABC-12");
  });

  it("acepta letras, números, guion, punto y guion bajo", () => {
    expect(normalizeSku("TV_4K.55-A")).toBe("TV_4K.55-A");
  });

  it("rechaza vacío, espacios internos, tildes o más de 50 caracteres", () => {
    expect(normalizeSku("   ")).toBeNull();
    expect(normalizeSku("AB 12")).toBeNull();
    expect(normalizeSku("CAÑA-1")).toBeNull();
    expect(normalizeSku("A".repeat(51))).toBeNull();
  });
});

describe("parseAutoSku", () => {
  it("reconoce el formato automático y devuelve prefijo y número", () => {
    expect(parseAutoSku("TECN-00012")).toEqual({ prefix: "TECN", sequence: 12 });
    expect(parseAutoSku("GEN-100000")).toEqual({ prefix: "GEN", sequence: 100000 });
  });

  it("no reconoce SKUs propios", () => {
    expect(parseAutoSku("AUD-1H")).toBeNull();
    expect(parseAutoSku("TECN-12")).toBeNull();
    expect(parseAutoSku("MI-SKU")).toBeNull();
  });
});

describe("skuAfterCategoryChange", () => {
  it("cambia el prefijo y conserva el número si el SKU sigue el formato de su categoría", () => {
    expect(skuAfterCategoryChange("TECN-00012", "Tecnología", "Belleza")).toBe("BELL-00012");
  });

  it("pasa de genérico (sin categoría) a la categoría nueva, y viceversa", () => {
    expect(skuAfterCategoryChange("GEN-00004", null, "Hogar")).toBe("HOGA-00004");
    expect(skuAfterCategoryChange("HOGA-00004", "Hogar", null)).toBe("GEN-00004");
  });

  it("no toca un SKU propio", () => {
    expect(skuAfterCategoryChange("AUD-1H", "Tecnología", "Belleza")).toBeNull();
  });

  it("no toca un SKU automático que ya no corresponde a su categoría actual", () => {
    expect(skuAfterCategoryChange("TECN-00099", "Hogar", "Belleza")).toBeNull();
  });

  it("no hace nada si el prefijo no cambia", () => {
    expect(skuAfterCategoryChange("TECN-00012", "Tecnología", "Tecnologia")).toBeNull();
  });
});
