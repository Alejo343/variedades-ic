import { getInventorySummary, getPurchasesReport, getSalesReport, getProfitReport } from "@/lib/db/queries/reports";
import { getLowStock, getOutOfStock } from "@/lib/db/queries/inventory";
import { getAllCashMovements, getCashBalance } from "@/lib/db/queries/cash";
import { getAllSellersInventory } from "@/lib/db/queries/seller-inventory";
import { getSellerSalesSummary } from "@/lib/db/queries/seller-sales";
import { getReturnedProductsSummary } from "@/lib/db/queries/seller-returns";
import { getAccountsPayableSummary } from "@/lib/db/queries/purchase-payments";
import { getAllDistributors } from "@/lib/db/queries/distributors";
import { DateRangeFilter } from "./_components/DateRangeFilter";

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function formatCOPCentavos(n: number) {
  return formatCOP(n / 100);
}

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700 flex items-center justify-between">
        <span>{title}</span>
        {note && <span className="text-xs font-normal text-gray-400">{note}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-lg font-bold text-gray-800">{value}</span>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;

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
  ]);

  const cashInRange = cashMovements.filter((m) => {
    const d = new Date(m.movementDate);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(`${to}T23:59:59.999`)) return false;
    return true;
  });
  const cashInRangeIncome = cashInRange.filter((m) => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
  const cashInRangeExpense = cashInRange.filter((m) => m.type === "gasto").reduce((s, m) => s + m.amount, 0);

  const sellersWithInventory = new Map<number, { sellerName: string | null; items: typeof sellersInventory }>();
  for (const row of sellersInventory) {
    if (row.sellerId === null) continue;
    if (!sellersWithInventory.has(row.sellerId)) {
      sellersWithInventory.set(row.sellerId, { sellerName: row.sellerName, items: [] });
    }
    sellersWithInventory.get(row.sellerId)!.items.push(row);
  }

  const distributorMap = new Map(distributors.map((d) => [d.id, d.name]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>

      <DateRangeFilter from={from} to={to} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Inventario actual" note="estado actual">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Productos activos" value={String(inventorySummary.activeProducts)} />
            <Stat label="Unidades en stock" value={String(inventorySummary.totalUnits)} />
            <Stat label="Valor (costo)" value={formatCOP(inventorySummary.totalValue)} />
          </div>
        </Card>

        <Card title="Compras" note="rango seleccionado">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <Stat label="Pedidos" value={String(purchases.totalCount)} />
            <Stat label="Total" value={formatCOPCentavos(purchases.totalAmount)} />
          </div>
          {purchases.byDistributor.length > 0 && (
            <table className="w-full text-xs">
              <tbody className="divide-y divide-gray-50">
                {purchases.byDistributor.map((r) => (
                  <tr key={r.distributorId ?? "none"}>
                    <td className="py-1 text-gray-600">{r.distributorName ?? "— Sin distribuidor —"}</td>
                    <td className="py-1 text-right text-gray-500">{r.count}</td>
                    <td className="py-1 text-right text-gray-800">{formatCOPCentavos(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Ventas" note="rango seleccionado">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <Stat label="Ventas" value={String(sales.totalCount)} />
            <Stat label="Total" value={formatCOP(sales.totalAmount)} />
          </div>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-1 text-gray-600">WhatsApp</td>
                <td className="py-1 text-right text-gray-500">{sales.byChannel.whatsapp.count}</td>
                <td className="py-1 text-right text-gray-800">{formatCOP(sales.byChannel.whatsapp.total)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Local</td>
                <td className="py-1 text-right text-gray-500">{sales.byChannel.local.count}</td>
                <td className="py-1 text-right text-gray-800">{formatCOP(sales.byChannel.local.total)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Vendedores</td>
                <td className="py-1 text-right text-gray-500">{sales.byChannel.seller.count}</td>
                <td className="py-1 text-right text-gray-800">{formatCOP(sales.byChannel.seller.total)}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card title="Utilidad bruta" note="ventas − costo de compra">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Ventas" value={formatCOP(profit.revenue)} />
            <Stat label="Costo" value={formatCOP(profit.cogs)} />
            <Stat label="Utilidad" value={formatCOP(profit.profit)} />
          </div>
        </Card>

        <Card title="Caja" note="rango seleccionado">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Saldo actual" value={formatCOP(cashBalance)} />
            <Stat label="Ingresos" value={formatCOP(cashInRangeIncome)} />
            <Stat label="Gastos" value={formatCOP(cashInRangeExpense)} />
          </div>
        </Card>

        <Card title="Cuentas por pagar" note="estado actual">
          {payableBalances.size === 0 ? (
            <p className="text-sm text-gray-400">Sin saldos pendientes</p>
          ) : (
            <table className="w-full text-xs">
              <tbody className="divide-y divide-gray-50">
                {Array.from(payableBalances.entries()).map(([distributorId, pending]) => (
                  <tr key={distributorId}>
                    <td className="py-1 text-gray-600">{distributorMap.get(distributorId) ?? "—"}</td>
                    <td className="py-1 text-right text-gray-800">{formatCOPCentavos(pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Stock mínimo" note={`${lowStock.length} producto(s)`}>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400">Ningún producto en umbral mínimo</p>
          ) : (
            <table className="w-full text-xs">
              <tbody className="divide-y divide-gray-50">
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td className="py-1 text-gray-600">{p.name}</td>
                    <td className="py-1 text-right text-gray-500">
                      {p.stock} / mín. {p.minStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Productos agotados" note={`${outOfStock.length} producto(s)`}>
          {outOfStock.length === 0 ? (
            <p className="text-sm text-gray-400">Ningún producto agotado</p>
          ) : (
            <ul className="text-xs text-gray-600 flex flex-col gap-1">
              {outOfStock.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Inventario / pendientes por vendedor"
          note="lo que cada vendedor tiene sin vender ni devolver"
        >
          {sellersWithInventory.size === 0 ? (
            <p className="text-sm text-gray-400">Ningún vendedor con inventario asignado</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Array.from(sellersWithInventory.entries()).map(([sellerId, { sellerName, items }]) => (
                <div key={sellerId}>
                  <p className="text-xs font-semibold text-gray-700 mb-1">{sellerName ?? "—"}</p>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-gray-50">
                      {items.map((item) => (
                        <tr key={item.productId}>
                          <td className="py-1 text-gray-600">{item.productName}</td>
                          <td className="py-1 text-right text-gray-800">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Ventas por vendedor" note="histórico completo">
          {sellerSalesSummary.length === 0 ? (
            <p className="text-sm text-gray-400">Sin ventas de vendedores registradas</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500">
                  <th className="text-left py-1 font-medium">Vendedor</th>
                  <th className="text-right py-1 font-medium">Ventas</th>
                  <th className="text-right py-1 font-medium">Total</th>
                  <th className="text-right py-1 font-medium">Comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sellerSalesSummary.map((r) => (
                  <tr key={r.sellerId}>
                    <td className="py-1 text-gray-600">{r.sellerName ?? "—"}</td>
                    <td className="py-1 text-right text-gray-500">{r.count}</td>
                    <td className="py-1 text-right text-gray-800">{formatCOP(r.totalAmount)}</td>
                    <td className="py-1 text-right text-gray-800">{formatCOP(r.totalCommission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Productos devueltos" note="histórico completo">
          {returnedProducts.length === 0 ? (
            <p className="text-sm text-gray-400">Sin devoluciones registradas</p>
          ) : (
            <table className="w-full text-xs">
              <tbody className="divide-y divide-gray-50">
                {returnedProducts.map((r) => (
                  <tr key={r.productId}>
                    <td className="py-1 text-gray-600">{r.productName}</td>
                    <td className="py-1 text-right text-gray-800">{r.totalQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
