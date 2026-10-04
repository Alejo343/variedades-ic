"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CashAccount } from "@/lib/db/schema";

export function CashMovementForm({ accounts }: { accounts: CashAccount[] }) {
  const router = useRouter();
  const [type, setType] = useState<"ingreso" | "gasto">("gasto");
  const [amount, setAmount] = useState(0);
  const [concept, setConcept] = useState("");
  const [accountId, setAccountId] = useState<number | "">(accounts[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (accountId === "") {
      setError("Selecciona una cuenta");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/cash-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount, concept, accountId }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "Error al registrar el movimiento");
      return;
    }

    setAmount(0);
    setConcept("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="adm-card p-5 flex flex-col gap-4">
      <div>
        <h2 className="adm-card-title">Registrar movimiento</h2>
        <p className="adm-card-desc">Ingresos o gastos sueltos (arriendo, servicios, aportes…)</p>
      </div>
      <div className="adm-seg w-full [&>*]:flex-1 [&>*]:justify-center">
        <button type="button" data-active={type === "gasto"} onClick={() => setType("gasto")}>
          Gasto
        </button>
        <button type="button" data-active={type === "ingreso"} onClick={() => setType("ingreso")}>
          Ingreso
        </button>
      </div>
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
        <input
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder={type === "gasto" ? "Ej. Pago de arriendo" : "Ej. Aporte de capital"}
          required
          className="adm-input"
        />
      </div>
      {error && <p className="adm-alert adm-alert-danger">{error}</p>}
      <button type="submit" disabled={loading} className={`adm-btn ${type === "gasto" ? "adm-btn-primary" : "adm-btn-ok"}`}>
        {loading ? "Guardando…" : type === "gasto" ? "Registrar gasto" : "Registrar ingreso"}
      </button>
    </form>
  );
}
