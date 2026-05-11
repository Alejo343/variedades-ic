"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
type Product = { id: number; name: string; price: number; active: boolean };

type Item = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
};

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n / 100);
}

export function SalesOrderForm({ products }: { products: Product[] }) {
  const router = useRouter();

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    deliveryNote: "",
    notes: "",
  });
  const [items, setItems] = useState<Item[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [itemQty, setItemQty] = useState(1);
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
      { productId: product.id, productName: product.name, quantity: itemQty, unitPrice: product.price },
    ]);
    setSelectedProduct("");
    setItemQty(1);
    setError("");
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
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

    for (const item of items) {
      await fetch("/api/admin/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addItem: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          },
        }),
      });
    }

    setLoading(false);
    router.push("/admin/sales-orders");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-700">Datos del cliente</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
            <input
              value={form.customerPhone}
              onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección / nota de entrega
          </label>
          <textarea
            value={form.deliveryNote}
            onChange={(e) => setForm((f) => ({ ...f, deliveryNote: e.target.value }))}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
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
            {products
              .filter((p) => p.active)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCOP(p.price)}
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
                <th className="text-right px-3 py-2 font-medium text-gray-600">Precio unit.</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Subtotal</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.productId}>
                  <td className="px-3 py-2 text-gray-800">{item.productName}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatCOP(item.unitPrice)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {formatCOP(item.quantity * item.unitPrice)}
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
          {loading ? "Guardando..." : "Registrar pedido"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/sales-orders")}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
