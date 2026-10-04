"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarRange, Printer } from "lucide-react";
import { shiftDate, todayInBogota } from "../../_lib/format";

function presets() {
  const today = todayInBogota();
  const monthStart = `${today.slice(0, 8)}01`;
  const prevMonthEnd = shiftDate(monthStart, -1);
  const prevMonthStart = `${prevMonthEnd.slice(0, 8)}01`;
  return [
    { label: "Hoy", from: today, to: today },
    { label: "7 días", from: shiftDate(today, -6), to: today },
    { label: "30 días", from: shiftDate(today, -29), to: today },
    { label: "Este mes", from: monthStart, to: today },
    { label: "Mes pasado", from: prevMonthStart, to: prevMonthEnd },
    { label: "Todo", from: "", to: "" },
  ];
}

export function DateRangeFilter({ from, to }: { from?: string; to?: string }) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(from ?? "");
  const [toDate, setToDate] = useState(to ?? "");

  function go(f: string, t: string) {
    setFromDate(f);
    setToDate(t);
    const params = new URLSearchParams();
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    const q = params.toString();
    router.push(`/admin/reports${q ? `?${q}` : ""}`, { scroll: false });
  }

  const list = presets();
  const activePreset = list.find((p) => p.from === (from ?? "") && p.to === (to ?? ""));

  return (
    <div className="adm-card p-4 flex flex-col gap-3 print:hidden">
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 xl:justify-between">
        <div className="adm-seg">
          {list.map((p) => (
            <button key={p.label} type="button" data-active={activePreset?.label === p.label} onClick={() => go(p.from, p.to)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarRange size={16} className="text-[var(--adm-ink-3)]" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="adm-input h-9 w-auto"
            aria-label="Desde"
          />
          <span className="text-[var(--adm-ink-3)] text-sm">a</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="adm-input h-9 w-auto"
            aria-label="Hasta"
          />
          <button type="button" onClick={() => go(fromDate, toDate)} className="adm-btn adm-btn-primary h-9">
            Aplicar
          </button>
          <button type="button" onClick={() => window.print()} className="adm-btn h-9" title="Imprimir o guardar como PDF">
            <Printer />
          </button>
        </div>
      </div>
      <p className="text-[12px] text-[var(--adm-ink-3)]">
        El rango afecta a Compras, Ventas, Utilidad y Caja. Inventario, alertas, vendedores y cuentas por pagar muestran el estado actual.
      </p>
    </div>
  );
}
