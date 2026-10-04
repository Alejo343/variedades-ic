"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  products: { id: number; name: string }[];
};

export function AdjustmentForm({ products }: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState<number | "">("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState(0);
  const quantityDelta = direction === "in" ? quantity : -quantity;
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/inventory/adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantityDelta, reason }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(
        typeof data.error === "string"
          ? data.error
          : (data.error?.formErrors?.[0] ?? "Error al registrar el ajuste"),
      );
      return;
    }

    setProductId("");
    setQuantity(0);
    setReason("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="adm-card p-5 flex flex-col gap-4">
      <div>
        <h2 className="adm-card-title">Ajuste manual</h2>
        <p className="adm-card-desc">Corrige el stock tras un conteo físico. Queda registrado en el historial.</p>
      </div>
      <div>
        <label className="adm-label">Producto</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
          required
          className="adm-input"
        >
          <option value="">Selecciona…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-[1fr_110px] gap-3 items-end">
        <div className="adm-seg [&>*]:flex-1 [&>*]:justify-center">
          <button type="button" data-active={direction === "in"} onClick={() => setDirection("in")}>
            + Entrada
          </button>
          <button type="button" data-active={direction === "out"} onClick={() => setDirection("out")}>
            − Salida
          </button>
        </div>
        <input
          type="number"
          min={1}
          value={quantity || ""}
          onChange={(e) => setQuantity(Number(e.target.value))}
          placeholder="Cant."
          required
          aria-label="Cantidad"
          className="adm-input num"
        />
      </div>
      <div>
        <label className="adm-label">Motivo</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej. Conteo físico del sábado"
          required
          className="adm-input"
        />
      </div>
      {error && <p className="adm-alert adm-alert-danger">{error}</p>}
      <button type="submit" disabled={loading || quantity < 1} className="adm-btn adm-btn-primary">
        {loading ? "Guardando…" : "Registrar ajuste"}
      </button>
    </form>
  );
}
