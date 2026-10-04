"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CartLines, PosLayout, ProductSearch, addToCart, cartTotal, cartUnits, type CartLine, type CartProduct } from "../../_components/Cart";
import { formatCOP } from "../../_lib/format";

type Seller = { id: number; name: string };

export function DeliveryForm({
  sellers,
  products,
  initialSellerId,
}: {
  sellers: Seller[];
  products: CartProduct[];
  initialSellerId?: number;
}) {
  const router = useRouter();
  const [sellerId, setSellerId] = useState<number | "">(initialSellerId ?? "");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!sellerId || lines.length === 0) return setError("Selecciona un vendedor y al menos un producto");

    setLoading(true);
    const items = lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitValue }));
    const res = await fetch("/api/admin/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, items, notes }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : (data.error?.formErrors?.[0] ?? "Error al registrar la entrega"));
      return;
    }

    router.push("/admin/deliveries");
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
            valueLabel="Costo"
            emptyText="No hay productos activos."
          />
        }
        ticket={
          <>
            <div className="adm-card-head">
              <div>
                <h2 className="adm-card-title">Entrega</h2>
                <p className="adm-card-desc">
                  {lines.length} productos · {cartUnits(lines)} unidades
                </p>
              </div>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="adm-label">Vendedor</label>
                <select
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value ? Number(e.target.value) : "")}
                  required
                  className="adm-input"
                >
                  <option value="">Selecciona un vendedor…</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <CartLines products={products} lines={lines} onChange={setLines} valueLabel="Costo unitario" />
              <div className="pt-4 border-t border-[var(--adm-line)]">
                <label className="adm-label">Notas</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="adm-input" />
              </div>
              {error && <p className="adm-alert adm-alert-danger">{error}</p>}
            </div>
            <div className="mt-auto p-5 border-t border-[var(--adm-line)] bg-[var(--adm-surface-2)] rounded-b-[14px]">
              <div className="flex items-end justify-between mb-4">
                <span className="adm-eyebrow">Valor a costo</span>
                <span className="num text-[28px] font-semibold leading-none">{formatCOP(cartTotal(lines))}</span>
              </div>
              <button type="submit" disabled={loading || lines.length === 0} className="adm-btn adm-btn-primary adm-btn-lg w-full">
                {loading ? "Guardando…" : "Registrar entrega"}
              </button>
            </div>
          </>
        }
      />
    </form>
  );
}
