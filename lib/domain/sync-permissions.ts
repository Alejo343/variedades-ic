import type { UserRole } from "./users";

// Every operation a phone can push (sub-paso 7 implements them). Refs are
// uuids, never local ids — see variedades-ic-mobile's CLAUDE.md, "Fase 10".
export const SYNC_OPERATION_TYPES = [
  "upsertCategory",
  "upsertProduct",
  "upsertSeller",
  "upsertDistributor",
  "upsertCashAccount",
  "createInventoryAdjustment",
  "createCashMovement",
  "createDirectSale",
  "createSellerDelivery",
  "createSellerSale",
  "createSellerReturn",
  "createSellerLoss",
  "createPurchaseOrder",
  "transitionPurchaseOrder",
  "createPurchasePayment",
  "createSettlement",
  "markSettlementSettled",
  "createCommissionPayment",
] as const;

export type SyncOperationType = (typeof SYNC_OPERATION_TYPES)[number];

export type SyncPrincipal = { role: UserRole; sellerUuid: string | null };

// What a seller may record from their phone, always about themselves.
// createDirectSale is only for 'store' sellers (selling the principal
// inventory) — the handler checks the seller's mode against the database.
const SELLER_OPERATIONS: ReadonlySet<string> = new Set(["createSellerSale", "createSellerReturn", "createSellerLoss", "createDirectSale"]);

export function authorizeOperation(
  principal: SyncPrincipal,
  op: { type: string; sellerUuid?: string },
): { ok: true } | { ok: false; reason: string } {
  if (!(SYNC_OPERATION_TYPES as readonly string[]).includes(op.type)) {
    return { ok: false, reason: `Operación desconocida: ${op.type}` };
  }
  if (principal.role === "owner") return { ok: true };
  if (!SELLER_OPERATIONS.has(op.type)) {
    return { ok: false, reason: "Un vendedor no puede realizar esta operación" };
  }
  if (!op.sellerUuid || op.sellerUuid !== principal.sellerUuid) {
    return { ok: false, reason: "Un vendedor solo puede registrar operaciones propias" };
  }
  return { ok: true };
}
