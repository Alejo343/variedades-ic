"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: number; name: string };

const NEXT_STATUS: Record<string, { label: string; status: string; style: string }[]> = {
  pendiente: [
    { label: "Confirmar pedido", status: "confirmado", style: "adm-btn-brand" },
    { label: "Cancelar", status: "cancelado", style: "adm-btn-danger" },
  ],
  confirmado: [
    { label: "Marcar entregado", status: "entregado", style: "adm-btn-ok" },
    { label: "Cancelar", status: "cancelado", style: "adm-btn-danger" },
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
    if (newStatus === "cancelado" && !confirm("¿Cancelar este pedido?")) return;
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
          className="adm-input sm:w-64"
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
            className={`adm-btn ${a.style}`}
          >
            {a.label}
          </button>
        ))}
        {error && <p className="adm-alert adm-alert-danger w-full">{error}</p>}
      </div>
    </div>
  );
}
