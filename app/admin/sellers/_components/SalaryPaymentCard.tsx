"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSalaryPeriod, salaryPeriods, SALARY_PERIOD_LABEL, type SalaryPeriod } from "@/lib/domain/salary";
import { formatCOP } from "../../_lib/format";

type Account = { id: number; name: string };
type Payment = { id: number; period: string; periodStart: string; amount: number; paidAt: string; notes: string | null; accountName: string | null };

async function errorMessage(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  const err = data.error;
  if (typeof err === "string") return err;
  const first = err?.formErrors?.[0] ?? Object.values(err?.fieldErrors ?? {}).flat()[0];
  return typeof first === "string" ? first : "Error al guardar";
}

// A salaried store seller: pay one unpaid period (amount editable, an expense
// from the chosen account), and the history of past payments.
export function SalaryPaymentCard({
  sellerId,
  salaryAmount,
  salaryPeriod,
  salaryStartDate,
  today,
  accounts,
  payments,
}: {
  sellerId: number;
  salaryAmount: number;
  salaryPeriod: SalaryPeriod;
  salaryStartDate: string;
  // The business's local day (America/Bogota), computed by the server.
  today: string;
  accounts: Account[];
  payments: Payment[];
}) {
  const router = useRouter();
  const paidStarts = payments.filter((p) => p.period === salaryPeriod).map((p) => p.periodStart);
  const unpaid = salaryPeriods(salaryStartDate, salaryPeriod, today, paidStarts).filter((p) => !p.paid);
  const owed = unpaid.filter((p) => p.ended);

  const [periodStart, setPeriodStart] = useState(unpaid[0]?.start ?? "");
  const [amount, setAmount] = useState(String(salaryAmount));
  const [accountId, setAccountId] = useState<number | null>(accounts[0]?.id ?? null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const value = Number(amount.replace(/\D/g, "")) || 0;
  // After a payment the list changes: fall back to the oldest unpaid period.
  const selected = unpaid.some((p) => p.start === periodStart) ? periodStart : (unpaid[0]?.start ?? "");

  async function pay() {
    if (!accountId || !selected || value <= 0) return;
    setLoading(true);
    setError("");
    setNotice("");
    const res = await fetch(`/api/admin/sellers/${sellerId}/salary-payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period: salaryPeriod, periodStart: selected, amount: value, accountId, notes: notes.trim() || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(await errorMessage(res));
      return;
    }
    setNotice(`Pagado ${formatCOP(value)} · ${formatSalaryPeriod(selected, salaryPeriod)}.`);
    setNotes("");
    setAmount(String(salaryAmount));
    router.refresh();
  }

  return (
    <div className="adm-card p-5 flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-[15px]">Pagar sueldo</h3>
        <p className="text-[12.5px] text-[var(--adm-ink-3)]">
          Sueldo {SALARY_PERIOD_LABEL[salaryPeriod]} de {formatCOP(salaryAmount)}. Cada pago cubre un período y sale como un gasto de la
          cuenta elegida.
        </p>
      </div>

      {owed.length > 0 && (
        <p className="adm-alert adm-alert-warn">
          {owed.length === 1 ? "1 período terminado sin pagar" : `${owed.length} períodos terminados sin pagar`}: ≈{" "}
          {formatCOP(owed.length * salaryAmount)}.
        </p>
      )}

      {unpaid.length === 0 ? (
        <p className="text-sm text-[var(--adm-ink-3)]">Está al día: no hay períodos sin pagar.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="adm-label">Período</label>
              <select value={selected} onChange={(e) => setPeriodStart(e.target.value)} className="adm-input">
                {unpaid.map((p) => (
                  <option key={p.start} value={p.start}>
                    {formatSalaryPeriod(p.start, salaryPeriod)}
                    {p.ended ? "" : " (en curso)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="adm-label">Valor</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" className="adm-input num" />
            </div>
            <div>
              <label className="adm-label">Pagar desde</label>
              <select value={accountId ?? ""} onChange={(e) => setAccountId(Number(e.target.value))} className="adm-input">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="adm-label">Nota</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional (adelanto, descuento, bono…)"
              className="adm-input"
            />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={pay} disabled={loading || !accountId || value <= 0} className="adm-btn adm-btn-primary">
              {loading ? "Pagando..." : `Pagar ${formatCOP(value)}`}
            </button>
          </div>
        </>
      )}

      {error && <p className="adm-alert adm-alert-danger">{error}</p>}
      {notice && <p className="adm-alert adm-alert-ok">{notice}</p>}

      {payments.length > 0 && (
        <ul className="divide-y divide-[#f0ede6] border-t border-[var(--adm-line)]">
          {payments.slice(0, 8).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="text-[13.5px]">{formatSalaryPeriod(p.periodStart, p.period as SalaryPeriod)}</p>
                <p className="text-[12px] text-[var(--adm-ink-3)]">
                  {p.accountName ?? "—"}
                  {p.notes ? ` · ${p.notes}` : ""}
                </p>
              </div>
              <span className="num font-semibold text-[14px]">{formatCOP(p.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
