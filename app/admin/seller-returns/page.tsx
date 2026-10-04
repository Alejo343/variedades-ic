import Link from "next/link";
import { Plus, Undo2 } from "lucide-react";
import { getAllSellerReturns } from "@/lib/db/queries/seller-returns";
import { ButtonLink, EmptyState, Page, PageHeader } from "../_components/ui";
import { formatDateTime } from "../_lib/format";

export default async function SellerReturnsPage() {
  const returns = await getAllSellerReturns();

  return (
    <Page>
      <PageHeader
        eyebrow="Vendedores"
        title="Devoluciones"
        description="Mercancía que un vendedor regresa: sale de su inventario y vuelve al principal."
        actions={
          <ButtonLink href="/admin/seller-returns/new" variant="primary" icon={Plus}>
            Nueva devolución
          </ButtonLink>
        }
      />

      <div className="adm-card overflow-hidden">
        {returns.length === 0 ? (
          <EmptyState icon={Undo2} title="No hay devoluciones registradas" />
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
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.id}>
                    <td className="num text-[var(--adm-ink-3)]">#{r.id}</td>
                    <td className="whitespace-nowrap">{formatDateTime(r.returnDate)}</td>
                    <td className="t-strong">
                      <Link href={`/admin/sellers/${r.sellerId}`} className="hover:underline underline-offset-4">
                        {r.sellerName ?? "—"}
                      </Link>
                    </td>
                    <td className="max-w-[360px] truncate">{r.notes ?? "—"}</td>
                    <td className="t-right num t-strong">{r.units}</td>
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
