import Link from "next/link";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Building2, Scale, Settings2, Wallet } from "lucide-react";
import { isBusinessCashMovement, isCashAdjustment, isCashTransfer, summarizeCashFlow } from "@/lib/domain/cash";
import { getAllCashMovements, getCashBalance } from "@/lib/db/queries/cash";
import { getActiveCashAccounts, getCashAccountsWithBalances } from "@/lib/db/queries/cash-accounts";
import { CashMovementForm, type CashFormKind } from "./_components/CashMovementForm";
import { ButtonLink, Card, FilterTabs, Page, PageHeader } from "../_components/ui";
import { formatCOP, formatDateTime, todayInBogota } from "../_lib/format";

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  settlement: "Liquidación",
  sales_order: "Pedido WhatsApp",
  direct_sale: "Venta en local",
  purchase_payment: "Pago a distribuidor",
  commission_payment: "Pago de comisiones",
  ajuste: "Ajuste de caja",
  transferencia: "Transferencia",
};

export default async function CashPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; account?: string; form?: string }>;
}) {
  const { type = "", account = "", form = "" } = await searchParams;
  const initialKind: CashFormKind = form === "transferencia" ? "transferencia" : "gasto";
  const [movements, balance, accounts, accountBalances] = await Promise.all([
    getAllCashMovements(),
    getCashBalance(),
    getActiveCashAccounts(),
    getCashAccountsWithBalances(),
  ]);

  const month = todayInBogota().slice(0, 7);
  const monthOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d).slice(0, 7);
  const thisMonth = movements.filter((m) => monthOf(new Date(m.movementDate)) === month);
  const { income, expense, adjustments } = summarizeCashFlow(thisMonth);

  // Ingresos/Gastos tabs show business movements only; adjustments and
  // transfers have their own tabs.
  const matchesType = (m: (typeof movements)[number]) =>
    !type ||
    (type === "ajuste"
      ? isCashAdjustment(m)
      : type === "transferencia"
        ? isCashTransfer(m)
        : isBusinessCashMovement(m) && m.type === type);
  const rows = movements.filter((m) => matchesType(m) && (!account || String(m.accountId) === account));

  return (
    <Page>
      <PageHeader
        eyebrow="Finanzas"
        title="Caja"
        description="Cada peso que entra o sale, por cuenta. El saldo se calcula a partir de los movimientos."
        actions={
          <>
            <ButtonLink href="/admin/cash?form=transferencia#registrar" icon={ArrowLeftRight} variant="brand">
              Transferir entre cuentas
            </ButtonLink>
            <ButtonLink href="/admin/cash/accounts" icon={Settings2}>
              Gestionar cuentas
            </ButtonLink>
          </>
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
            <p className="relative mt-6 mb-2 text-[11px] uppercase tracking-[.14em] text-slate-500 font-semibold">Este mes</p>
            <div className="relative flex flex-wrap gap-x-6 gap-y-3 text-[13px]">
              <div>
                <p className="text-slate-400 flex items-center gap-1">
                  <ArrowDownLeft size={14} className="text-emerald-400" /> Ingresos
                </p>
                <p className="num font-semibold mt-0.5">{formatCOP(income)}</p>
              </div>
              <div>
                <p className="text-slate-400 flex items-center gap-1">
                  <ArrowUpRight size={14} className="text-rose-400" /> Gastos
                </p>
                <p className="num font-semibold mt-0.5">{formatCOP(expense)}</p>
              </div>
              {adjustments !== 0 && (
                <div>
                  <p className="text-slate-400 flex items-center gap-1">
                    <Scale size={14} className="text-sky-300" /> Ajustes
                  </p>
                  <p className="num font-semibold mt-0.5">
                    {adjustments > 0 ? "+" : "−"}
                    {formatCOP(Math.abs(adjustments))}
                  </p>
                </div>
              )}
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
                { value: "ajuste", label: "Ajustes" },
                { value: "transferencia", label: "Transferencias" },
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
                  {rows.map((m) => {
                    const adj = isCashAdjustment(m);
                    const transfer = isCashTransfer(m);
                    const neutral = adj || transfer;
                    return (
                    <tr key={m.id}>
                      <td className="whitespace-nowrap">{formatDateTime(m.movementDate)}</td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${
                              neutral
                                ? "bg-[var(--adm-brand-soft)] text-[var(--adm-brand)]"
                                : m.type === "ingreso"
                                  ? "bg-[var(--adm-ok-soft)] text-[var(--adm-ok)]"
                                  : "bg-[var(--adm-danger-soft)] text-[var(--adm-danger)]"
                            }`}
                          >
                            {transfer ? (
                              <ArrowLeftRight size={14} />
                            ) : adj ? (
                              <Scale size={14} />
                            ) : m.type === "ingreso" ? (
                              <ArrowDownLeft size={14} />
                            ) : (
                              <ArrowUpRight size={14} />
                            )}
                          </span>
                          <span className="t-strong">{m.concept}</span>
                        </div>
                      </td>
                      <td>{m.accountName ?? "—"}</td>
                      <td className="text-[13px]">
                        {neutral ? (
                          <span className="adm-badge adm-badge-info adm-badge-plain" title="No cuenta como ingreso ni gasto">
                            {transfer ? "Transferencia" : "Ajuste de caja"}
                          </span>
                        ) : m.sourceType ? (
                          (SOURCE_LABELS[m.sourceType] ?? m.sourceType)
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        className={`t-right num font-semibold whitespace-nowrap ${
                          neutral ? "text-[var(--adm-brand)]" : m.type === "ingreso" ? "text-[var(--adm-ok)]" : "text-[var(--adm-ink)]"
                        }`}
                      >
                        {m.type === "ingreso" ? "+" : "−"}
                        {formatCOP(m.amount)}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div id="registrar" className="xl:sticky xl:top-24 scroll-mt-24">
          {/* key: the header's "Transferir" link must reset the form to that kind. */}
          <CashMovementForm key={initialKind} accounts={accounts} initialKind={initialKind} />
        </div>
      </div>
    </Page>
  );
}
