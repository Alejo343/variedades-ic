import Link from "next/link";
import { AlertTriangle, Boxes, CircleDollarSign, PackageX, Tag } from "lucide-react";
import { getAllProducts } from "@/lib/db/queries/products";
import { getLowStock, getNegativeStock, getOutOfStock, getRecentMovements } from "@/lib/db/queries/inventory";
import { getInventorySummary } from "@/lib/db/queries/reports";
import { AdjustmentForm } from "./_components/AdjustmentForm";
import { Badge, Card, FilterTabs, Page, PageHeader, Stat } from "../_components/ui";
import { MOVEMENT_LABELS, formatCOP, formatDateTime, formatNumber } from "../_lib/format";

const TYPE_FILTERS = [
  ["compra", "Compras"],
  ["venta", "Ventas"],
  ["entrega_vendedor", "Entregas"],
  ["devolucion", "Devoluciones"],
  ["ajuste", "Ajustes"],
] as const;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "" } = await searchParams;
  const [lowStock, outOfStock, negativeStock, movements, products, summary] = await Promise.all([
    getLowStock(),
    getOutOfStock(),
    getNegativeStock(),
    getRecentMovements(100),
    getAllProducts(),
    getInventorySummary(),
  ]);

  const activeProducts = products.filter((p) => p.active);
  const valueAtPrice = activeProducts.reduce((s, p) => s + Math.max(p.stock, 0) * p.price, 0);
  const rows = type ? movements.filter((m) => m.type === type) : movements;

  return (
    <Page>
      <PageHeader
        eyebrow="Catálogo"
        title="Inventario"
        description="Existencias del inventario principal y el historial de cada movimiento de stock."
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Unidades en bodega" value={formatNumber(summary.totalUnits)} hint={`${summary.activeProducts} productos activos`} icon={Boxes} tone="info" />
        <Stat label="Valor a costo" value={formatCOP(summary.totalValue)} icon={CircleDollarSign} tone="violet" />
        <Stat label="Valor a precio de venta" value={formatCOP(valueAtPrice)} hint={`Margen potencial ${formatCOP(valueAtPrice - summary.totalValue)}`} icon={Tag} tone="ok" />
        <Stat
          label="Requieren atención"
          value={lowStock.length + outOfStock.length + negativeStock.length}
          valueTone={lowStock.length + outOfStock.length + negativeStock.length > 0 ? "warn" : "neutral"}
          hint={`${outOfStock.length} agotados · ${lowStock.length} bajo mínimo`}
          icon={AlertTriangle}
          tone="warn"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          {negativeStock.length > 0 && (
            <div className="adm-alert adm-alert-danger">
              <AlertTriangle />
              <div>
                <p className="font-semibold">Stock negativo en {negativeStock.length} productos</p>
                <p className="mt-0.5">
                  Llegaron ventas del móvil que superaron las existencias. Haz un conteo y corrígelo con un ajuste:{" "}
                  {negativeStock.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 && ", "}
                      <strong>{p.name}</strong> ({p.stock})
                    </span>
                  ))}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Bajo el mínimo" description={`${lowStock.length} productos`} flush>
              {lowStock.length === 0 ? (
                <p className="px-5 py-6 text-sm text-[var(--adm-ink-3)]">Sin alertas.</p>
              ) : (
                <ul className="divide-y divide-[#f0ede6] max-h-64 overflow-y-auto">
                  {lowStock.map((p) => (
                    <li key={p.id}>
                      <Link href={`/admin/products/${p.id}/edit`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--adm-surface-2)]">
                        <AlertTriangle size={15} className="text-[var(--adm-warn)] shrink-0" />
                        <span className="flex-1 text-[13.5px] truncate">{p.name}</span>
                        <span className="num text-[13px] font-semibold text-[var(--adm-warn)]">{p.stock}</span>
                        <span className="num text-[12px] text-[var(--adm-ink-3)]">/ {p.minStock}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Agotados" description={`${outOfStock.length} productos`} flush>
              {outOfStock.length === 0 ? (
                <p className="px-5 py-6 text-sm text-[var(--adm-ink-3)]">Sin productos agotados.</p>
              ) : (
                <ul className="divide-y divide-[#f0ede6] max-h-64 overflow-y-auto">
                  {outOfStock.map((p) => (
                    <li key={p.id}>
                      <Link href={`/admin/products/${p.id}/edit`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--adm-surface-2)]">
                        <PackageX size={15} className="text-[var(--adm-danger)] shrink-0" />
                        <span className="flex-1 text-[13.5px] truncate">{p.name}</span>
                        <Badge tone="danger" plain>
                          0
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card title="Historial de movimientos" description="Últimos 100 movimientos del ledger (inventario principal y de vendedores)" flush>
            <div className="p-4 border-b border-[var(--adm-line)]">
              <FilterTabs
                basePath="/admin/inventory"
                param="type"
                current={type}
                options={[{ value: "", label: "Todos" }, ...TYPE_FILTERS.map(([value, label]) => ({ value, label }))]}
              />
            </div>
            {rows.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[var(--adm-ink-3)]">Sin movimientos.</p>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Tipo</th>
                      <th>Inventario</th>
                      <th className="t-right">Cantidad</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((m) => (
                      <tr key={m.id}>
                        <td className="whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                        <td className="t-strong min-w-[200px]">{m.productName ?? `#${m.productId}`}</td>
                        <td>{MOVEMENT_LABELS[m.type] ?? m.type}</td>
                        <td>
                          <Badge plain tone={m.ownerType === "seller" ? "violet" : "neutral"}>
                            {m.ownerType === "seller" ? "Vendedor" : "Principal"}
                          </Badge>
                        </td>
                        <td
                          className={`t-right num font-semibold ${
                            m.quantityDelta > 0 ? "text-[var(--adm-ok)]" : "text-[var(--adm-danger)]"
                          }`}
                        >
                          {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                        </td>
                        <td className="max-w-[240px] truncate">{m.reason ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="xl:sticky xl:top-24">
          <AdjustmentForm products={activeProducts.map((p) => ({ id: p.id, name: p.name }))} />
        </div>
      </div>
    </Page>
  );
}
