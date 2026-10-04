"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CartLines, PosLayout, ProductSearch, addToCart, cartTotal, cartUnits, type CartLine, type CartProduct } from "../../_components/Cart";
import { formatCOP } from "../../_lib/format";

type Account = { id: number; name: string };

export function DirectSaleForm({ products, accounts }: { products: CartProduct[]; accounts: Account[] }) {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [accountId, setAccountId] = useState<number | "">(accounts.length === 1 ? accounts[0].id : "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = cartTotal(lines);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (lines.length === 0) return setError("Agrega al menos un producto");
    if (accountId === "") return setError("Selecciona la cuenta donde entra el dinero");

    setLoading(true);
    const items = lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitValue }));
    const res = await fetch("/api/admin/direct-sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, accountId, notes }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : (data.error?.formErrors?.[0] ?? "Error al registrar la venta"));
      return;
    }

    router.push("/admin/direct-sales");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <PosLayout
        finder={
          <ProductSearch products={products} lines={lines} onPick={(p) => setLines((ls) => addToCart(ls, p))} emptyText="No hay productos activos." />
        }
        ticket={
          <>
            <div className="adm-card-head">
              <div>
                <h2 className="adm-card-title">Ticket</h2>
                <p className="adm-card-desc">
                  {lines.length} productos · {cartUnits(lines)} unidades
                </p>
              </div>
              {lines.length > 0 && (
                <button type="button" onClick={() => setLines([])} className="adm-btn adm-btn-ghost adm-btn-sm">
                  Vaciar
                </button>
              )}
            </div>
            <div className="p-5 flex flex-col gap-4">
              <CartLines products={products} lines={lines} onChange={setLines} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[var(--adm-line)]">
                <div>
                  <label className="adm-label">Cuenta</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : "")}
                    required
                    className="adm-input"
                  >
                    <option value="">Selecciona…</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="adm-label">Notas</label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="adm-input" />
                </div>
              </div>

              {error && <p className="adm-alert adm-alert-danger">{error}</p>}
            </div>
            <div className="mt-auto p-5 border-t border-[var(--adm-line)] bg-[var(--adm-surface-2)] rounded-b-[14px]">
              <div className="flex items-end justify-between mb-4">
                <span className="adm-eyebrow">Total a cobrar</span>
                <span className="num text-[30px] font-semibold leading-none">{formatCOP(total)}</span>
              </div>
              <button type="submit" disabled={loading || lines.length === 0} className="adm-btn adm-btn-brand adm-btn-lg w-full">
                {loading ? "Cobrando…" : `Cobrar ${formatCOP(total)}`}
              </button>
            </div>
          </>
        }
      />
    </form>
  );
}
