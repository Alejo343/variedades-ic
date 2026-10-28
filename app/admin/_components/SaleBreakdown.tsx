import type { SaleLine } from "@/lib/db/queries/direct-sales";
import { formatCOP, formatDateTime } from "../_lib/format";

// What a sale sold, shown when its row in a sales list is opened: one line per
// product, the total, the seller's commission, and how it ended (voided, or
// the controls to void / correct it).
export function SaleBreakdown({
  lines,
  total,
  commission,
  facts,
  voidedAt,
  voidReason,
  actions,
}: {
  lines: SaleLine[];
  total: number;
  /** The seller's commission; omitted for the owner's own sales. */
  commission?: number;
  /** Short context lines ("Cuenta: Nequi", the notes…). */
  facts: string[];
  voidedAt: Date | null;
  voidReason: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px] items-start py-3">
      <div className="adm-card overflow-hidden">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th className="t-right">Cantidad</th>
              <th className="t-right">Precio</th>
              <th className="t-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td>
                  <span className="t-strong">{l.productName ?? `Producto #${l.productId}`}</span>
                  {l.sku && <span className="num text-[12px] text-[var(--adm-ink-3)] ml-2">{l.sku}</span>}
                </td>
                <td className="t-right num">{l.quantity}</td>
                <td className="t-right num">{formatCOP(l.unitPrice)}</td>
                <td className="t-right num">{formatCOP(l.subtotal)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} className="t-strong">
                Total
              </td>
              <td className={`t-right num t-strong ${voidedAt ? "line-through" : ""}`}>{formatCOP(total)}</td>
            </tr>
            {commission !== undefined && (
              <tr>
                <td colSpan={3} className="text-[var(--adm-ink-2)]">
                  Comisión del vendedor
                </td>
                <td className="t-right num text-[var(--adm-ink-2)]">{formatCOP(commission)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 text-[13px] text-[var(--adm-ink-2)]">
        {facts.map((f, i) => (
          <p key={i}>{f}</p>
        ))}
        {voidedAt && (
          <p className="text-[var(--adm-danger)]">
            Anulada el {formatDateTime(voidedAt)}
            {voidReason ? ` · ${voidReason}` : ""}
          </p>
        )}
        {actions}
      </div>
    </div>
  );
}
