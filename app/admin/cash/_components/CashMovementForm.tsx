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
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3"
    >
      <h2 className="text-sm font-semibold text-gray-700">Registrar movimiento</h2>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "ingreso" | "gasto")}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : "")}
          required
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Cuenta...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Monto (COP)"
          required
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Concepto"
          required
          className="sm:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}
