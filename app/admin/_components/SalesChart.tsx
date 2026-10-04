import type { DailySalesPoint } from "@/lib/db/queries/reports";
import { formatCOP, formatCOPShort } from "../_lib/format";

const SERIES = [
  { key: "local", label: "En local", color: "var(--adm-series-1)" },
  { key: "seller", label: "Vendedores", color: "var(--adm-series-2)" },
  { key: "whatsapp", label: "WhatsApp", color: "var(--adm-series-3)" },
] as const;

function niceCeil(n: number) {
  if (n <= 0) return 100_000;
  const pow = 10 ** Math.floor(Math.log10(n));
  const steps = [1, 2, 2.5, 5, 10];
  for (const s of steps) if (s * pow >= n) return s * pow;
  return 10 * pow;
}

const WEEKDAY = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** Stacked daily sales by channel. Pure HTML/CSS, hover tooltip per day, no client JS. */
export function SalesChart({ data, today }: { data: DailySalesPoint[]; today: string }) {
  const totals = data.map((d) => d.local + d.seller + d.whatsapp);
  const max = niceCeil(Math.max(...totals, 0));
  const ticks = [max, max * 0.5, 0];

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-2 text-[12.5px] text-[var(--adm-ink-2)]">
            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="flex gap-3">
        {/* Y axis */}
        <div className="relative w-14 shrink-0 h-[200px] text-right">
          {ticks.map((t, i) => (
            <span
              key={t}
              className="num absolute right-0 text-[11px] text-[var(--adm-ink-3)] -translate-y-1/2"
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            >
              {formatCOPShort(t)}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative h-[200px]">
            {/* Grid */}
            {ticks.map((t, i) => (
              <div
                key={t}
                className={`absolute inset-x-0 border-t ${i === ticks.length - 1 ? "border-[var(--adm-line-strong)]" : "border-dashed border-[var(--adm-line)]"}`}
                style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
              />
            ))}

            <div className="adm-chart absolute inset-0 flex items-end gap-[3px] sm:gap-1.5">
              {data.map((d, i) => {
                const total = totals[i];
                const [y, m, day] = d.date.split("-").map(Number);
                const weekday = WEEKDAY[new Date(Date.UTC(y, m - 1, day)).getUTCDay()];
                return (
                  <div key={d.date} className="adm-col relative flex-1 h-full flex flex-col justify-end items-center">
                    {/* Hit area is the full column height */}
                    <div
                      className="adm-bar w-full max-w-[28px] flex flex-col-reverse gap-[2px] rounded-t-[4px] overflow-hidden"
                      style={{ height: `${(total / max) * 100}%`, minHeight: total > 0 ? 3 : 0 }}
                    >
                      {SERIES.map((s) =>
                        d[s.key] > 0 ? (
                          <div key={s.key} style={{ flexGrow: d[s.key], background: s.color, minHeight: 2 }} />
                        ) : null,
                      )}
                    </div>

                    <div
                      className="adm-tip absolute left-1/2 z-10 w-44 rounded-xl bg-[#16171b] text-white p-3 shadow-xl"
                      style={{ bottom: `calc(${Math.min((total / max) * 100, 70)}% + 10px)` }}
                    >
                      <p className="text-[11.5px] text-slate-400 mb-1.5 capitalize">
                        {weekday} {day}/{m}
                      </p>
                      {SERIES.map((s) => (
                        <div key={s.key} className="flex items-center justify-between gap-2 text-[12px] py-0.5">
                          <span className="inline-flex items-center gap-1.5 text-slate-300">
                            <span className="w-2 h-2 rounded-[2px]" style={{ background: s.color }} />
                            {s.label}
                          </span>
                          <span className="num">{formatCOP(d[s.key])}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-[12.5px] border-t border-white/10 mt-1.5 pt-1.5 font-semibold">
                        <span>Total</span>
                        <span className="num">{formatCOP(total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X axis */}
          <div className="flex gap-[3px] sm:gap-1.5 mt-2">
            {data.map((d, i) => {
              const day = Number(d.date.slice(8));
              const isToday = d.date === today;
              return (
                <span
                  key={d.date}
                  className={`flex-1 text-center text-[11px] num ${isToday ? "font-semibold text-[var(--adm-ink)]" : "text-[var(--adm-ink-3)]"} ${
                    i % 2 === 1 && !isToday ? "invisible sm:visible" : ""
                  }`}
                >
                  {isToday ? "Hoy" : day}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
