"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, Truck } from "lucide-react";

type Props = {
  orderId: number;
  status: string;
};

export function StatusActions({ orderId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function changeStatus(newStatus: string) {
    if (newStatus === "cancelado" && !confirm("¿Cancelar este pedido de compra?")) return;
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
          className="adm-btn adm-btn-brand"
        >
          <Truck />
          Marcar en viaje
        </button>
      )}
      {status === "en_viaje" && (
        <button
          onClick={() => changeStatus("recibido")}
          disabled={loading}
          className="adm-btn adm-btn-ok"
        >
          <PackageCheck />
          Marcar recibido (suma al stock)
        </button>
      )}
      {status !== "cancelado" && (
        <button
          onClick={() => changeStatus("cancelado")}
          disabled={loading}
          className="adm-btn adm-btn-danger"
        >
          Cancelar pedido
        </button>
      )}
      {error && <p className="adm-alert adm-alert-danger w-full">{error}</p>}
    </div>
  );
}
