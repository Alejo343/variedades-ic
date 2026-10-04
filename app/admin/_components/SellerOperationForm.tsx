"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CartLines, PosLayout, ProductSearch, addToCart, cartTotal, cartUnits, type CartLine, type CartProduct } from "./Cart";
import { formatCOP } from "../_lib/format";

type InventoryItem = {
  productId: number;
  productName: string | null;
  productPrice: number | null;
  productPurchasePrice: number | null;
  quantity: number;
};

type LossType = "perdida" | "dano" | "robo";
export type SellerOperationMode = "sale" | "return" | "loss";

const MODE: Record<
  SellerOperationMode,
  { endpoint: string; redirect: string; valueLabel: string | null; submit: string; ticket: string; error: string }
> = {
  sale: {
    endpoint: "/api/admin/seller-sales",
    redirect: "/admin/seller-sales",
    valueLabel: "Precio",
    submit: "Registrar venta",
    ticket: "Venta",
    error: "Error al registrar la venta",
  },
  return: {
    endpoint: "/api/admin/seller-returns",
    redirect: "/admin/seller-returns",
    valueLabel: null,
    submit: "Registrar devolución",
    ticket: "Devolución",
    error: "Error al registrar la devolución",
  },
  loss: {
    endpoint: "/api/admin/seller-losses",
    redirect: "/admin/seller-losses",
    valueLabel: "Costo",
    submit: "Registrar",
    ticket: "Reporte",
    error: "Error al registrar",
  },
};

const LOSS_TYPES: [LossType, string][] = [
  ["perdida", "Pérdida"],
  ["dano", "Daño"],
  ["robo", "Robo"],
];

/**
 * Venta, devolución o pérdida de un vendedor: the product list is limited to
 * what the seller currently holds (quantities capped at their balance; the
 * server re-validates). A sale is valued at sale price, a loss at cost, a
 * return carries no money.
 */
export function SellerOperationForm({
  mode,
  sellerId,
  inventory,
}: {
  mode: SellerOperationMode;
  sellerId: number;
  inventory: InventoryItem[];
}) {
  const router = useRouter();
  const cfg = MODE[mode];
  const [lines, setLines] = useState<CartLine[]>([]);
  const [lossType, setLossType] = useState<LossType>("perdida");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const products: CartProduct[] = inventory.map((i) => ({
    id: i.productId,
    name: i.productName ?? `#${i.productId}`,
    unitValue: mode === "loss" ? (i.productPurchasePrice ?? 0) : (i.productPrice ?? 0),
    available: i.quantity,
  }));

  const total = cartTotal(lines);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (lines.length === 0) return setError("Agrega al menos un producto");

    const items = lines.map((l) =>
      mode === "sale"
        ? { productId: l.productId, quantity: l.quantity, unitPrice: l.unitValue }
        : mode === "loss"
          ? { productId: l.productId, quantity: l.quantity, unitCost: l.unitValue }
          : { productId: l.productId, quantity: l.quantity },
    );
    const body = mode === "loss" ? { sellerId, type: lossType, items, notes } : { sellerId, items, notes };

    setLoading(true);
    const res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : (data.error?.formErrors?.[0] ?? cfg.error));
      return;
    }

    router.push(cfg.redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <PosLayout
        finder={
          <ProductSearch
            products={products}
            lines={lines}
            onPick={(p) => setLines((ls) => addToCart(ls, p))}
            valueLabel={cfg.valueLabel}
            emptyText="Este vendedor no tiene inventario asignado."
          />
        }
        ticket={
          <>
            <div className="adm-card-head">
              <div>
                <h2 className="adm-card-title">{cfg.ticket}</h2>
                <p className="adm-card-desc">
                  {lines.length} productos · {cartUnits(lines)} unidades
                </p>
              </div>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {mode === "loss" && (
                <div>
                  <label className="adm-label">Tipo</label>
                  <div className="adm-seg w-full [&>*]:flex-1 [&>*]:justify-center">
                    {LOSS_TYPES.map(([value, label]) => (
                      <button key={value} type="button" data-active={lossType === value} onClick={() => setLossType(value)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <CartLines products={products} lines={lines} onChange={setLines} valueLabel={cfg.valueLabel} />
              <div className="pt-4 border-t border-[var(--adm-line)]">
                <label className="adm-label">Notas</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="adm-input" />
              </div>
              {mode === "loss" && (
                <p className="adm-alert adm-alert-warn">El costo lo asume el vendedor: se suma a lo que debe entregar en su liquidación.</p>
              )}
              {mode === "return" && (
                <p className="adm-alert adm-alert-info">Las unidades devueltas vuelven al inventario principal.</p>
              )}
              {error && <p className="adm-alert adm-alert-danger">{error}</p>}
            </div>
            <div className="mt-auto p-5 border-t border-[var(--adm-line)] bg-[var(--adm-surface-2)] rounded-b-[14px]">
              {cfg.valueLabel && (
                <div className="flex items-end justify-between mb-4">
                  <span className="adm-eyebrow">{mode === "sale" ? "Total vendido" : "Costo total"}</span>
                  <span className="num text-[28px] font-semibold leading-none">{formatCOP(total)}</span>
                </div>
              )}
              <button type="submit" disabled={loading || lines.length === 0} className="adm-btn adm-btn-primary adm-btn-lg w-full">
                {loading ? "Guardando…" : cfg.submit}
              </button>
            </div>
          </>
        }
      />
    </form>
  );
}
