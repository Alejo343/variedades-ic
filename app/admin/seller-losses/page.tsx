import Link from "next/link";
import { Plus, ShieldAlert } from "lucide-react";
import { getAllSellerLosses } from "@/lib/db/queries/seller-losses";
import { ButtonLink, EmptyState, Page, PageHeader, Stat, StatusBadge } from "../_components/ui";
import { formatCOP, formatDateTime } from "../_lib/format";

export default async function SellerLossesPage() {
  const losses = await getAllSellerLosses();
  const byType = (t: string) => losses.filter((l) => l.type === t).reduce((s, l) => s + l.totalCost, 0);

  return (
    <Page>
      <PageHeader
        eyebrow="Vendedores"
        title="Pérdidas, daños y robos"
        description="Lo reporta el vendedor y lo asume él: se cobra a costo en su próxima liquidación."
        actions={
          <ButtonLink href="/admin/seller-losses/new" variant="primary" icon={Plus}>
            Nuevo registro
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Pérdidas" value={formatCOP(byType("perdida"))} tone="warn" />
        <Stat label="Daños" value={formatCOP(byType("dano"))} tone="violet" />
        <Stat label="Robos" value={formatCOP(byType("robo"))} tone="danger" />
      </div>

      <div className="adm-card overflow-hidden">
        {losses.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No hay registros" description="Ninguna pérdida, daño o robo reportado." />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Vendedor</th>
                  <th>Tipo</th>
                  <th>Notas</th>
                  <th className="t-right">Unidades</th>
                  <th className="t-right">Costo</th>
                </tr>
              </thead>
              <tbody>
                {losses.map((l) => (
                  <tr key={l.id}>
                    <td className="num text-[var(--adm-ink-3)]">#{l.id}</td>
                    <td className="whitespace-nowrap">{formatDateTime(l.lossDate)}</td>
                    <td className="t-strong">
                      <Link href={`/admin/sellers/${l.sellerId}`} className="hover:underline underline-offset-4">
                        {l.sellerName ?? "—"}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge kind="loss" status={l.type} />
                    </td>
                    <td className="max-w-[300px] truncate">{l.notes ?? "—"}</td>
                    <td className="t-right num">{l.units}</td>
                    <td className="t-right num t-strong">{formatCOP(l.totalCost)}</td>
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
