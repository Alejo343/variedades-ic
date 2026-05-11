"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export function SalesStatusActions({ orderId, status }: { orderId: number; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const actions = NEXT_STATUS[status];
  if (!actions) return null;

  async function changeStatus(newStatus: string) {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/sales-orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
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
    <div className="flex gap-2 flex-wrap">
      {actions.map((a) => (
        <button
          key={a.status}
          onClick={() => changeStatus(a.status)}
          disabled={loading}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60 ${a.style}`}
        >
          {a.label}
        </button>
      ))}
      {error && <p className="text-sm text-red-500 w-full">{error}</p>}
    </div>
  );
}
