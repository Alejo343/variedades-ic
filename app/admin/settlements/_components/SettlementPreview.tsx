"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Preview = { totalSales: number; totalCommission: number; totalLosses: number; amountDue: number };

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function SettlementPreview({
  sellerId,
  periodDate,
  preview,
}: {
  sellerId: number;
  periodDate: string;
  preview: Preview;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleDateChange(date: string) {
    router.push(`/admin/settlements/new?sellerId=${sellerId}&date=${date}`);
  }

  async function handleCreate() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, periodDate }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Error al crear la liquidación");
      return;
    }

    router.push("/admin/settlements");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha a liquidar</label>
        <input
          type="date"
          value={periodDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Incluye todas las ventas y pérdidas del vendedor hasta esta fecha que todavía no se hayan liquidado.
        </p>
      </div>

      <div className="flex flex-col gap-2 text-sm border-t border-gray-100 pt-4">
        <div className="flex justify-between">
          <span className="text-gray-500">Total vendido</span>
          <span className="text-gray-800">{formatCOP(preview.totalSales)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Comisión del vendedor</span>
          <span className="text-gray-800">- {formatCOP(preview.totalCommission)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Pérdidas/daños/robos</span>
          <span className="text-gray-800">+ {formatCOP(preview.totalLosses)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-2 font-bold">
          <span className="text-gray-800">A entregar</span>
          <span className="text-gray-800">{formatCOP(preview.amountDue)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Creando..." : "Crear liquidación"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/settlements")}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
