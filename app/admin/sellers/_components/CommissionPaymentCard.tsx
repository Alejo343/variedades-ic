"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCOP } from "../../_lib/format";

type Account = { id: number; name: string };
type Payment = { id: number; periodDate: string; saleCount: number; totalCommission: number; paidAt: string; accountName: string | null };

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function errorMessage(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  const err = data.error;
  if (typeof err === "string") return err;
  const first = err?.formErrors?.[0] ?? Object.values(err?.fieldErrors ?? {}).flat()[0];
  return typeof first === "string" ? first : "Error al guardar";
}

// A store seller's commissions: pay everything still unpaid up to a date (an
// expense from the chosen account), and the history of past payments.
export function CommissionPaymentCard({
  sellerId,
  accounts,
  payments,
}: {
  sellerId: number;
  accounts: Account[];
  payments: Payment[];
}) {
  const router = useRouter();
  const [periodDate, setPeriodDate] = useState(todayLocal);
  const [accountId, setAccountId] = useState<number | null>(accounts[0]?.id ?? null);
  const [preview, setPreview] = useState<{ saleCount: number; totalCommission: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(periodDate);

  useEffect(() => {
    if (!validDate) return;
    let cancelled = false;
    fetch(`/api/admin/sellers/${sellerId}/commission-payments?periodDate=${periodDate}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setPreview(data);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId, periodDate, validDate, payments.length]);

  async function pay() {
    if (!accountId || !preview) return;
    setLoading(true);
    setError("");
    setNotice("");
    const res = await fetch(`/api/admin/sellers/${sellerId}/commission-payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodDate, accountId }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(await errorMessage(res));
      return;
    }
    setNotice(`Pagado ${formatCOP(preview.totalCommission)}.`);
    router.refresh();
  }

  const pending = validDate ? preview : null;

  return (
    <div className="adm-card p-5 flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-[15px]">Pagar comisiones</h3>
        <p className="text-[12.5px] text-[var(--adm-ink-3)]">
          Paga todas las comisiones pendientes de sus ventas hasta la fecha. Sale como un gasto de la cuenta elegida.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="adm-label">Hasta</label>
          <input type="date" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} className="adm-input" />
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

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="adm-eyebrow">Pendiente</p>
          <p className="num text-[20px] font-semibold">{formatCOP(pending?.totalCommission ?? 0)}</p>
          <p className="text-[12px] text-[var(--adm-ink-3)]">
            {pending ? `${pending.saleCount} ${pending.saleCount === 1 ? "venta" : "ventas"}` : "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={pay}
          disabled={loading || !accountId || !pending || pending.totalCommission <= 0}
          className="adm-btn adm-btn-primary"
        >
          {loading ? "Pagando..." : "Pagar comisiones"}
        </button>
      </div>

      {error && <p className="adm-alert adm-alert-danger">{error}</p>}
      {notice && <p className="adm-alert adm-alert-ok">{notice}</p>}

      {payments.length > 0 && (
        <ul className="divide-y divide-[#f0ede6] border-t border-[var(--adm-line)]">
          {payments.slice(0, 6).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="text-[13.5px]">Hasta {p.periodDate}</p>
                <p className="text-[12px] text-[var(--adm-ink-3)]">
                  {p.saleCount} {p.saleCount === 1 ? "venta" : "ventas"} · {p.accountName ?? "—"}
                </p>
              </div>
              <span className="num font-semibold text-[14px]">{formatCOP(p.totalCommission)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
