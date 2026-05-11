"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: number;
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_viaje: "En viaje",
  recibido: "Recibido",
  cancelado: "Cancelado",
};

export function StatusActions({ orderId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function changeStatus(newStatus: string) {
    setLoading(true);
    setError("");

    const isReceive = newStatus === "recibido";
    const url = isReceive
      ? `/api/admin/purchase-orders/${orderId}/receive`
      : `/api/admin/purchase-orders/${orderId}`;

    const res = await fetch(url, {
      method: isReceive ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: isReceive ? undefined : JSON.stringify({ status: newStatus }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al actualizar");
      return;
    }

    router.refresh();
  }

  if (status === "recibido" || status === "cancelado") return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {status === "pendiente" && (
        <button
          onClick={() => changeStatus("en_viaje")}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
        >
          Marcar En Viaje
        </button>
      )}
      {status === "en_viaje" && (
        <button
          onClick={() => changeStatus("recibido")}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
        >
          Marcar Recibido (actualiza stock)
        </button>
      )}
      {status !== "cancelado" && (
        <button
          onClick={() => changeStatus("cancelado")}
          disabled={loading}
          className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
        >
          Cancelar pedido
        </button>
      )}
      {error && <p className="text-sm text-red-500 w-full">{error}</p>}
    </div>
  );
}
