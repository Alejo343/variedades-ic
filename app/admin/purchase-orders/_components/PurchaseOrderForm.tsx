"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Distributor } from "@/lib/db/schema";

type SimpleProduct = { id: number; name: string; price: number };

type Item = {
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
};

type Props = {
  distributors: Distributor[];
  products: SimpleProduct[];
};

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n / 100);
}

export function PurchaseOrderForm({ distributors, products }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    distributorId: "" as string | number,
    expectedDate: "",
    notes: "",
  });
  const [items, setItems] = useState<Item[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemCost, setItemCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addItem() {
    if (!selectedProduct) return;
    const product = products.find((p) => p.id === Number(selectedProduct));
    if (!product) return;
    if (items.some((i) => i.productId === product.id)) {
      setError("Ese producto ya está en la lista");
      return;
    }
    setItems((prev) => [
      ...prev,
      { productId: product.id, productName: product.name, quantity: itemQty, unitCost: itemCost },
    ]);
    setSelectedProduct("");
    setItemQty(1);
    setItemCost(0);
    setError("");
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setError("Agrega al menos un producto al pedido");
      return;
    }
    setLoading(true);
    setError("");

    const orderRes = await fetch("/api/admin/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distributorId: form.distributorId ? Number(form.distributorId) : null,
        expectedDate: form.expectedDate || null,
        totalCost: total || null,
        notes: form.notes || undefined,
      }),
    });

    if (!orderRes.ok) {
      const data = await orderRes.json();
      setError(data.error?.formErrors?.[0] ?? "Error al crear el pedido");
      setLoading(false);
      return;
    }

    const order = await orderRes.json();

    for (const item of items) {
      await fetch("/api/admin/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addItem: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost || null,
          },
        }),
      });
    }

    setLoading(false);
    router.push("/admin/purchase-orders");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-700">Datos del pedido</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Distribuidor</label>
          <select
            value={form.distributorId}
            onChange={(e) => setForm((f) => ({ ...f, distributorId: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Sin distribuidor —</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}{d.city ? ` (${d.city})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha esperada de recogida
          </label>
          <input
            type="date"
            value={form.expectedDate}
            onChange={(e) => setForm((f) => ({ ...f, expectedDate: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-700">Productos</h2>

        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Seleccionar producto —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={itemQty}
            onChange={(e) => setItemQty(Number(e.target.value))}
            placeholder="Cantidad"
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            min={0}
            value={itemCost}
            onChange={(e) => setItemCost(Number(e.target.value))}
            placeholder="Costo unit. (centavos)"
            className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addItem}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Agregar
          </button>
        </div>

        {items.length > 0 && (
          <table className="w-full text-sm mt-1">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Producto</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Cant.</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Costo unit.</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Subtotal</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.productId}>
                  <td className="px-3 py-2 text-gray-800">{item.productName}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {item.unitCost ? formatCOP(item.unitCost) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {item.unitCost ? formatCOP(item.quantity * item.unitCost) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {total > 0 && (
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-700">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-800">
                    {formatCOP(total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Crear pedido"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/purchase-orders")}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
