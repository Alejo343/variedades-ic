import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Building2, Settings2, Wallet } from "lucide-react";
import { getAllCashMovements, getCashBalance } from "@/lib/db/queries/cash";
import { getActiveCashAccounts, getCashAccountsWithBalances } from "@/lib/db/queries/cash-accounts";
import { CashMovementForm } from "./_components/CashMovementForm";
import { ButtonLink, Card, FilterTabs, Page, PageHeader } from "../_components/ui";
import { formatCOP, formatDateTime, todayInBogota } from "../_lib/format";

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  settlement: "Liquidación",
  sales_order: "Pedido WhatsApp",
  direct_sale: "Venta en local",
  purchase_payment: "Pago a distribuidor",
};

export default async function CashPage({ searchParams }: { searchParams: Promise<{ type?: string; account?: string }> }) {
  const { type = "", account = "" } = await searchParams;
  const [movements, balance, accounts, accountBalances] = await Promise.all([
    getAllCashMovements(),
    getCashBalance(),
    getActiveCashAccounts(),
    getCashAccountsWithBalances(),
  ]);

  const month = todayInBogota().slice(0, 7);
  const monthOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d).slice(0, 7);
  const thisMonth = movements.filter((m) => monthOf(new Date(m.movementDate)) === month);
  const income = thisMonth.filter((m) => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
  const expense = thisMonth.filter((m) => m.type === "gasto").reduce((s, m) => s + m.amount, 0);

  const rows = movements.filter((m) => (!type || m.type === type) && (!account || String(m.accountId) === account));

  return (
    <Page>
      <PageHeader
        eyebrow="Finanzas"
        title="Caja"
        description="Cada peso que entra o sale, por cuenta. El saldo se calcula a partir de los movimientos."
        actions={
          <ButtonLink href="/admin/cash/accounts" icon={Settings2}>
            Gestionar cuentas
          </ButtonLink>
        }
      />

      {/* Balance hero */}
      <div className="adm-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,1fr)_2fr]">
          <div className="p-6 bg-[#16171b] text-white relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-60"
              style={{ background: "radial-gradient(80% 80% at 100% 0%, rgba(14,165,233,.35), transparent 60%)" }}
              aria-hidden
            />
            <p className="relative text-[12px] uppercase tracking-[.14em] text-slate-400 font-semibold">Saldo total</p>
            <p className={`relative num text-[36px] font-semibold mt-2 leading-none ${balance < 0 ? "text-red-300" : ""}`}>
              {formatCOP(balance)}
            </p>
            <div className="relative flex gap-6 mt-6 text-[13px]">
              <div>
                <p className="text-slate-400 flex items-center gap-1">
                  <ArrowDownLeft size={14} className="text-emerald-400" /> Ingresos del mes
                </p>
                <p className="num font-semibold mt-0.5">{formatCOP(income)}</p>
              </div>
              <div>
                <p className="text-slate-400 flex items-center gap-1">
                  <ArrowUpRight size={14} className="text-rose-400" /> Gastos del mes
                </p>
                <p className="num font-semibold mt-0.5">{formatCOP(expense)}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 divide-y sm:divide-y-0 divide-[var(--adm-line)]">
            {accountBalances.map((a) => (
              <Link
                key={a.id}
                href={account === String(a.id) ? "/admin/cash" : `/admin/cash?account=${a.id}`}
                scroll={false}
                className={`p-5 sm:border-l border-[var(--adm-line)] hover:bg-[var(--adm-surface-2)] transition ${
                  account === String(a.id) ? "bg-[var(--adm-brand-soft)]" : ""
                } ${a.active ? "" : "opacity-55"}`}
              >
                <div className="flex items-center gap-2 text-[13px] text-[var(--adm-ink-2)]">
                  {a.type === "banco" ? <Building2 size={15} /> : <Wallet size={15} />}
                  <span className="truncate">{a.name}</span>
                  {!a.active && <span className="text-[11px]">(inactiva)</span>}
                </div>
                <p className={`num text-[20px] font-semibold mt-2 ${a.balance < 0 ? "text-[var(--adm-danger)]" : ""}`}>
                  {formatCOP(a.balance)}
                </p>
                <p className="text-[12px] text-[var(--adm-ink-3)] capitalize">{a.type}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
        <Card
          title="Movimientos"
          description={account ? `Filtrado por ${accountBalances.find((a) => String(a.id) === account)?.name ?? "cuenta"}` : "Todas las cuentas"}
          flush
        >
          <div className="p-4 border-b border-[var(--adm-line)]">
            <FilterTabs
              basePath="/admin/cash"
              keep={{ account }}
              param="type"
              current={type}
              options={[
                { value: "", label: "Todos" },
                { value: "ingreso", label: "Ingresos" },
                { value: "gasto", label: "Gastos" },
              ]}
            />
          </div>
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[var(--adm-ink-3)]">Sin movimientos.</p>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Cuenta</th>
                    <th>Origen</th>
                    <th className="t-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.id}>
                      <td className="whitespace-nowrap">{formatDateTime(m.movementDate)}</td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${
                              m.type === "ingreso"
                                ? "bg-[var(--adm-ok-soft)] text-[var(--adm-ok)]"
                                : "bg-[var(--adm-danger-soft)] text-[var(--adm-danger)]"
                            }`}
                          >
                            {m.type === "ingreso" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                          </span>
                          <span className="t-strong">{m.concept}</span>
                        </div>
                      </td>
                      <td>{m.accountName ?? "—"}</td>
                      <td className="text-[13px]">{m.sourceType ? (SOURCE_LABELS[m.sourceType] ?? m.sourceType) : "—"}</td>
                      <td
                        className={`t-right num font-semibold whitespace-nowrap ${
                          m.type === "ingreso" ? "text-[var(--adm-ok)]" : "text-[var(--adm-ink)]"
                        }`}
                      >
                        {m.type === "ingreso" ? "+" : "−"}
                        {formatCOP(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="xl:sticky xl:top-24">
          <CashMovementForm accounts={accounts} />
        </div>
      </div>
    </Page>
  );
}
