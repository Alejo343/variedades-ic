import { Plus, Store } from "lucide-react";
import { getAllDirectSales, getDirectSaleLines } from "@/lib/db/queries/direct-sales";
import { saleVoidBlocker } from "@/lib/domain/sale-void";
import { Badge, ButtonLink, EmptyState, Page, PageHeader, Stat } from "../_components/ui";
import { ExpandableSaleRow } from "../_components/ExpandableSaleRow";
import { SaleBreakdown } from "../_components/SaleBreakdown";
import { VoidSaleControls } from "../_components/VoidSaleControls";
import { linesSummary } from "../_lib/sale-lines";
import { formatCOP, formatDateTime, todayInBogota } from "../_lib/format";

export default async function DirectSalesPage() {
  const [sales, linesBySale] = await Promise.all([getAllDirectSales(), getDirectSaleLines()]);
  // Voided sales stay listed (marked) but count in no total.
  const counted = sales.filter((s) => !s.voidedAt);

  const today = todayInBogota();
  const dayOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d);
  const todays = counted.filter((s) => dayOf(new Date(s.saleDate)) === today);
  const month = counted.filter((s) => dayOf(new Date(s.saleDate)).slice(0, 7) === today.slice(0, 7));
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
                  <th>Vendió</th>
                  <th>Productos</th>
                  <th className="t-right">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => {
                  const lines = linesBySale.get(s.id) ?? [];
                  return (
                    <ExpandableSaleRow
                      key={s.id}
                      colSpan={7}
                      dim={!!s.voidedAt}
                      cells={
                        <>
                          <td className="num text-[var(--adm-ink-3)]">#{s.id}</td>
                          <td className="whitespace-nowrap">{formatDateTime(s.saleDate)}</td>
                          <td>{s.accountName ?? "—"}</td>
                          <td>{s.sellerName ?? "Dueño"}</td>
                          <td className="max-w-[320px] truncate">
                            {s.voidedAt && (
                              <>
                                <Badge tone="danger">Anulada</Badge>{" "}
                              </>
                            )}
                            {linesSummary(lines)}
                          </td>
                          <td className={`t-right num t-strong ${s.voidedAt ? "line-through" : ""}`}>{formatCOP(s.totalAmount)}</td>
                        </>
                      }
                      detail={
                        <SaleBreakdown
                          lines={lines}
                          total={s.totalAmount}
                          commission={s.sellerId !== null ? s.commissionAmount : undefined}
                          facts={[
                            `Cuenta: ${s.accountName ?? "—"}`,
                            s.sellerName ? `Vendió ${s.sellerName}` : "Venta del dueño",
                            ...(s.notes ? [`Notas: ${s.notes}`] : []),
                          ]}
                          voidedAt={s.voidedAt}
                          voidReason={s.voidReason}
                          actions={
                            !s.voidedAt && (
                              <VoidSaleControls
                                kind="direct"
                                saleId={s.id}
                                blocker={saleVoidBlocker(s)}
                                // The panel's form registers the owner's sales only; a store
                                // seller registers theirs again from the phone.
                                correctHref={s.sellerId === null ? `/admin/direct-sales/new?corregir=${s.id}` : null}
                              />
                            )
                          }
                        />
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}
