import { describe, expect, it } from "vitest";
import { authorizeOperation, SYNC_OPERATION_TYPES } from "./sync-permissions";

const owner = { role: "owner" as const, sellerUuid: null };
const maria = { role: "seller" as const, sellerUuid: "seller-maria" };

describe("authorizeOperation", () => {
  it("el dueño puede enviar cualquier operación", () => {
    for (const type of SYNC_OPERATION_TYPES) {
      expect(authorizeOperation(owner, { type, sellerUuid: "seller-x" }).ok, type).toBe(true);
    }
  });

  it("un vendedor solo registra sus propias ventas, devoluciones y pérdidas", () => {
    for (const type of ["createSellerSale", "createSellerReturn", "createSellerLoss", "createDirectSale"] as const) {
      expect(authorizeOperation(maria, { type, sellerUuid: "seller-maria" }).ok, type).toBe(true);
      expect(authorizeOperation(maria, { type, sellerUuid: "seller-pedro" }).ok, `${type} ajena`).toBe(false);
      expect(authorizeOperation(maria, { type }).ok, `${type} sin vendedor`).toBe(false);
    }
  });

  it("un vendedor no puede tocar catálogo, caja, compras, entregas ni liquidaciones", () => {
    const allowed = new Set(["createSellerSale", "createSellerReturn", "createSellerLoss", "createDirectSale"]);
    for (const type of SYNC_OPERATION_TYPES.filter((t) => !allowed.has(t))) {
      const result = authorizeOperation(maria, { type, sellerUuid: "seller-maria" });
      expect(result.ok, type).toBe(false);
    }
  });

  it("rechaza un tipo de operación desconocido, incluso al dueño", () => {
    expect(authorizeOperation(owner, { type: "dropDatabase" }).ok).toBe(false);
  });
});
