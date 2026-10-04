import Link from "next/link";
import { PackageOpen, Plus } from "lucide-react";
import { getAllSellerDeliveries } from "@/lib/db/queries/seller-deliveries";
import { ButtonLink, EmptyState, Page, PageHeader } from "../_components/ui";
import { formatCOP, formatDateTime } from "../_lib/format";

export default async function DeliveriesPage() {
  const deliveries = await getAllSellerDeliveries();

  return (
    <Page>
      <PageHeader
        eyebrow="Vendedores"
        title="Entregas a vendedores"
        description="Mercancía que sale del inventario principal hacia un vendedor en consignación."
        actions={
          <ButtonLink href="/admin/deliveries/new" variant="primary" icon={Plus}>
            Nueva entrega
          </ButtonLink>
        }
      />

      <div className="adm-card overflow-hidden">
        {deliveries.length === 0 ? (
          <EmptyState icon={PackageOpen} title="No hay entregas registradas" />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Vendedor</th>
                  <th>Notas</th>
                  <th className="t-right">Unidades</th>
                  <th className="t-right">Valor a costo</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td className="num text-[var(--adm-ink-3)]">#{d.id}</td>
                    <td className="whitespace-nowrap">{formatDateTime(d.deliveryDate)}</td>
                    <td className="t-strong">
                      {d.sellerId ? (
                        <Link href={`/admin/sellers/${d.sellerId}`} className="hover:underline underline-offset-4">
                          {d.sellerName ?? "—"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[360px] truncate">{d.notes ?? "—"}</td>
                    <td className="t-right num t-strong">{d.units}</td>
                    <td className="t-right num">{formatCOP(d.totalCost)}</td>
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
