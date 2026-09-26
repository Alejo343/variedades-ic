import type { OperationHandlers } from "../push";
import { createCashMovement, createDirectSale, createInventoryAdjustment } from "./cash-sales";
import { upsertCashAccount, upsertCategory, upsertDistributor, upsertProduct, upsertSeller } from "./catalog";
import { createSellerLoss, createSellerReturn, createSellerSale } from "./seller";

// Registry of the operations the server knows how to apply (sub-paso 7). A
// type in SYNC_OPERATION_TYPES without a handler here is rejected as
// "todavía no está disponible". Owner operations arrive in parte 3.
export const syncHandlers: OperationHandlers = {
  createSellerSale,
  createSellerReturn,
  createSellerLoss,
  upsertCategory,
  upsertProduct,
  upsertSeller,
  upsertDistributor,
  upsertCashAccount,
  createCashMovement,
  createDirectSale,
  createInventoryAdjustment,
};
