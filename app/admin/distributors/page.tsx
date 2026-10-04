import Link from "next/link";
import { MapPin, Phone, Plus, Truck } from "lucide-react";
import { getAllDistributors } from "@/lib/db/queries/distributors";
import { getAccountsPayableSummary } from "@/lib/db/queries/purchase-payments";
import { Badge, ButtonLink, EmptyState, Page, PageHeader, Stat } from "../_components/ui";
import { formatCOP } from "../_lib/format";

export default async function DistributorsPage() {
  const [distributors, payableBalances] = await Promise.all([getAllDistributors(), getAccountsPayableSummary()]);
  const totalPayable = [...payableBalances.values()].reduce((s, v) => s + v, 0);

  return (
    <Page>
      <PageHeader
        eyebrow="Compras"
        title="Distribuidores"
        description="Proveedores a los que les compras mercancía, con su saldo pendiente de compras a crédito."
        actions={
          <ButtonLink href="/admin/distributors/new" variant="primary" icon={Plus}>
            Nuevo distribuidor
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat label="Distribuidores activos" value={distributors.filter((d) => d.active).length} icon={Truck} tone="info" />
        <Stat
          label="Total por pagar"
          value={formatCOP(totalPayable)}
          valueTone={totalPayable > 0 ? "warn" : "neutral"}
          hint={payableBalances.size > 0 ? `Con ${payableBalances.size} proveedores` : "Sin deudas"}
          tone="warn"
        />
      </div>

      <div className="adm-card overflow-hidden">
        {distributors.length === 0 ? (
          <EmptyState icon={Truck} title="No hay distribuidores registrados" description="Agrega a tus proveedores para registrar pedidos de compra." />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th className="t-right">Saldo pendiente</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {distributors.map((d) => {
                  const pending = payableBalances.get(d.id);
                  return (
                    <tr key={d.id}>
                      <td className="t-strong">{d.name}</td>
                      <td>
                        <div className="flex flex-col gap-0.5 text-[13px]">
                          {d.city && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={13} className="text-[var(--adm-ink-3)]" />
                              {d.city}
                            </span>
                          )}
                          {d.phone && (
                            <span className="inline-flex items-center gap-1.5 num">
                              <Phone size={13} className="text-[var(--adm-ink-3)]" />
                              {d.phone}
                            </span>
                          )}
                          {!d.city && !d.phone && "—"}
                        </div>
                      </td>
                      <td>{d.active ? <Badge tone="ok">Activo</Badge> : <Badge>Inactivo</Badge>}</td>
                      <td className="t-right num">
                        {pending ? <span className="font-semibold text-[var(--adm-warn)]">{formatCOP(pending)}</span> : "—"}
                      </td>
                      <td className="t-right">
                        <Link href={`/admin/distributors/${d.id}/edit`} className="adm-link text-[13px]">
                          Editar
                        </Link>
                      </td>
                    </tr>
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
