"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCOP } from "../../_lib/format";

type Preview = { totalSales: number; totalCommission: number; totalLosses: number; amountDue: number };


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

  const lines: [string, string, string][] = [
    ["Total vendido", "", formatCOP(preview.totalSales)],
    ["Comisión del vendedor", "−", formatCOP(preview.totalCommission)],
    ["Pérdidas, daños y robos", "+", formatCOP(preview.totalLosses)],
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 items-start">
      <div className="adm-card p-6 flex flex-col gap-4">
        <div>
          <label className="adm-label">Liquidar hasta la fecha</label>
          <input type="date" value={periodDate} onChange={(e) => handleDateChange(e.target.value)} className="adm-input max-w-xs" />
          <p className="adm-hint">
            Incluye todas las ventas y pérdidas del vendedor hasta esta fecha que todavía no se hayan liquidado.
          </p>
        </div>
        <div className="adm-alert adm-alert-info">
          <span>
            Al crearla queda <strong>pendiente</strong>. Cuando el vendedor te entregue el dinero, márcala como liquidada en el listado
            y elige la cuenta donde entra.
          </span>
        </div>
      </div>

      {/* Receipt */}
      <div className="adm-card overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-dashed border-[var(--adm-line-strong)]">
          <p className="adm-eyebrow">Resumen de liquidación</p>
          <p className="num text-[13px] text-[var(--adm-ink-3)] mt-1">Hasta {periodDate}</p>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          {lines.map(([label, sign, value]) => (
            <div key={label} className="flex justify-between text-[14px]">
              <span className="text-[var(--adm-ink-2)]">{label}</span>
              <span className="num">
                {sign && <span className="text-[var(--adm-ink-3)] mr-1">{sign}</span>}
                {value}
              </span>
            </div>
          ))}
        </div>
        <div className="px-6 py-5 bg-[#16171b] text-white flex items-end justify-between">
          <span className="text-[12px] uppercase tracking-[.14em] text-slate-400 font-semibold">A entregar</span>
          <span className="num text-[30px] font-semibold leading-none">{formatCOP(preview.amountDue)}</span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {error && <p className="adm-alert adm-alert-danger">{error}</p>}
          <button type="button" onClick={handleCreate} disabled={loading} className="adm-btn adm-btn-primary adm-btn-lg w-full">
            {loading ? "Creando…" : "Crear liquidación"}
          </button>
          <button type="button" onClick={() => router.push("/admin/settlements")} className="adm-btn adm-btn-ghost w-full">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
