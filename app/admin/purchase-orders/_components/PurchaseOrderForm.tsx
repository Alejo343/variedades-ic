"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";
import type { Distributor } from "@/lib/db/schema";
import { parseImportSheet, resolveImportRows } from "@/lib/domain/purchase-import";
import { CartLines, PosLayout, ProductSearch, addToCart, cartTotal, cartUnits, type CartLine, type CartProduct } from "../../_components/Cart";
import { formatCOP } from "../../_lib/format";

type SimpleProduct = {
  id: number;
  name: string;
  price: number;
  purchasePrice: number | null;
  sku: string;
  slug: string;
  active: boolean;
  imageUrl: string | null;
};

type Props = {
  distributors: Distributor[];
  products: SimpleProduct[];
};

export function PurchaseOrderForm({ distributors, products: allProducts }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    distributorId: "" as string | number,
    purchaseType: "contado" as "contado" | "credito",
    expectedDate: "",
    notes: "",
  });
  const [lines, setLines] = useState<CartLine[]>([]);
  // Products created on the fly by the Excel import (not in the server-provided list yet).
  const [createdProducts, setCreatedProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState("");
  const [importSkipped, setImportSkipped] = useState<{ rowNumber: number; reason: string }[]>([]);

  const cartProducts: CartProduct[] = [
    ...allProducts
      .filter((p) => p.active)
      .map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitValue: p.purchasePrice ?? 0, imageUrl: p.imageUrl })),
    ...createdProducts,
  ];

  function mergeLine(line: CartLine) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === line.productId);
      if (existing) {
        return prev.map((l) => (l.productId === line.productId ? { ...l, quantity: l.quantity + line.quantity } : l));
      }
      return [...prev, line];
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
          mergeLine({ productId: row.productId, quantity: row.quantity, unitValue: row.unitCost });
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
          setCreatedProducts((prev) => [...prev, { id: product.id, name: row.name, sku: product.sku, unitValue: row.unitCost }]);
          mergeLine({ productId: product.id, quantity: row.quantity, unitValue: row.unitCost });
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

  const total = cartTotal(lines);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
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
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitValue })),
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
    <form onSubmit={handleSubmit}>
      <PosLayout
        finder={
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="adm-card-title mb-3">Datos del pedido</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="adm-label">Distribuidor</label>
                  <select
                    value={form.distributorId}
                    onChange={(e) => setForm((f) => ({ ...f, distributorId: e.target.value }))}
                    className="adm-input"
                  >
                    <option value="">— Sin distribuidor —</option>
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                        {d.city ? ` (${d.city})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="adm-label">Tipo de compra</label>
                  <div className="adm-seg w-full [&>*]:flex-1 [&>*]:justify-center">
                    <button
                      type="button"
                      data-active={form.purchaseType === "contado"}
                      onClick={() => setForm((f) => ({ ...f, purchaseType: "contado" }))}
                    >
                      Contado
                    </button>
                    <button
                      type="button"
                      data-active={form.purchaseType === "credito"}
                      onClick={() => setForm((f) => ({ ...f, purchaseType: "credito" }))}
                    >
                      Crédito
                    </button>
                  </div>
                </div>
                <div>
                  <label className="adm-label">Fecha esperada de recogida</label>
                  <input
                    type="date"
                    value={form.expectedDate}
                    onChange={(e) => setForm((f) => ({ ...f, expectedDate: e.target.value }))}
                    className="adm-input"
                  />
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-[var(--adm-line)]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="adm-card-title">Productos</h2>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={importing} className="adm-btn adm-btn-sm">
                  <FileSpreadsheet />
                  {importing ? "Importando…" : "Importar desde Excel"}
                </button>
              </div>

              {importSummary && <p className="adm-alert adm-alert-ok mb-3">{importSummary}</p>}
              {importSkipped.length > 0 && (
                <div className="adm-alert adm-alert-warn mb-3 flex-col !gap-1">
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

              <ProductSearch products={cartProducts} lines={lines} onPick={(p) => setLines((ls) => addToCart(ls, p))} valueLabel="Costo" />
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
              {lines.length > 0 && (
                <button type="button" onClick={() => setLines([])} className="adm-btn adm-btn-ghost adm-btn-sm">
                  Vaciar
                </button>
              )}
            </div>
            <div className="p-5 flex flex-col gap-4">
              <CartLines products={cartProducts} lines={lines} onChange={setLines} valueLabel="Costo unitario" />
              <div className="pt-4 border-t border-[var(--adm-line)]">
                <label className="adm-label">Notas</label>
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
                <span className="adm-eyebrow">Total del pedido</span>
                <span className="num text-[28px] font-semibold leading-none">{formatCOP(total)}</span>
              </div>
              <button type="submit" disabled={loading} className="adm-btn adm-btn-primary adm-btn-lg w-full">
                {loading ? "Guardando…" : "Crear pedido"}
              </button>
            </div>
          </>
        }
      />
    </form>
  );
}
