"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  products: { id: number; name: string }[];
};

export function AdjustmentForm({ products }: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState<number | "">("");
  const [quantityDelta, setQuantityDelta] = useState(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/inventory/adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantityDelta, reason }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(
        typeof data.error === "string"
          ? data.error
          : (data.error?.formErrors?.[0] ?? "Error al registrar el ajuste"),
      );
      return;
    }

    setProductId("");
    setQuantityDelta(0);
    setReason("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3"
    >
      <h2 className="text-sm font-semibold text-gray-700">Ajuste manual de inventario</h2>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
          required
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          value={quantityDelta}
          onChange={(e) => setQuantityDelta(Number(e.target.value))}
          placeholder="Cantidad (+/-)"
          required
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo"
          required
          className="sm:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Registrar ajuste"}
        </button>
      </div>
    </form>
  );
}
