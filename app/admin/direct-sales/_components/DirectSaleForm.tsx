"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = { id: number; name: string; price: number };
type Account = { id: number; name: string };

type Row = { productId: number | ""; quantity: number; unitPrice: number };

function emptyRow(): Row {
  return { productId: "", quantity: 1, unitPrice: 0 };
}

export function DirectSaleForm({ products, accounts }: { products: Product[]; accounts: Account[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [accountId, setAccountId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function handleProductChange(idx: number, productId: number | "") {
    const product = products.find((p) => p.id === productId);
    updateRow(idx, { productId, unitPrice: product?.price ?? 0 });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = rows.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const items = rows
      .filter((r) => r.productId !== "")
      .map((r) => ({ productId: r.productId as number, quantity: r.quantity, unitPrice: r.unitPrice }));

    if (items.length === 0) {
      setLoading(false);
      setError("Agrega al menos un producto");
      return;
    }

    if (accountId === "") {
      setLoading(false);
      setError("Selecciona la cuenta");
      return;
    }

    const res = await fetch("/api/admin/direct-sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, accountId, notes }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(
        typeof data.error === "string" ? data.error : (data.error?.formErrors?.[0] ?? "Error al registrar la venta"),
      );
      return;
    }

    router.push("/admin/direct-sales");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-6 max-w-3xl flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-3 items-center">
            <select
              value={row.productId}
              onChange={(e) => handleProductChange(idx, e.target.value ? Number(e.target.value) : "")}
              required
              className="col-span-5 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={row.quantity}
              onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) })}
              placeholder="Cant."
              required
              className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              min={0}
              value={row.unitPrice}
              onChange={(e) => updateRow(idx, { unitPrice: Number(e.target.value) })}
              placeholder="Precio"
              required
              className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="col-span-1 text-sm text-gray-600 text-right">
              {(row.quantity * row.unitPrice).toLocaleString("es-CO")}
            </span>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              disabled={rows.length === 1}
              className="col-span-1 text-red-500 hover:text-red-700 text-sm disabled:opacity-30"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="self-start border border-gray-300 text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
      >
        + Agregar producto
      </button>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : "")}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecciona...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas <span className="font-normal text-gray-400">(opcional)</span>
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-lg font-bold text-gray-800">
          Total: {total.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })}
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/direct-sales")}
            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-6 py-2 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Cobrando..." : "Cobrar"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
