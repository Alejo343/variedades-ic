export type PurchaseOrderStatus = "pendiente" | "en_viaje" | "recibido" | "cancelado";
export type SalesOrderStatus = "pendiente" | "confirmado" | "entregado" | "cancelado";

const PURCHASE_ORDER_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  pendiente: ["en_viaje", "cancelado"],
  en_viaje: ["recibido", "cancelado"],
  recibido: [],
  cancelado: [],
};

const SALES_ORDER_TRANSITIONS: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["entregado", "cancelado"],
  entregado: [],
  cancelado: [],
};

export function canTransitionPurchaseOrder(from: PurchaseOrderStatus, to: PurchaseOrderStatus): boolean {
  return PURCHASE_ORDER_TRANSITIONS[from].includes(to);
}

export function canTransitionSalesOrder(from: SalesOrderStatus, to: SalesOrderStatus): boolean {
  return SALES_ORDER_TRANSITIONS[from].includes(to);
}
