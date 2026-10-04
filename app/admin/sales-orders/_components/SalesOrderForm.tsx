"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CartLines, PosLayout, ProductSearch, addToCart, cartTotal, cartUnits, type CartLine, type CartProduct } from "../../_components/Cart";
import { formatCOP } from "../../_lib/format";

// Stock is not capped here: a WhatsApp order is only a request. Stock is
// checked (and deducted) when the order is confirmed.
export function SalesOrderForm({ products }: { products: CartProduct[] }) {
  const router = useRouter();

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    deliveryNote: "",
    notes: "",
  });
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = cartTotal(lines);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      setError("Agrega al menos un producto al pedido");
      return;
    }
    setLoading(true);
    setError("");

    const orderRes = await fetch("/api/admin/sales-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        deliveryNote: form.deliveryNote || undefined,
        notes: form.notes || undefined,
        totalPrice: total || null,
      }),
    });

    if (!orderRes.ok) {
      const data = await orderRes.json();
      setError(data.error?.formErrors?.[0] ?? "Error al crear el pedido");
      setLoading(false);
      return;
    }

    const order = await orderRes.json();

    for (const line of lines) {
      await fetch("/api/admin/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addItem: {
            orderId: order.id,
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitValue,
          },
        }),
      });
    }

    setLoading(false);
    router.push("/admin/sales-orders");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <PosLayout
        finder={
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="adm-card-title mb-3">Cliente</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="adm-label">Nombre</label>
                  <input
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    required
                    className="adm-input"
                  />
                </div>
                <div>
                  <label className="adm-label">Teléfono</label>
                  <input
                    value={form.customerPhone}
                    onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                    required
                    inputMode="tel"
                    className="adm-input num"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="adm-label">Dirección / nota de entrega</label>
                  <input
                    value={form.deliveryNote}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryNote: e.target.value }))}
                    className="adm-input"
                  />
                </div>
              </div>
            </div>
            <div className="pt-5 border-t border-[var(--adm-line)]">
              <h2 className="adm-card-title mb-3">Productos</h2>
              <ProductSearch products={products} lines={lines} onPick={(p) => setLines((ls) => addToCart(ls, p))} />
            </div>
          </div>
        }
        ticket={
          <>
            <div className="adm-card-head">
              <div>
                <h2 className="adm-card-title">Pedido</h2>
                <p className="adm-card-desc">
                  {lines.length} productos · {cartUnits(lines)} unidades
                </p>
              </div>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <CartLines products={products} lines={lines} onChange={setLines} />
              <div className="pt-4 border-t border-[var(--adm-line)]">
                <label className="adm-label">Notas internas</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="adm-input"
                />
              </div>
              {error && <p className="adm-alert adm-alert-danger">{error}</p>}
            </div>
            <div className="mt-auto p-5 border-t border-[var(--adm-line)] bg-[var(--adm-surface-2)] rounded-b-[14px]">
              <div className="flex items-end justify-between mb-4">
                <span className="adm-eyebrow">Total</span>
                <span className="num text-[28px] font-semibold leading-none">{formatCOP(total)}</span>
              </div>
              <button type="submit" disabled={loading} className="adm-btn adm-btn-primary adm-btn-lg w-full">
                {loading ? "Guardando…" : "Registrar pedido"}
              </button>
            </div>
          </>
        }
      />
    </form>
  );
}
