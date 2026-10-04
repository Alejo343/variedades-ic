"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageOff, Package, Search, Star } from "lucide-react";
import { Badge, EmptyState } from "../../_components/ui";
import { formatCOP } from "../../_lib/format";

type Row = {
  id: number;
  name: string;
  sku: string;
  price: number;
  purchasePrice: number | null;
  stock: number;
  minStock: number;
  featured: boolean;
  active: boolean;
  categoryName: string | null;
  categoryColor: string | null;
  imageUrl: string | null;
};

type Filter = "all" | "active" | "low" | "out" | "inactive";

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function stockState(p: Row): "out" | "low" | "ok" {
  if (p.stock <= 0) return "out";
  if (p.minStock > 0 && p.stock <= p.minStock) return "low";
  return "ok";
}

export function ProductsTable({ products }: { products: Row[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.categoryName).filter((c): c is string => !!c))].sort(),
    [products],
  );

  const counts = useMemo(
    () => ({
      all: products.length,
      active: products.filter((p) => p.active).length,
      low: products.filter((p) => p.active && stockState(p) === "low").length,
      out: products.filter((p) => p.active && stockState(p) === "out").length,
      inactive: products.filter((p) => !p.active).length,
    }),
    [products],
  );

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return products.filter((p) => {
      if (filter === "active" && !p.active) return false;
      if (filter === "inactive" && p.active) return false;
      if (filter === "low" && !(p.active && stockState(p) === "low")) return false;
      if (filter === "out" && !(p.active && stockState(p) === "out")) return false;
      if (category && p.categoryName !== category) return false;
      if (q && !normalize(`${p.name} ${p.sku}`).includes(q)) return false;
      return true;
    });
  }, [products, query, category, filter]);

  const tabs: [Filter, string][] = [
    ["active", "Activos"],
    ["low", "Stock bajo"],
    ["out", "Agotados"],
    ["inactive", "Inactivos"],
    ["all", "Todos"],
  ];

  return (
    <div className="adm-card overflow-hidden">
      <div className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[var(--adm-line)]">
        <div className="adm-seg">
          {tabs.map(([key, label]) => (
            <button key={key} data-active={filter === key} onClick={() => setFilter(key)}>
              {label}
              <span className="num text-[11px] text-[var(--adm-ink-3)]">{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--adm-ink-3)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o SKU…"
              className="adm-input pl-9"
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="adm-input w-44">
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Package}
          title={products.length === 0 ? "Aún no hay productos" : "Sin resultados"}
          description={
            products.length === 0
              ? "Crea tu primer producto o impórtalos desde un pedido de compra en Excel."
              : "Prueba con otra búsqueda o cambia los filtros."
          }
          action={
            products.length === 0 ? (
              <Link href="/admin/products/new" className="adm-btn adm-btn-primary">
                Nuevo producto
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="t-right">Costo</th>
                <th className="t-right">Precio</th>
                <th className="t-right">Margen</th>
                <th className="t-right">Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const state = stockState(p);
                const margin =
                  p.purchasePrice && p.price > 0 ? Math.round(((p.price - p.purchasePrice) / p.price) * 100) : null;
                return (
                  <tr key={p.id} className="cursor-pointer" onClick={() => router.push(`/admin/products/${p.id}/edit`)}>
                    <td>
                      <div className="flex items-center gap-3 min-w-[240px]">
                        <span className="w-10 h-10 rounded-lg bg-[#f0ede6] overflow-hidden grid place-items-center shrink-0 border border-[var(--adm-line)]">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <ImageOff size={15} className="text-[var(--adm-ink-3)]" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="t-strong hover:underline underline-offset-4 inline-flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {p.name}
                            {p.featured && <Star size={13} className="text-amber-500 fill-amber-400" aria-label="Destacado" />}
                          </Link>
                          <p className="num text-[12px] text-[var(--adm-ink-3)]">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.categoryName ? (
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span className="w-2 h-2 rounded-full" style={{ background: p.categoryColor ?? "#a8a39a" }} />
                          {p.categoryName}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="t-right num">{p.purchasePrice ? formatCOP(p.purchasePrice) : "—"}</td>
                    <td className="t-right num t-strong">{formatCOP(p.price)}</td>
                    <td className="t-right num">
                      {margin === null ? "—" : <span className={margin < 0 ? "text-[var(--adm-danger)]" : ""}>{margin}%</span>}
                    </td>
                    <td className="t-right">
                      <span
                        className={`num font-semibold ${
                          state === "out"
                            ? "text-[var(--adm-danger)]"
                            : state === "low"
                              ? "text-[var(--adm-warn)]"
                              : "text-[var(--adm-ink)]"
                        }`}
                      >
                        {p.stock}
                      </span>
                      {p.minStock > 0 && <span className="num text-[11.5px] text-[var(--adm-ink-3)]"> / {p.minStock}</span>}
                    </td>
                    <td>
                      {!p.active ? (
                        <Badge>Inactivo</Badge>
                      ) : state === "out" ? (
                        <Badge tone="danger">{p.stock < 0 ? "Negativo" : "Agotado"}</Badge>
                      ) : state === "low" ? (
                        <Badge tone="warn">Stock bajo</Badge>
                      ) : (
                        <Badge tone="ok">Activo</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 0 && (
        <div className="px-4 py-3 border-t border-[var(--adm-line)] text-[12.5px] text-[var(--adm-ink-3)]">
          Mostrando {rows.length} de {products.length} productos
        </div>
      )}
    </div>
  );
}
