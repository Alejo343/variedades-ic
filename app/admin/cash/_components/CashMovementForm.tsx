"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Info } from "lucide-react";
import type { CashAccount } from "@/lib/db/schema";

export type CashFormKind = "gasto" | "ingreso" | "ajuste" | "transferencia";

export function CashMovementForm({ accounts, initialKind = "gasto" }: { accounts: CashAccount[]; initialKind?: CashFormKind }) {
  const router = useRouter();
  const [kind, setKind] = useState<CashFormKind>(initialKind);
  // Direction of an adjustment: add to or take from the balance.
  const [adjustDirection, setAdjustDirection] = useState<"ingreso" | "gasto">("ingreso");
  const [amount, setAmount] = useState(0);
  const [concept, setConcept] = useState("");
  const [accountId, setAccountId] = useState<number | "">(accounts[0]?.id ?? "");
  // Destination of a transfer (accountId is the origin).
  const [toAccountId, setToAccountId] = useState<number | "">(accounts[1]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isAdjustment = kind === "ajuste";
  const isTransfer = kind === "transferencia";
  const type = isAdjustment ? adjustDirection : kind;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (accountId === "") {
      setError("Selecciona una cuenta");
      return;
    }
    if (isTransfer && toAccountId === "") {
      setError("Selecciona la cuenta de destino");
      return;
    }
    if (isTransfer && toAccountId === accountId) {
      setError("La cuenta de origen y la de destino deben ser distintas");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");

    const res = isTransfer
      ? await fetch("/api/admin/cash-transfers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromAccountId: accountId, toAccountId, amount, notes: concept || undefined }),
        })
      : await fetch("/api/admin/cash-movements", {
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
    setNotice(
      isTransfer
        ? "Transferencia registrada. Cada cuenta se actualizó; no cuenta como ingreso ni gasto."
        : isAdjustment
          ? "Ajuste registrado. El saldo se actualizó sin afectar los reportes."
          : "Movimiento registrado.",
    );
    router.refresh();
  }

  const placeholder = isTransfer
    ? "Ej. Consignación al banco"
    : isAdjustment
    ? adjustDirection === "ingreso"
      ? "Ej. Saldo inicial de caja"
      : "Ej. Faltante en el arqueo"
    : kind === "gasto"
      ? "Ej. Pago de arriendo"
      : "Ej. Aporte de capital";

  const submitLabel = isTransfer
    ? "Transferir"
    : isAdjustment
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
        <p className="adm-card-desc">Ingresos o gastos sueltos, un ajuste del saldo o dinero que pasa de una cuenta a otra.</p>
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
        <button type="button" data-active={kind === "transferencia"} onClick={() => setKind("transferencia")}>
          Transferir
        </button>
      </div>

      {isTransfer && (
        <div className="adm-alert adm-alert-info">
          <ArrowLeftRight />
          <span>
            <strong>Transferencia:</strong> el dinero sale de una cuenta y entra a otra. El saldo total no cambia y{" "}
            <strong>no cuenta como ingreso ni gasto</strong>.
          </span>
        </div>
      )}

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
        <label className="adm-label">{isTransfer ? "Sale de" : "Cuenta"}</label>
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
      {isTransfer && (
        <div>
          <label className="adm-label">Entra a</label>
          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value ? Number(e.target.value) : "")}
            required
            className="adm-input"
          >
            <option value="">Selecciona…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === accountId}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="adm-label">{isTransfer ? "Nota (opcional)" : "Concepto"}</label>
        <input
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder={placeholder}
          required={!isTransfer}
          className="adm-input"
        />
      </div>
      {error && <p className="adm-alert adm-alert-danger">{error}</p>}
      {notice && <p className="adm-alert adm-alert-ok">{notice}</p>}
      <button
        type="submit"
        disabled={loading}
        className={`adm-btn ${isAdjustment || isTransfer ? "adm-btn-brand" : kind === "gasto" ? "adm-btn-primary" : "adm-btn-ok"}`}
      >
        {loading ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
