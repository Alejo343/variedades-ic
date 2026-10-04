import { Plus, Store } from "lucide-react";
import { getAllDirectSales } from "@/lib/db/queries/direct-sales";
import { ButtonLink, EmptyState, Page, PageHeader, Stat } from "../_components/ui";
import { formatCOP, formatDateTime, todayInBogota } from "../_lib/format";

export default async function DirectSalesPage() {
  const sales = await getAllDirectSales();

  const today = todayInBogota();
  const dayOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d);
  const todays = sales.filter((s) => dayOf(new Date(s.saleDate)) === today);
  const month = sales.filter((s) => dayOf(new Date(s.saleDate)).slice(0, 7) === today.slice(0, 7));
  const sum = (xs: typeof sales) => xs.reduce((t, s) => t + s.totalAmount, 0);
  const avg = month.length ? Math.round(sum(month) / month.length) : 0;

  return (
    <Page>
      <PageHeader
        eyebrow="Ventas"
        title="Ventas en local"
        description="Ventas de mostrador: descuentan stock y entran a caja al instante."
        actions={
          <ButtonLink href="/admin/direct-sales/new" variant="brand" icon={Plus}>
            Nueva venta
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat label="Hoy" value={formatCOP(sum(todays))} hint={`${todays.length} ${todays.length === 1 ? "venta" : "ventas"}`} icon={Store} tone="info" />
        <Stat label="Este mes" value={formatCOP(sum(month))} hint={`${month.length} ${month.length === 1 ? "venta" : "ventas"}`} tone="ok" />
        <Stat label="Ticket promedio del mes" value={formatCOP(avg)} tone="violet" />
      </div>

      <div className="adm-card overflow-hidden">
        {sales.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No hay ventas en local registradas"
            description="Registra la primera venta de mostrador desde el botón Nueva venta."
          />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Cuenta</th>
                  <th>Notas</th>
                  <th className="t-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="num text-[var(--adm-ink-3)]">#{s.id}</td>
                    <td className="whitespace-nowrap">{formatDateTime(s.saleDate)}</td>
                    <td>{s.accountName ?? "—"}</td>
                    <td className="max-w-[320px] truncate">{s.notes ?? "—"}</td>
                    <td className="t-right num t-strong">{formatCOP(s.totalAmount)}</td>
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
