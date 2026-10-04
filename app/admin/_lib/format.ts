// Shared display formatters for the admin panel. All money in the DB is in
// whole pesos (see CLAUDE.md, "unidades monetarias normalizadas").

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCOP(amount: number | null | undefined) {
  // es-CO puts a no-break space after "$"; drop it so figures stay compact.
  return copFormatter.format(amount ?? 0).replace(/\$\s/, "$");
}

/** Short money for tight spaces: $1,2 M / $350 mil / $900 */
export function formatCOPShort(amount: number) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000).toLocaleString("es-CO")} mil`;
  return `${sign}$${abs}`;
}

export function formatNumber(n: number) {
  return n.toLocaleString("es-CO");
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** For `date` columns stored as YYYY-MM-DD strings: avoid the UTC shift of `new Date(str)`. */
export function formatPlainDate(s: string | null | undefined) {
  if (!s) return "—";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export const MOVEMENT_LABELS: Record<string, string> = {
  compra: "Compra",
  venta: "Venta",
  entrega_vendedor: "Entrega a vendedor",
  devolucion: "Devolución",
  ajuste: "Ajuste",
  perdida: "Pérdida",
  dano: "Daño",
  robo: "Robo",
};

/** Today's date in Colombia as YYYY-MM-DD (the business runs on Bogotá time). */
export function todayInBogota(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(now);
}

/** YYYY-MM-DD shifted by `days` (calendar arithmetic, timezone-free). */
export function shiftDate(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}
