"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DateRangeFilter({ from, to }: { from?: string; to?: string }) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(from ?? "");
  const [toDate, setToDate] = useState(to ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    router.push(`/admin/reports${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function clear() {
    setFromDate("");
    setToDate("");
    router.push("/admin/reports");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-end gap-3 flex-wrap">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={apply}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
      >
        Aplicar
      </button>
      {(from || to) && (
        <button onClick={clear} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">
          Quitar filtro
        </button>
      )}
      <p className="text-xs text-gray-400 w-full">
        Afecta a Compras, Ventas, Utilidad y Caja. Los demás reportes muestran el estado actual.
      </p>
    </div>
  );
}
