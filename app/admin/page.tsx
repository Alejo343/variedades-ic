import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  CircleDollarSign,
  HandCoins,
  MessageCircle,
  PackageOpen,
  PackageX,
  ReceiptText,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { getAllPurchaseOrders } from "@/lib/db/queries/purchase-orders";
import { getAllSalesOrders } from "@/lib/db/queries/sales-orders";
import { getLowStock, getNegativeStock, getOutOfStock, getRecentMovements } from "@/lib/db/queries/inventory";
import { getCashBalance } from "@/lib/db/queries/cash";
import { getCashAccountsWithBalances } from "@/lib/db/queries/cash-accounts";
import { getAccountsPayableSummary } from "@/lib/db/queries/purchase-payments";
import { getAllSettlements } from "@/lib/db/queries/settlements";
import { getDailySales, getProfitReport, getSalesReport } from "@/lib/db/queries/reports";
import { Card, Page, Stat, StatusBadge, Badge } from "./_components/ui";
import { SalesChart } from "./_components/SalesChart";
import { MOVEMENT_LABELS, formatCOP, formatDateTime, formatNumber, shiftDate, todayInBogota } from "./_lib/format";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function AdminDashboard() {
  const today = todayInBogota();
  const monthStart = `${today.slice(0, 8)}01`;
  const chartFrom = shiftDate(today, -13);
  const prevFrom = shiftDate(today, -27);
  const prevTo = shiftDate(today, -14);

  const [
    salesToday,
    salesMonth,
    profitMonth,
    daily,
    prevPeriod,
    cashBalance,
    accounts,
    payables,
    purchaseOrders,
    salesOrders,
    settlements,
    lowStock,
    outOfStock,
    negativeStock,
    movements,
  ] = await Promise.all([
    getSalesReport(today, today),
    getSalesReport(monthStart, today),
    getProfitReport(monthStart, today),
    getDailySales(chartFrom, today),
    getSalesReport(prevFrom, prevTo),
    getCashBalance(),
    getCashAccountsWithBalances(),
    getAccountsPayableSummary(),
    getAllPurchaseOrders(),
    getAllSalesOrders(),
    getAllSettlements(),
    getLowStock(),
    getOutOfStock(),
    getNegativeStock(),
    getRecentMovements(8),
  ]);

  const periodTotal = daily.reduce((s, d) => s + d.local + d.seller + d.whatsapp, 0);
  const delta = prevPeriod.totalAmount > 0 ? ((periodTotal - prevPeriod.totalAmount) / prevPeriod.totalAmount) * 100 : null;
  const payablesTotal = [...payables.values()].reduce((s, v) => s + v, 0);
  const margin = profitMonth.revenue > 0 ? Math.round((profitMonth.profit / profitMonth.revenue) * 100) : null;

  const openPurchases = purchaseOrders.filter((o) => o.status === "pendiente" || o.status === "en_viaje");
  const openSales = salesOrders.filter((o) => o.status === "pendiente" || o.status === "confirmado");
  const pendingSettlements = settlements.filter((s) => s.status === "pendiente");
  const alertCount = negativeStock.length + outOfStock.length + lowStock.length;

  const dateLabel = new Date().toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Page>
      {/* Header */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="adm-eyebrow mb-1.5">{dateLabel}</p>
          <h1 className="text-[32px] leading-tight font-semibold">{greeting()}</h1>
          <p className="text-[var(--adm-ink-2)] mt-1">
            Hoy van{" "}
            <span className="num font-semibold text-[var(--adm-ink)]">{formatCOP(salesToday.totalAmount)}</span> en{" "}
            {salesToday.totalCount} {salesToday.totalCount === 1 ? "venta" : "ventas"}.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <QuickAction href="/admin/direct-sales/new" icon={Store} label="Cobrar en local" primary />
          <QuickAction href="/admin/deliveries/new" icon={PackageOpen} label="Entregar a vendedor" />
          <QuickAction href="/admin/purchase-orders/new" icon={ShoppingCart} label="Nueva compra" />
          <QuickAction href="/admin/settlements/new" icon={ReceiptText} label="Liquidar" />
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat
          label="Ventas del mes"
          value={formatCOP(salesMonth.totalAmount)}
          hint={`${formatNumber(salesMonth.totalCount)} ventas en los 3 canales`}
          icon={TrendingUp}
          tone="info"
          href="/admin/reports"
        />
        <Stat
          label="Utilidad bruta del mes"
          value={formatCOP(profitMonth.profit)}
          valueTone={profitMonth.profit < 0 ? "danger" : "neutral"}
          hint={margin === null ? "Sin ventas este mes" : `Margen ${margin}% sobre ventas`}
          icon={CircleDollarSign}
          tone="ok"
          href="/admin/reports"
        />
        <Stat
          label="Saldo en caja"
          value={formatCOP(cashBalance)}
          valueTone={cashBalance < 0 ? "danger" : "neutral"}
          hint={`${accounts.filter((a) => a.active).length} cuentas activas`}
          icon={Wallet}
          tone="violet"
          href="/admin/cash"
        />
        <Stat
          label="Cuentas por pagar"
          value={formatCOP(payablesTotal)}
          valueTone={payablesTotal > 0 ? "warn" : "neutral"}
          hint={payables.size === 0 ? "Sin deudas con proveedores" : `${payables.size} ${payables.size === 1 ? "proveedor" : "proveedores"}`}
          icon={Truck}
          tone="warn"
          href="/admin/distributors"
        />
      </div>

      {/* Chart + side */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <Card
          title="Ventas de los últimos 14 días"
          description="Por canal · WhatsApp cuenta solo pedidos confirmados o entregados"
          actions={
            <div className="text-right">
              <p className="num text-[18px] font-semibold leading-none">{formatCOP(periodTotal)}</p>
              {delta !== null && (
                <p
                  className={`inline-flex items-center gap-0.5 text-[12px] font-medium mt-1 ${
                    delta >= 0 ? "text-[var(--adm-ok)]" : "text-[var(--adm-danger)]"
                  }`}
                >
                  {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(delta).toFixed(0)}% vs. 14 días previos
                </p>
              )}
            </div>
          }
        >
          <SalesChart data={daily} today={today} />
        </Card>

        <Card title="Cuentas de caja" actions={<Link href="/admin/cash" className="adm-link text-[13px]">Ver caja</Link>} flush>
          <ul className="divide-y divide-[#f0ede6]">
            {accounts
              .filter((a) => a.active)
              .map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg grid place-items-center bg-[#f0ede6] text-[var(--adm-ink-2)] shrink-0">
                      {a.type === "banco" ? <CircleDollarSign size={15} /> : <Wallet size={15} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium truncate">{a.name}</p>
                      <p className="text-[12px] text-[var(--adm-ink-3)] capitalize">{a.type}</p>
                    </div>
                  </div>
                  <span className={`num text-[14px] font-semibold ${a.balance < 0 ? "text-[var(--adm-danger)]" : ""}`}>
                    {formatCOP(a.balance)}
                  </span>
                </li>
              ))}
            {accounts.length === 0 && <li className="px-5 py-8 text-center text-sm text-[var(--adm-ink-3)]">Sin cuentas.</li>}
          </ul>
          <div className="px-5 py-3.5 border-t border-[var(--adm-line)] bg-[var(--adm-surface-2)] flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--adm-ink-2)]">Total</span>
            <span className="num font-semibold">{formatCOP(cashBalance)}</span>
          </div>
        </Card>
      </div>

      {/* Pending + alerts + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card title="Por atender" description="Pedidos y cierres abiertos" flush>
          <ul className="divide-y divide-[#f0ede6]">
            <PendingRow
              href="/admin/sales-orders"
              icon={MessageCircle}
              label="Pedidos WhatsApp sin entregar"
              count={openSales.length}
            />
            <PendingRow href="/admin/purchase-orders" icon={ShoppingCart} label="Compras en curso" count={openPurchases.length} />
            <PendingRow
              href="/admin/settlements"
              icon={HandCoins}
              label="Liquidaciones por cobrar"
              count={pendingSettlements.length}
              extra={
                pendingSettlements.length > 0
                  ? formatCOP(pendingSettlements.reduce((s, x) => s + x.amountDue, 0))
                  : undefined
              }
            />
          </ul>
          {openPurchases.length > 0 && (
            <div className="px-5 py-4 border-t border-[var(--adm-line)]">
              <p className="adm-eyebrow mb-3">Compras en curso</p>
              <ul className="flex flex-col gap-2.5">
                {openPurchases.slice(0, 4).map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/purchase-orders/${o.id}`} className="flex items-center justify-between gap-3 group">
                      <span className="text-[13.5px] truncate group-hover:underline underline-offset-4">
                        <span className="num text-[var(--adm-ink-3)]">#{o.id}</span> {o.distributorName ?? "Sin distribuidor"}
                      </span>
                      <StatusBadge kind="purchase" status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card
          title="Alertas de inventario"
          description={alertCount === 0 ? "Todo en orden" : `${alertCount} productos requieren atención`}
          actions={<Link href="/admin/inventory" className="adm-link text-[13px]">Inventario</Link>}
          flush
        >
          {alertCount === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-10">
              <span className="w-11 h-11 rounded-2xl grid place-items-center bg-[var(--adm-ok-soft)] text-[var(--adm-ok)] mb-3">
                <CheckCircle2 size={20} />
              </span>
              <p className="text-[14px] font-medium">Sin alertas</p>
              <p className="text-[13px] text-[var(--adm-ink-3)]">Ningún producto agotado ni bajo el mínimo.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#f0ede6] max-h-[340px] overflow-y-auto">
              {negativeStock.map((p) => (
                <AlertRow key={`n${p.id}`} id={p.id} name={p.name} tone="danger" label="Negativo" value={p.stock} />
              ))}
              {outOfStock.map((p) => (
                <AlertRow key={`o${p.id}`} id={p.id} name={p.name} tone="danger" label="Agotado" value={0} />
              ))}
              {lowStock.map((p) => (
                <AlertRow key={`l${p.id}`} id={p.id} name={p.name} tone="warn" label={`Mín. ${p.minStock}`} value={p.stock} />
              ))}
            </ul>
          )}
          {negativeStock.length > 0 && (
            <div className="p-4 border-t border-[var(--adm-line)]">
              <div className="adm-alert adm-alert-danger">
                <AlertTriangle />
                <span>
                  Stock negativo por ventas sincronizadas desde el móvil. Corrígelo con un ajuste manual en Inventario.
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Actividad de inventario"
          description="Últimos movimientos del ledger"
          className="lg:col-span-2 xl:col-span-1"
          flush
        >
          {movements.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[var(--adm-ink-3)]">Sin movimientos aún.</p>
          ) : (
            <ol className="px-5 py-2">
              {movements.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5 border-b border-[#f0ede6] last:border-0">
                  <span
                    className={`num w-12 shrink-0 text-right text-[13px] font-semibold ${
                      m.quantityDelta > 0 ? "text-[var(--adm-ok)]" : "text-[var(--adm-danger)]"
                    }`}
                  >
                    {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] truncate">{m.productName ?? "—"}</p>
                    <p className="text-[12px] text-[var(--adm-ink-3)]">
                      {MOVEMENT_LABELS[m.type] ?? m.type}
                      {m.ownerType === "seller" && " · vendedor"} · {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* Channel breakdown for the month */}
      <Card title="Ventas del mes por canal" flush>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--adm-line)]">
          {(
            [
              ["En local", salesMonth.byChannel.local, "var(--adm-series-1)", "/admin/direct-sales"],
              ["Vendedores", salesMonth.byChannel.seller, "var(--adm-series-2)", "/admin/seller-sales"],
              ["WhatsApp", salesMonth.byChannel.whatsapp, "var(--adm-series-3)", "/admin/sales-orders"],
            ] as const
          ).map(([label, ch, color, href]) => {
            const share = salesMonth.totalAmount > 0 ? (ch.total / salesMonth.totalAmount) * 100 : 0;
            return (
              <Link key={label} href={href} className="block p-5 hover:bg-[var(--adm-surface-2)] transition group">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[13px] text-[var(--adm-ink-2)]">
                    <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: color }} />
                    {label}
                  </span>
                  <ChevronRight size={16} className="text-[var(--adm-ink-3)] group-hover:translate-x-0.5 transition" />
                </div>
                <p className="num text-[22px] font-semibold mt-2">{formatCOP(ch.total)}</p>
                <p className="text-[12.5px] text-[var(--adm-ink-3)]">
                  {ch.count} {ch.count === 1 ? "venta" : "ventas"} · {share.toFixed(0)}% del total
                </p>
                <div className="h-1.5 rounded-full bg-[#efece5] mt-3 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${share}%`, background: color }} />
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </Page>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  primary,
}: {
  href: string;
  icon: typeof Store;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link href={href} className={`adm-btn ${primary ? "adm-btn-brand" : ""}`}>
      <Icon />
      {label}
    </Link>
  );
}

function PendingRow({
  href,
  icon: Icon,
  label,
  count,
  extra,
}: {
  href: string;
  icon: typeof Store;
  label: string;
  count: number;
  extra?: string;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--adm-surface-2)] transition group">
        <span className="w-8 h-8 rounded-lg grid place-items-center bg-[#f0ede6] text-[var(--adm-ink-2)] shrink-0">
          <Icon size={15} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] truncate">{label}</p>
          {extra && <p className="num text-[12px] text-[var(--adm-ink-3)]">{extra}</p>}
        </div>
        <span
          className={`num min-w-7 h-7 px-2 rounded-lg grid place-items-center text-[13px] font-semibold ${
            count > 0 ? "bg-[var(--adm-ink)] text-white" : "bg-[#f0ede6] text-[var(--adm-ink-3)]"
          }`}
        >
          {count}
        </span>
      </Link>
    </li>
  );
}

function AlertRow({
  id,
  name,
  tone,
  label,
  value,
}: {
  id: number;
  name: string;
  tone: "danger" | "warn";
  label: string;
  value: number;
}) {
  return (
    <li>
      <Link href={`/admin/products/${id}/edit`} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--adm-surface-2)] transition">
        {tone === "danger" ? (
          <PackageX size={16} className="text-[var(--adm-danger)] shrink-0" />
        ) : (
          <AlertTriangle size={16} className="text-[var(--adm-warn)] shrink-0" />
        )}
        <span className="flex-1 text-[13.5px] truncate">{name}</span>
        <Badge tone={tone} plain>
          {label}
        </Badge>
        <span className={`num w-8 text-right text-[13.5px] font-semibold ${tone === "danger" ? "text-[var(--adm-danger)]" : "text-[var(--adm-warn)]"}`}>
          {value}
        </span>
      </Link>
    </li>
  );
}
