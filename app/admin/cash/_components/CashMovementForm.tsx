"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import type { CashAccount } from "@/lib/db/schema";

type Kind = "gasto" | "ingreso" | "ajuste";

export function CashMovementForm({ accounts }: { accounts: CashAccount[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("gasto");
  // Direction of an adjustment: add to or take from the balance.
  const [adjustDirection, setAdjustDirection] = useState<"ingreso" | "gasto">("ingreso");
  const [amount, setAmount] = useState(0);
  const [concept, setConcept] = useState("");
  const [accountId, setAccountId] = useState<number | "">(accounts[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isAdjustment = kind === "ajuste";
  const type = isAdjustment ? adjustDirection : kind;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (accountId === "") {
      setError("Selecciona una cuenta");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");

    const res = await fetch("/api/admin/cash-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount, concept, accountId, adjustment: isAdjustment }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "Error al registrar el movimiento");
      return;
    }

    setAmount(0);
    setConcept("");
    setNotice(isAdjustment ? "Ajuste registrado. El saldo se actualizó sin afectar los reportes." : "Movimiento registrado.");
    router.refresh();
  }

  const placeholder = isAdjustment
    ? adjustDirection === "ingreso"
      ? "Ej. Saldo inicial de caja"
      : "Ej. Faltante en el arqueo"
    : kind === "gasto"
      ? "Ej. Pago de arriendo"
      : "Ej. Aporte de capital";

  const submitLabel = isAdjustment
    ? adjustDirection === "ingreso"
      ? "Sumar al saldo"
      : "Restar del saldo"
    : kind === "gasto"
      ? "Registrar gasto"
      : "Registrar ingreso";

  return (
    <form onSubmit={handleSubmit} className="adm-card p-5 flex flex-col gap-4">
      <div>
        <h2 className="adm-card-title">Registrar movimiento</h2>
        <p className="adm-card-desc">Ingresos o gastos sueltos, o un ajuste del saldo.</p>
      </div>
      <div className="adm-seg w-full [&>*]:flex-1 [&>*]:justify-center">
        <button type="button" data-active={kind === "gasto"} onClick={() => setKind("gasto")}>
          Gasto
        </button>
        <button type="button" data-active={kind === "ingreso"} onClick={() => setKind("ingreso")}>
          Ingreso
        </button>
        <button type="button" data-active={kind === "ajuste"} onClick={() => setKind("ajuste")}>
          Ajuste
        </button>
      </div>

      {isAdjustment && (
        <>
          <div className="adm-alert adm-alert-info">
            <Info />
            <span>
              <strong>Ajuste de caja:</strong> cambia el saldo pero <strong>no cuenta como ingreso ni gasto</strong> en Caja ni en
              Reportes. Úsalo para el dinero que ya tenías al empezar a usar el sistema, o para cuadrar diferencias del arqueo.
            </span>
          </div>
          <div>
            <label className="adm-label">El ajuste…</label>
            <div className="adm-seg w-full [&>*]:flex-1 [&>*]:justify-center">
              <button type="button" data-active={adjustDirection === "ingreso"} onClick={() => setAdjustDirection("ingreso")}>
                + Suma al saldo
              </button>
              <button type="button" data-active={adjustDirection === "gasto"} onClick={() => setAdjustDirection("gasto")}>
                − Resta del saldo
              </button>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="adm-label">Monto</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--adm-ink-3)] text-sm">$</span>
          <input
            type="number"
            min={1}
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0"
            required
            className="adm-input num pl-7 text-[16px] h-11"
          />
        </div>
      </div>
      <div>
        <label className="adm-label">Cuenta</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : "")}
          required
          className="adm-input"
        >
          <option value="">Selecciona…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="adm-label">Concepto</label>
        <input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder={placeholder} required className="adm-input" />
      </div>
      {error && <p className="adm-alert adm-alert-danger">{error}</p>}
      {notice && <p className="adm-alert adm-alert-ok">{notice}</p>}
      <button
        type="submit"
        disabled={loading}
        className={`adm-btn ${isAdjustment ? "adm-btn-brand" : kind === "gasto" ? "adm-btn-primary" : "adm-btn-ok"}`}
      >
        {loading ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
