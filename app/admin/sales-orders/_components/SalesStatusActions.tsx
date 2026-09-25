"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: number; name: string };

const NEXT_STATUS: Record<string, { label: string; status: string; style: string }[]> = {
  pendiente: [
    { label: "Confirmar pedido", status: "confirmado", style: "bg-blue-600 hover:bg-blue-700 text-white" },
    { label: "Cancelar", status: "cancelado", style: "bg-red-100 hover:bg-red-200 text-red-700" },
  ],
  confirmado: [
    { label: "Marcar entregado", status: "entregado", style: "bg-green-600 hover:bg-green-700 text-white" },
    { label: "Cancelar", status: "cancelado", style: "bg-red-100 hover:bg-red-200 text-red-700" },
  ],
};

export function SalesStatusActions({
  orderId,
  status,
  accounts,
}: {
  orderId: number;
  status: string;
  accounts: Account[];
}) {
  const router = useRouter();
  const [accountId, setAccountId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const actions = NEXT_STATUS[status];
  if (!actions) return null;

  async function changeStatus(newStatus: string) {
    if (newStatus === "confirmado" && accountId === "") {
      setError("Selecciona la cuenta para el ingreso");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/sales-orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        newStatus === "confirmado" ? { status: newStatus, accountId } : { status: newStatus },
      ),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al actualizar");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {status === "pendiente" && (
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : "")}
          className="w-56 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Cuenta para el ingreso...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2 flex-wrap">
        {actions.map((a) => (
          <button
            key={a.status}
            onClick={() => changeStatus(a.status)}
            disabled={loading || (a.status === "confirmado" && accountId === "")}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60 ${a.style}`}
          >
            {a.label}
          </button>
        ))}
        {error && <p className="text-sm text-red-500 w-full">{error}</p>}
      </div>
    </div>
  );
}
