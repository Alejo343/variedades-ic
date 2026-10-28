"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, PencilLine } from "lucide-react";

// "Anular" / "Corregir" on a sale row (lib/domain/sale-void.ts). Corregir
// voids it and opens the sale form preloaded with the same products, to
// register it again the right way.
export function VoidSaleControls({
  kind,
  saleId,
  blocker,
  correctHref,
}: {
  kind: "direct" | "seller";
  saleId: number;
  /** Why it can't be voided (saleVoidBlocker), or null. */
  blocker: string | null;
  /** Where Corregir goes after voiding; null = no Corregir (e.g. a store seller's sale). */
  correctHref: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "void" | "correct">("idle");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (blocker) {
    return (
      <span className="text-[12px] text-[var(--adm-ink-3)]" title={blocker}>
        No se puede anular
      </span>
    );
  }

  async function confirm() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/${kind === "direct" ? "direct-sales" : "seller-sales"}/${saleId}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "No se pudo anular la venta");
      setBusy(false);
      return;
    }
    if (mode === "correct" && correctHref) router.push(correctHref);
    else {
      setMode("idle");
      setBusy(false);
      router.refresh();
    }
  }

  if (mode === "idle") {
    return (
      <div className="flex justify-end gap-1.5">
        {correctHref && (
          <button type="button" className="adm-btn adm-btn-ghost !h-8 !px-2.5 text-[12.5px]" onClick={() => setMode("correct")}>
            <PencilLine size={14} />
            Corregir
          </button>
        )}
        <button type="button" className="adm-btn adm-btn-ghost !h-8 !px-2.5 text-[12.5px] text-[var(--adm-danger)]" onClick={() => setMode("void")}>
          <Ban size={14} />
          Anular
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-[260px] text-left">
      <p className="text-[12.5px] text-[var(--adm-ink-2)]">
        {mode === "correct"
          ? "Se anula esta venta y se abre una nueva con los mismos productos para registrarla bien."
          : "La venta queda anulada: las unidades vuelven al inventario y, si entró dinero a caja, se quita."}
      </p>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (opcional)"
        maxLength={500}
        className="adm-input !h-8 text-[13px]"
      />
      {error && <p className="text-[12px] text-[var(--adm-danger)]">{error}</p>}
      <div className="flex justify-end gap-1.5">
        <button type="button" className="adm-btn adm-btn-ghost !h-8 !px-2.5 text-[12.5px]" onClick={() => setMode("idle")} disabled={busy}>
          Cancelar
        </button>
        <button type="button" className="adm-btn adm-btn-danger !h-8 !px-2.5 text-[12.5px]" onClick={confirm} disabled={busy}>
          {busy ? "Anulando…" : mode === "correct" ? "Anular y corregir" : "Anular venta"}
        </button>
      </div>
    </div>
  );
}
