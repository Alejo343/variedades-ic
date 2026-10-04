import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";
import { getAllPurchaseOrders } from "@/lib/db/queries/purchase-orders";
import { Badge, ButtonLink, EmptyState, FilterTabs, Page, PageHeader, StatusBadge } from "../_components/ui";
import { formatCOP, formatDate } from "../_lib/format";

const STATUSES = [
  ["pendiente", "Pendientes"],
  ["en_viaje", "En viaje"],
  ["recibido", "Recibidos"],
  ["cancelado", "Cancelados"],
] as const;

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const orders = await getAllPurchaseOrders();
  const rows = status ? orders.filter((o) => o.status === status) : orders;

  return (
    <Page>
      <PageHeader
        eyebrow="Compras"
        title="Pedidos de compra"
        description="Mercancía pedida a distribuidores: pendiente → en viaje → recibido (suma al stock)."
        actions={
          <ButtonLink href="/admin/purchase-orders/new" variant="primary" icon={Plus}>
            Nuevo pedido
          </ButtonLink>
        }
      />

      <div className="adm-card overflow-hidden">
        <div className="p-4 border-b border-[var(--adm-line)]">
          <FilterTabs
            basePath="/admin/purchase-orders"
            param="status"
            current={status}
            options={[
              { value: "", label: "Todos", count: orders.length },
              ...STATUSES.map(([value, label]) => ({ value, label, count: orders.filter((o) => o.status === value).length })),
            ]}
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No hay pedidos de compra" />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Distribuidor</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Fecha esperada</th>
                  <th className="t-right">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td className="num text-[var(--adm-ink-3)]">#{o.id}</td>
                    <td>
                      <Link href={`/admin/purchase-orders/${o.id}`} className="t-strong hover:underline underline-offset-4">
                        {o.distributorName ?? "Sin distribuidor"}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge kind="purchase" status={o.status} />
                    </td>
                    <td>
                      {o.purchaseType === "credito" ? (
                        <Badge tone="violet" plain>
                          Crédito
                        </Badge>
                      ) : (
                        <Badge plain>Contado</Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap">{formatDate(o.expectedDate)}</td>
                    <td className="t-right num t-strong">{o.totalCost ? formatCOP(o.totalCost) : "—"}</td>
                    <td className="t-right">
                      <Link href={`/admin/purchase-orders/${o.id}`} className="adm-link text-[13px]">
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
