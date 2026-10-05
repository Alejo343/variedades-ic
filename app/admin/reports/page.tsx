import { getInventorySummary, getPurchasesReport, getSalesReport, getProfitReport, getDailySales } from "@/lib/db/queries/reports";
import { getLowStock, getOutOfStock } from "@/lib/db/queries/inventory";
import { getAllCashMovements, getCashBalance } from "@/lib/db/queries/cash";
import { getAllSellersInventory } from "@/lib/db/queries/seller-inventory";
import { getSellerSalesSummary } from "@/lib/db/queries/seller-sales";
import { getReturnedProductsSummary } from "@/lib/db/queries/seller-returns";
import { getAccountsPayableSummary } from "@/lib/db/queries/purchase-payments";
import { getAllDistributors } from "@/lib/db/queries/distributors";
import { CircleDollarSign, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { summarizeCashFlow } from "@/lib/domain/cash";
import { DateRangeFilter } from "./_components/DateRangeFilter";
import { SalesChart } from "../_components/SalesChart";
import { Card, Page, PageHeader, Stat } from "../_components/ui";
import { formatCOP, formatNumber, formatPlainDate, todayInBogota } from "../_lib/format";

const MAX_CHART_DAYS = 62;

function daysBetween(from: string, to: string) {
  const [a, b] = [from, to].map((s) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86_400_000) + 1;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--adm-ink-3)]">{children}</p>;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { from, to } = await searchParams;
  const today = todayInBogota();
  const showChart = !!from && !!to && from <= to && daysBetween(from, to) <= MAX_CHART_DAYS;

  const [
    inventorySummary,
    lowStock,
    outOfStock,
    purchases,
    sales,
    profit,
    cashBalance,
    cashMovements,
    sellersInventory,
    sellerSalesSummary,
    returnedProducts,
    distributors,
    payableBalances,
    daily,
  ] = await Promise.all([
    getInventorySummary(),
    getLowStock(),
    getOutOfStock(),
    getPurchasesReport(from, to),
    getSalesReport(from, to),
    getProfitReport(from, to),
    getCashBalance(),
    getAllCashMovements(),
    getAllSellersInventory(),
    getSellerSalesSummary(),
    getReturnedProductsSummary(),
    getAllDistributors(),
    getAccountsPayableSummary(),
    showChart ? getDailySales(from!, to!) : Promise.resolve([]),
  ]);

  const cashInRange = cashMovements.filter((m) => {
    const d = new Date(m.movementDate);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(`${to}T23:59:59.999`)) return false;
    return true;
  });
  // Cash adjustments (opening balance, count corrections) are not income/expense.
  const { income: cashInRangeIncome, expense: cashInRangeExpense } = summarizeCashFlow(cashInRange);

  const sellersWithInventory = new Map<number, { sellerName: string | null; items: typeof sellersInventory }>();
  for (const row of sellersInventory) {
    if (row.sellerId === null) continue;
    if (!sellersWithInventory.has(row.sellerId)) {
      sellersWithInventory.set(row.sellerId, { sellerName: row.sellerName, items: [] });
    }
    sellersWithInventory.get(row.sellerId)!.items.push(row);
  }

  const distributorMap = new Map(distributors.map((d) => [d.id, d.name]));
  const margin = profit.revenue > 0 ? Math.round((profit.profit / profit.revenue) * 100) : null;
  const payableTotal = [...payableBalances.values()].reduce((s, v) => s + v, 0);

  const rangeLabel =
    from || to
      ? `${from ? formatPlainDate(from) : "el inicio"} — ${to ? formatPlainDate(to) : "hoy"}`
      : "Todo el historial";

  const channels = [
    { label: "En local", color: "var(--adm-series-1)", ...sales.byChannel.local },
    { label: "Vendedores", color: "var(--adm-series-2)", ...sales.byChannel.seller },
    { label: "WhatsApp", color: "var(--adm-series-3)", ...sales.byChannel.whatsapp },
  ];

  return (
    <Page>
      <PageHeader eyebrow="General" title="Reportes" description={<span className="num">{rangeLabel}</span>} />

      <DateRangeFilter from={from} to={to} />

      {/* Flow KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Ventas" value={formatCOP(sales.totalAmount)} hint={`${formatNumber(sales.totalCount)} ${sales.totalCount === 1 ? "venta" : "ventas"}`} icon={TrendingUp} tone="info" />
        <Stat
          label="Utilidad bruta"
          value={formatCOP(profit.profit)}
          valueTone={profit.profit < 0 ? "danger" : "neutral"}
          hint={margin === null ? "Sin ventas" : `Margen ${margin}% · costo ${formatCOP(profit.cogs)}`}
          icon={CircleDollarSign}
          tone="ok"
        />
        <Stat label="Compras" value={formatCOP(purchases.totalAmount)} hint={`${purchases.totalCount} pedidos (sin cancelados)`} icon={ShoppingCart} tone="violet" />
        <Stat
          label="Flujo de caja"
          value={formatCOP(cashInRangeIncome - cashInRangeExpense)}
          valueTone={cashInRangeIncome - cashInRangeExpense < 0 ? "danger" : "neutral"}
          hint={`+${formatCOP(cashInRangeIncome)} / −${formatCOP(cashInRangeExpense)}`}
          icon={Wallet}
          tone="warn"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-start">
        <Card title="Ventas por día" description={showChart ? "Por canal" : undefined}>
          {showChart ? (
            <SalesChart data={daily} today={today} />
          ) : (
            <Empty>Elige un rango de hasta {MAX_CHART_DAYS} días (por ejemplo “Este mes” o “30 días”) para ver la gráfica diaria.</Empty>
          )}
        </Card>

        <Card title="Ventas por canal">
          <div className="flex h-3 rounded-full overflow-hidden gap-[2px] bg-[#efece5]">
            {channels.map((c) =>
              c.total > 0 ? <div key={c.label} style={{ flexGrow: c.total, background: c.color }} title={c.label} /> : null,
            )}
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {channels.map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: c.color }} />
                  {c.label}
                  <span className="text-[12px] text-[var(--adm-ink-3)]">
                    {c.count} {c.count === 1 ? "venta" : "ventas"}
                  </span>
                </span>
                <span className="num font-semibold">{formatCOP(c.total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-[var(--adm-line)] grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="adm-eyebrow">Ingresos</p>
              <p className="num text-[13.5px] font-semibold mt-1">{formatCOP(profit.revenue)}</p>
            </div>
            <div>
              <p className="adm-eyebrow">Costo</p>
              <p className="num text-[13.5px] font-semibold mt-1">{formatCOP(profit.cogs)}</p>
            </div>
            <div>
              <p className="adm-eyebrow">Utilidad</p>
              <p className="num text-[13.5px] font-semibold mt-1">{formatCOP(profit.profit)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        <Card title="Compras por proveedor" description="Rango seleccionado" flush>
          {purchases.byDistributor.length === 0 ? (
            <div className="p-5">
              <Empty>Sin compras en el rango.</Empty>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th className="t-right">Pedidos</th>
                  <th className="t-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchases.byDistributor.map((r) => (
                  <tr key={r.distributorId ?? "none"}>
                    <td className="t-strong">{r.distributorName ?? "Sin distribuidor"}</td>
                    <td className="t-right num">{r.count}</td>
                    <td className="t-right num">{formatCOP(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Inventario actual" description="Estado actual">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="adm-eyebrow">Productos</p>
              <p className="num text-[20px] font-semibold mt-1">{inventorySummary.activeProducts}</p>
            </div>
            <div>
              <p className="adm-eyebrow">Unidades</p>
              <p className="num text-[20px] font-semibold mt-1">{formatNumber(inventorySummary.totalUnits)}</p>
            </div>
            <div>
              <p className="adm-eyebrow">Valor costo</p>
              <p className="num text-[20px] font-semibold mt-1">{formatCOP(inventorySummary.totalValue)}</p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-[var(--adm-line)] grid grid-cols-2 gap-3">
            <div>
              <p className="adm-eyebrow">Caja (saldo)</p>
              <p className="num text-[17px] font-semibold mt-1">{formatCOP(cashBalance)}</p>
            </div>
            <div>
              <p className="adm-eyebrow">Por pagar</p>
              <p className={`num text-[17px] font-semibold mt-1 ${payableTotal > 0 ? "text-[var(--adm-warn)]" : ""}`}>{formatCOP(payableTotal)}</p>
            </div>
          </div>
        </Card>

        <Card title="Cuentas por pagar" description="Estado actual" flush>
          {payableBalances.size === 0 ? (
            <div className="p-5">
              <Empty>Sin saldos pendientes.</Empty>
            </div>
          ) : (
            <table className="adm-table">
              <tbody>
                {Array.from(payableBalances.entries()).map(([distributorId, pending]) => (
                  <tr key={distributorId}>
                    <td className="t-strong">{distributorMap.get(distributorId) ?? "—"}</td>
                    <td className="t-right num text-[var(--adm-warn)] font-semibold">{formatCOP(pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Stock mínimo" description={`${lowStock.length} productos`} flush>
          {lowStock.length === 0 ? (
            <div className="p-5">
              <Empty>Ningún producto en umbral mínimo.</Empty>
            </div>
          ) : (
            <table className="adm-table">
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td className="t-strong">{p.name}</td>
                    <td className="t-right num">
                      <span className="text-[var(--adm-warn)] font-semibold">{p.stock}</span> / {p.minStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Productos agotados" description={`${outOfStock.length} productos`} flush>
          {outOfStock.length === 0 ? (
            <div className="p-5">
              <Empty>Ningún producto agotado.</Empty>
            </div>
          ) : (
            <ul className="divide-y divide-[#f0ede6]">
              {outOfStock.map((p) => (
                <li key={p.id} className="px-5 py-2.5 text-[13.5px]">
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Productos devueltos" description="Histórico completo" flush>
          {returnedProducts.length === 0 ? (
            <div className="p-5">
              <Empty>Sin devoluciones registradas.</Empty>
            </div>
          ) : (
            <table className="adm-table">
              <tbody>
                {returnedProducts.map((r) => (
                  <tr key={r.productId}>
                    <td className="t-strong">{r.productName}</td>
                    <td className="t-right num">{r.totalQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card title="Ventas por vendedor" description="Histórico completo" flush>
          {sellerSalesSummary.length === 0 ? (
            <div className="p-5">
              <Empty>Sin ventas de vendedores registradas.</Empty>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th className="t-right">Ventas</th>
                  <th className="t-right">Total</th>
                  <th className="t-right">Comisión</th>
                </tr>
              </thead>
              <tbody>
                {sellerSalesSummary.map((r) => (
                  <tr key={r.sellerId}>
                    <td className="t-strong">{r.sellerName ?? "—"}</td>
                    <td className="t-right num">{r.count}</td>
                    <td className="t-right num">{formatCOP(r.totalAmount)}</td>
                    <td className="t-right num">{formatCOP(r.totalCommission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Inventario en poder de vendedores" description="Lo que cada vendedor tiene sin vender ni devolver" flush>
          {sellersWithInventory.size === 0 ? (
            <div className="p-5">
              <Empty>Ningún vendedor con inventario asignado.</Empty>
            </div>
          ) : (
            <div className="divide-y divide-[var(--adm-line)]">
              {Array.from(sellersWithInventory.entries()).map(([sellerId, { sellerName, items }]) => (
                <div key={sellerId} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-[14px]">{sellerName ?? "—"}</p>
                    <p className="num text-[12.5px] text-[var(--adm-ink-3)]">{items.reduce((s, i) => s + i.quantity, 0)} unidades</p>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {items.map((item) => (
                      <li key={item.productId} className="flex justify-between text-[13px] text-[var(--adm-ink-2)]">
                        <span className="truncate">{item.productName}</span>
                        <span className="num font-medium text-[var(--adm-ink)]">{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
