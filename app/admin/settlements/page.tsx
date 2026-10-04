import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";
import { getAllSettlements } from "@/lib/db/queries/settlements";
import { getActiveCashAccounts } from "@/lib/db/queries/cash-accounts";
import { LiquidateButton } from "./_components/LiquidateButton";
import { ButtonLink, EmptyState, FilterTabs, Page, PageHeader, Stat, StatusBadge } from "../_components/ui";
import { formatCOP, formatPlainDate } from "../_lib/format";

export default async function SettlementsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const [settlements, accounts] = await Promise.all([getAllSettlements(), getActiveCashAccounts()]);

  const pending = settlements.filter((s) => s.status === "pendiente");
  const rows = status ? settlements.filter((s) => s.status === status) : settlements;
  const pendingTotal = pending.reduce((t, s) => t + s.amountDue, 0);

  return (
    <Page>
      <PageHeader
        eyebrow="Vendedores"
        title="Liquidaciones"
        description="Cierre de cuentas con cada vendedor: ventas − comisión + pérdidas = lo que debe entregar."
        actions={
          <ButtonLink href="/admin/settlements/new" variant="primary" icon={Plus}>
            Nueva liquidación
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat
          label="Por cobrar"
          value={formatCOP(pendingTotal)}
          valueTone={pendingTotal > 0 ? "warn" : "neutral"}
          hint={`${pending.length} liquidaciones pendientes`}
          icon={ReceiptText}
          tone="warn"
        />
        <Stat
          label="Liquidado (histórico)"
          value={formatCOP(settlements.filter((s) => s.status === "liquidada").reduce((t, s) => t + s.amountDue, 0))}
          tone="ok"
        />
      </div>

      <div className="adm-card overflow-hidden">
        <div className="p-4 border-b border-[var(--adm-line)]">
          <FilterTabs
            basePath="/admin/settlements"
            param="status"
            current={status}
            options={[
              { value: "", label: "Todas", count: settlements.length },
              { value: "pendiente", label: "Pendientes", count: pending.length },
              { value: "liquidada", label: "Liquidadas", count: settlements.length - pending.length },
            ]}
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No hay liquidaciones" />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vendedor</th>
                  <th className="t-right">Ventas</th>
                  <th className="t-right">Comisión</th>
                  <th className="t-right">Pérdidas</th>
                  <th className="t-right">A entregar</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="whitespace-nowrap">{formatPlainDate(s.periodDate)}</td>
                    <td className="t-strong">
                      <Link href={`/admin/sellers/${s.sellerId}`} className="hover:underline underline-offset-4">
                        {s.sellerName ?? "—"}
                      </Link>
                    </td>
                    <td className="t-right num">{formatCOP(s.totalSales)}</td>
                    <td className="t-right num">−{formatCOP(s.totalCommission)}</td>
                    <td className="t-right num">+{formatCOP(s.totalLosses)}</td>
                    <td className="t-right num t-strong">{formatCOP(s.amountDue)}</td>
                    <td>
                      <StatusBadge kind="settlement" status={s.status} />
                    </td>
                    <td className="t-right">
                      {s.status === "pendiente" && <LiquidateButton id={s.id} accounts={accounts} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}
