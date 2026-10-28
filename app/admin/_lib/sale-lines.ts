import type { SaleLine } from "@/lib/db/queries/direct-sales";

/** A sale's products in one short line for a list: "2× Audífonos, 1× Cable y 3 más". */
export function linesSummary(lines: SaleLine[], shown = 2): string {
  if (lines.length === 0) return "—";
  const head = lines
    .slice(0, shown)
    .map((l) => `${l.quantity}× ${l.productName ?? `Producto #${l.productId}`}`)
    .join(", ");
  return lines.length > shown ? `${head} y ${lines.length - shown} más` : head;
}
