"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import type { Distributor } from "@/lib/db/schema";
import { parseImportSheet, resolveImportRows } from "@/lib/domain/purchase-import";

type SimpleProduct = { id: number; name: string; price: number; sku: string; slug: string; active: boolean };

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
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export function PurchaseOrderForm({ distributors, products: allProducts }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const activeProducts = allProducts.filter((p) => p.active);

  const [form, setForm] = useState({
    distributorId: "" as string | number,
    purchaseType: "contado" as "contado" | "credito",
    expectedDate: "",
    notes: "",
  });
  const [items, setItems] = useState<Item[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemCost, setItemCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState("");
  const [importSkipped, setImportSkipped] = useState<{ rowNumber: number; reason: string }[]>([]);

  function addItem() {
    if (!selectedProduct) return;
    const product = activeProducts.find((p) => p.id === Number(selectedProduct));
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

  function mergeItem(item: Item) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i,
        );
      }
      return [...prev, item];
    });
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError("");
    setImportSummary("");
    setImportSkipped([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const { rows, skipped } = parseImportSheet(sheetRows);
      const resolved = resolveImportRows(
        rows,
        allProducts.map((p) => ({ id: p.id, name: p.name, sku: p.sku, slug: p.slug })),
      );

      let created = 0;
      for (const row of resolved) {
        if (row.kind === "existing") {
          mergeItem({ productId: row.productId, productName: row.name, quantity: row.quantity, unitCost: row.unitCost });
        } else {
          const res = await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: row.name, slug: row.slug, price: row.unitCost, purchasePrice: row.unitCost }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error?.formErrors?.[0] ?? `Error al crear el producto "${row.name}"`);
          }
          const product = await res.json();
          created += 1;
          mergeItem({ productId: product.id, productName: row.name, quantity: row.quantity, unitCost: row.unitCost });
        }
      }

      setImportSummary(`${resolved.length} filas importadas, ${created} producto(s) nuevo(s) creado(s).`);
      setImportSkipped(skipped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar el archivo");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
        purchaseType: form.purchaseType,
        expectedDate: form.expectedDate || null,
        notes: form.notes || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })),
      }),
    });

    setLoading(false);

    if (!orderRes.ok) {
      const data = await orderRes.json();
      setError(data.error?.formErrors?.[0] ?? "Error al crear el pedido");
      return;
    }

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de compra</label>
          <select
            value={form.purchaseType}
            onChange={(e) =>
              setForm((f) => ({ ...f, purchaseType: e.target.value as "contado" | "credito" }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="contado">Contado</option>
            <option value="credito">Crédito</option>
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
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Productos</h2>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="border border-gray-300 text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
            >
              {importing ? "Importando..." : "Importar desde Excel"}
            </button>
          </div>
        </div>

        {importSummary && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{importSummary}</p>}
        {importSkipped.length > 0 && (
          <div className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            <p className="font-medium">{importSkipped.length} fila(s) omitida(s):</p>
            <ul className="list-disc list-inside">
              {importSkipped.map((s) => (
                <li key={s.rowNumber}>
                  Fila {s.rowNumber}: {s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Seleccionar producto —</option>
            {activeProducts.map((p) => (
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
            placeholder="Costo unit. (COP)"
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
