import { describe, expect, it } from "vitest";
import { canTransitionPurchaseOrder, canTransitionSalesOrder } from "./order-status";

describe("canTransitionPurchaseOrder", () => {
  it("permite pendiente -> en_viaje", () => {
    expect(canTransitionPurchaseOrder("pendiente", "en_viaje")).toBe(true);
  });

  it("permite pendiente -> cancelado", () => {
    expect(canTransitionPurchaseOrder("pendiente", "cancelado")).toBe(true);
  });

  it("permite en_viaje -> recibido", () => {
    expect(canTransitionPurchaseOrder("en_viaje", "recibido")).toBe(true);
  });

  it("permite en_viaje -> cancelado", () => {
    expect(canTransitionPurchaseOrder("en_viaje", "cancelado")).toBe(true);
  });

  it("rechaza pendiente -> recibido (saltar en_viaje)", () => {
    expect(canTransitionPurchaseOrder("pendiente", "recibido")).toBe(false);
  });

  it("rechaza recibido -> cualquier estado (terminal)", () => {
    expect(canTransitionPurchaseOrder("recibido", "pendiente")).toBe(false);
    expect(canTransitionPurchaseOrder("recibido", "en_viaje")).toBe(false);
    expect(canTransitionPurchaseOrder("recibido", "cancelado")).toBe(false);
  });

  it("rechaza cancelado -> cualquier estado (terminal)", () => {
    expect(canTransitionPurchaseOrder("cancelado", "pendiente")).toBe(false);
    expect(canTransitionPurchaseOrder("cancelado", "en_viaje")).toBe(false);
    expect(canTransitionPurchaseOrder("cancelado", "recibido")).toBe(false);
  });
});

describe("canTransitionSalesOrder", () => {
  it("permite pendiente -> confirmado", () => {
    expect(canTransitionSalesOrder("pendiente", "confirmado")).toBe(true);
  });

  it("permite pendiente -> cancelado", () => {
    expect(canTransitionSalesOrder("pendiente", "cancelado")).toBe(true);
  });

  it("permite confirmado -> entregado", () => {
    expect(canTransitionSalesOrder("confirmado", "entregado")).toBe(true);
  });

  it("permite confirmado -> cancelado", () => {
    expect(canTransitionSalesOrder("confirmado", "cancelado")).toBe(true);
  });

  it("rechaza pendiente -> entregado (saltar confirmado)", () => {
    expect(canTransitionSalesOrder("pendiente", "entregado")).toBe(false);
  });

  it("rechaza entregado -> cualquier estado (terminal)", () => {
    expect(canTransitionSalesOrder("entregado", "pendiente")).toBe(false);
    expect(canTransitionSalesOrder("entregado", "confirmado")).toBe(false);
    expect(canTransitionSalesOrder("entregado", "cancelado")).toBe(false);
  });

  it("rechaza cancelado -> cualquier estado (terminal)", () => {
    expect(canTransitionSalesOrder("cancelado", "pendiente")).toBe(false);
    expect(canTransitionSalesOrder("cancelado", "confirmado")).toBe(false);
    expect(canTransitionSalesOrder("cancelado", "entregado")).toBe(false);
  });
});
