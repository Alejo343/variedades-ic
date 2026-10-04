import Link from "next/link";
import { Building2, Plus, Wallet } from "lucide-react";
import { getCashAccountsWithBalances } from "@/lib/db/queries/cash-accounts";
import { Badge, ButtonLink, EmptyState, Page, PageHeader } from "../../_components/ui";
import { formatCOP } from "../../_lib/format";

export default async function CashAccountsPage() {
  const accounts = await getCashAccountsWithBalances();

  return (
    <Page>
      <PageHeader
        back={{ href: "/admin/cash", label: "Caja" }}
        eyebrow="Finanzas"
        title="Cuentas de caja"
        description="Dónde está el dinero: efectivo, Nequi, banco… Cada movimiento de caja pertenece a una cuenta."
        actions={
          <ButtonLink href="/admin/cash/accounts/new" variant="primary" icon={Plus}>
            Nueva cuenta
          </ButtonLink>
        }
      />

      {accounts.length === 0 ? (
        <div className="adm-card">
          <EmptyState icon={Wallet} title="No hay cuentas registradas" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <Link
              key={a.id}
              href={`/admin/cash/accounts/${a.id}/edit`}
              className={`adm-card p-5 transition hover:shadow-md hover:border-[var(--adm-line-strong)] ${a.active ? "" : "opacity-60"}`}
            >
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl grid place-items-center bg-[#f0ede6] text-[var(--adm-ink-2)]">
                  {a.type === "banco" ? <Building2 size={18} /> : <Wallet size={18} />}
                </span>
                {a.active ? <Badge tone="ok">Activa</Badge> : <Badge>Inactiva</Badge>}
              </div>
              <p className="mt-4 font-semibold text-[16px]">{a.name}</p>
              <p className="text-[12.5px] text-[var(--adm-ink-3)] capitalize">{a.type}</p>
              <p className={`num text-[24px] font-semibold mt-4 ${a.balance < 0 ? "text-[var(--adm-danger)]" : ""}`}>{formatCOP(a.balance)}</p>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
