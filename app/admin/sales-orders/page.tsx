import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";
import { getAllSalesOrders } from "@/lib/db/queries/sales-orders";
import { ButtonLink, EmptyState, FilterTabs, Page, PageHeader, StatusBadge } from "../_components/ui";
import { formatCOP, formatDateTime } from "../_lib/format";

const STATUSES = [
  ["pendiente", "Pendientes"],
  ["confirmado", "Confirmados"],
  ["entregado", "Entregados"],
  ["cancelado", "Cancelados"],
] as const;

export default async function SalesOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const orders = await getAllSalesOrders();
  const rows = status ? orders.filter((o) => o.status === status) : orders;

  return (
    <Page>
      <PageHeader
        eyebrow="Ventas"
        title="Pedidos por WhatsApp"
        description="Pedidos de clientes del catálogo público. Al confirmar se descuenta el stock y entra el ingreso a caja."
        actions={
          <ButtonLink href="/admin/sales-orders/new" variant="primary" icon={Plus}>
            Nuevo pedido
          </ButtonLink>
        }
      />

      <div className="adm-card overflow-hidden">
        <div className="p-4 border-b border-[var(--adm-line)]">
          <FilterTabs
            basePath="/admin/sales-orders"
            param="status"
            current={status}
            options={[
              { value: "", label: "Todos", count: orders.length },
              ...STATUSES.map(([value, label]) => ({ value, label, count: orders.filter((o) => o.status === value).length })),
            ]}
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No hay pedidos" description="Los pedidos que registres aparecerán aquí." />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="t-right">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td className="num text-[var(--adm-ink-3)]">#{o.id}</td>
                    <td>
                      <Link href={`/admin/sales-orders/${o.id}`} className="t-strong hover:underline underline-offset-4">
                        {o.customerName}
                      </Link>
                      <p className="num text-[12px] text-[var(--adm-ink-3)]">{o.customerPhone}</p>
                    </td>
                    <td className="whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                    <td>
                      <StatusBadge kind="sales" status={o.status} />
                    </td>
                    <td className="t-right num t-strong">{o.totalPrice ? formatCOP(o.totalPrice) : "—"}</td>
                    <td className="t-right">
                      <Link href={`/admin/sales-orders/${o.id}`} className="adm-link text-[13px]">
                        Ver
                      </Link>
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
