import { describe, expect, it } from "vitest";
import { isCashAdjustment, summarizeCashFlow } from "./cash";

describe("isCashAdjustment", () => {
  it("solo el origen 'ajuste' es ajuste", () => {
    expect(isCashAdjustment({ sourceType: "ajuste" })).toBe(true);
    expect(isCashAdjustment({ sourceType: "manual" })).toBe(false);
    expect(isCashAdjustment({ sourceType: null })).toBe(false);
  });
});

describe("summarizeCashFlow", () => {
  it("separa ajustes de ingresos y gastos, pero todos mueven el saldo", () => {
    const s = summarizeCashFlow([
      { type: "ingreso", amount: 500000, sourceType: "ajuste" }, // saldo inicial
      { type: "ingreso", amount: 30000, sourceType: "direct_sale" },
      { type: "gasto", amount: 10000, sourceType: "manual" },
      { type: "gasto", amount: 2000, sourceType: "ajuste" }, // faltante en arqueo
    ]);
    expect(s).toEqual({ income: 30000, expense: 10000, adjustments: 498000, balanceChange: 518000 });
  });

  it("sin movimientos todo es cero", () => {
    expect(summarizeCashFlow([])).toEqual({ income: 0, expense: 0, adjustments: 0, balanceChange: 0 });
  });
});
