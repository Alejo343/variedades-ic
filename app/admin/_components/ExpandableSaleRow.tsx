"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// A sales-list row that opens, right under it, the sale's breakdown
// (products, quantities, prices, and Anular / Corregir). Clicking anywhere on
// the row toggles it, except on its own links and buttons.
export function ExpandableSaleRow({
  cells,
  detail,
  colSpan,
  dim,
}: {
  /** The row's <td>s, without the trailing toggle cell. */
  cells: React.ReactNode;
  detail: React.ReactNode;
  /** Columns of the table, toggle cell included. */
  colSpan: number;
  dim?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className={`cursor-pointer ${dim ? "opacity-60" : ""} ${open ? "bg-[var(--adm-surface-2)]" : ""}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button")) return;
          setOpen((o) => !o);
        }}
      >
        {cells}
        <td className="t-right w-10">
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Ocultar detalle" : "Ver detalle"}
            onClick={() => setOpen((o) => !o)}
            className="inline-grid place-items-center w-7 h-7 rounded-md text-[var(--adm-ink-3)] hover:bg-[var(--adm-surface-2)]"
          >
            <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-[var(--adm-surface-2)]">
          <td colSpan={colSpan} className="!pt-0">
            {detail}
          </td>
        </tr>
      )}
    </>
  );
}
