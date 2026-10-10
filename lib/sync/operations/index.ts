import type { OperationHandlers } from "../push";
import { createSellerDelivery, createSettlement, markSettlementSettled } from "./deliveries-settlements";
import { createCashMovement, createCashTransfer, createDirectSale, createInventoryAdjustment } from "./cash-sales";
import { createCommissionPayment } from "./commissions";
import { upsertCashAccount, upsertCategory, upsertDistributor, upsertProduct, upsertSeller } from "./catalog";
import { createPurchaseOrder, createPurchasePayment, transitionPurchaseOrder } from "./purchases";
import { createSellerLoss, createSellerReturn, createSellerSale } from "./seller";

// Registry of the operations the server knows how to apply (sub-paso 7) —
// one handler per type in SYNC_OPERATION_TYPES (checked by a test).
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
  createCashTransfer,
  createDirectSale,
  createInventoryAdjustment,
  createSellerDelivery,
  createSettlement,
  markSettlementSettled,
  createPurchaseOrder,
  transitionPurchaseOrder,
  createPurchasePayment,
  createCommissionPayment,
};
