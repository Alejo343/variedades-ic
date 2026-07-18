"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InventoryItem = { productId: number; productName: string | null; productPurchasePrice: number | null; quantity: number };

type LossType = "perdida" | "dano" | "robo";

type Row = { productId: number | ""; quantity: number; type: LossType; unitCost: number };

function emptyRow(): Row {
  return { productId: "", quantity: 1, type: "perdida", unitCost: 0 };
}

const TYPE_LABELS: Record<LossType, string> = {
  perdida: "Pérdida",
  dano: "Daño",
  robo: "Robo",
};

export function SellerLossForm({ sellerId, inventory }: { sellerId: number; inventory: InventoryItem[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function handleProductChange(idx: number, productId: number | "") {
    const item = inventory.find((i) => i.productId === productId);
    updateRow(idx, { productId, unitCost: item?.productPurchasePrice ?? 0 });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const items = rows
      .filter((r) => r.productId !== "")
      .map((r) => ({ productId: r.productId as number, quantity: r.quantity, type: r.type, unitCost: r.unitCost }));

    if (items.length === 0) {
      setLoading(false);
      setError("Agrega al menos un producto");
      return;
    }

    const res = await fetch("/api/admin/seller-losses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, items, notes }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(
        typeof data.error === "string" ? data.error : (data.error?.formErrors?.[0] ?? "Error al registrar"),
      );
      return;
    }

    router.push("/admin/seller-losses");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-6 max-w-3xl flex flex-col gap-4"
    >
      {inventory.length === 0 ? (
        <p className="text-sm text-gray-400">Este vendedor no tiene inventario asignado.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center">
              <select
                value={row.productId}
                onChange={(e) => handleProductChange(idx, e.target.value ? Number(e.target.value) : "")}
                required
                className="col-span-4 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Producto...</option>
                {inventory.map((i) => (
                  <option key={i.productId} value={i.productId}>
                    {i.productName ?? `#${i.productId}`} (disp. {i.quantity})
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
              <select
                value={row.type}
                onChange={(e) => updateRow(idx, { type: e.target.value as LossType })}
                className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(TYPE_LABELS) as LossType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={row.unitCost}
                onChange={(e) => updateRow(idx, { unitCost: Number(e.target.value) })}
                placeholder="Costo unit."
                className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

          <button
            type="button"
            onClick={addRow}
            className="self-start border border-gray-300 text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            + Agregar producto
          </button>
        </div>
      )}

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

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || inventory.length === 0}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Registrar"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/seller-losses")}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
