import Link from "next/link";
import { HandCoins, Plus } from "lucide-react";
import { getAllSellerSales, getSellerSalesSummary } from "@/lib/db/queries/seller-sales";
import { ButtonLink, Card, EmptyState, Page, PageHeader } from "../_components/ui";
import { formatCOP, formatDateTime } from "../_lib/format";

export default async function SellerSalesPage() {
  const [sales, summary] = await Promise.all([getAllSellerSales(), getSellerSalesSummary()]);
  const ranking = [...summary].sort((a, b) => b.totalAmount - a.totalAmount);
  const top = ranking[0]?.totalAmount ?? 0;

  return (
    <Page>
      <PageHeader
        eyebrow="Vendedores"
        title="Ventas de vendedores"
        description="Ventas hechas por los vendedores con su propio inventario en consignación."
        actions={
          <ButtonLink href="/admin/seller-sales/new" variant="primary" icon={Plus}>
            Registrar venta
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
        <div className="adm-card overflow-hidden">
          {sales.length === 0 ? (
            <EmptyState icon={HandCoins} title="No hay ventas de vendedores registradas" />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th>Vendedor</th>
                    <th>Notas</th>
                    <th className="t-right">Comisión</th>
                    <th className="t-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id}>
                      <td className="num text-[var(--adm-ink-3)]">#{s.id}</td>
                      <td className="whitespace-nowrap">{formatDateTime(s.saleDate)}</td>
                      <td className="t-strong">
                        <Link href={`/admin/sellers/${s.sellerId}`} className="hover:underline underline-offset-4">
                          {s.sellerName ?? "—"}
                        </Link>
                      </td>
                      <td className="max-w-[240px] truncate">{s.notes ?? "—"}</td>
                      <td className="t-right num">{formatCOP(s.commissionAmount)}</td>
                      <td className="t-right num t-strong">{formatCOP(s.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Card title="Ranking de vendedores" description="Ventas históricas acumuladas">
          {ranking.length === 0 ? (
            <p className="text-sm text-[var(--adm-ink-3)]">Sin datos aún.</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {ranking.map((r, i) => (
                <li key={r.sellerId}>
                  <div className="flex items-center justify-between gap-3 text-[13.5px]">
                    <span className="truncate">
                      <span className="num text-[var(--adm-ink-3)] mr-2">{i + 1}</span>
                      {r.sellerName ?? "—"}
                    </span>
                    <span className="num font-semibold">{formatCOP(r.totalAmount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#efece5] mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--adm-series-2)]"
                      style={{ width: `${top > 0 ? (r.totalAmount / top) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="num text-[11.5px] text-[var(--adm-ink-3)] mt-1">
                    {r.count} ventas · comisión {formatCOP(r.totalCommission)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </Page>
  );
}
