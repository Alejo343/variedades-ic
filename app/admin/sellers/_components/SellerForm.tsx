"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Seller } from "@/lib/db/schema";

export function SellerForm({ initial }: { initial?: Seller }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    city: initial?.city ?? "",
    commissionType: initial?.commissionType ?? "percentage",
    inventoryMode: initial?.inventoryMode ?? "consignment",
    commissionDisplay:
      initial?.commissionType === "fixed_per_unit"
        ? (initial?.commissionValue ?? 0)
        : ((initial?.commissionValue ?? 0) / 100),
    notes: initial?.notes ?? "",
    active: initial?.active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const commissionValue =
      form.commissionType === "fixed_per_unit"
        ? Math.round(form.commissionDisplay)
        : Math.round(form.commissionDisplay * 100);

    const payload = {
      name: form.name,
      phone: form.phone,
      city: form.city,
      commissionType: form.commissionType,
      commissionValue,
      inventoryMode: form.inventoryMode,
      notes: form.notes,
      active: form.active,
    };

    const url = isEdit ? `/api/admin/sellers/${initial!.id}` : "/api/admin/sellers";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : (data.error?.formErrors?.[0] ?? "Error al guardar"));
      return;
    }

    router.push("/admin/sellers");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="adm-card p-6 max-w-2xl flex flex-col gap-5"
    >
      <div>
        <label className="adm-label">Nombre *</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="adm-input"
        />
      </div>

      <div>
        <label className="adm-label">Teléfono</label>
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="adm-input"
        />
      </div>

      <div>
        <label className="adm-label">Ciudad</label>
        <input
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="adm-input"
        />
      </div>

      <div>
        <label className="adm-label">Tipo de vendedor</label>
        <select
          value={form.inventoryMode}
          onChange={(e) => setForm((f) => ({ ...f, inventoryMode: e.target.value }))}
          className="adm-input"
        >
          <option value="consignment">Consignación (otra ciudad)</option>
          <option value="store">Tienda principal</option>
        </select>
        <p className="mt-1.5 text-xs text-[var(--adm-ink-3)]">
          {form.inventoryMode === "store"
            ? "Vende del inventario principal y el dinero entra a caja al momento. No recibe entregas ni se liquida."
            : "Vende solo la mercancía que se le entrega y entrega el dinero al liquidar."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="adm-label">Tipo de comisión</label>
          <select
            value={form.commissionType}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                commissionType: e.target.value as "percentage" | "fixed_per_unit",
                commissionDisplay: 0,
              }))
            }
            className="adm-input"
          >
            <option value="percentage">Porcentaje</option>
            <option value="fixed_per_unit">Fijo por unidad</option>
          </select>
        </div>

        <div>
          <label className="adm-label">
            {form.commissionType === "percentage" ? "Porcentaje (%)" : "Valor por unidad (COP)"}
          </label>
          <input
            type="number"
            min={0}
            step={form.commissionType === "percentage" ? "0.01" : "1"}
            value={form.commissionDisplay}
            onChange={(e) => setForm((f) => ({ ...f, commissionDisplay: Number(e.target.value) }))}
            required
            className="adm-input"
          />
        </div>
      </div>

      <div>
        <label className="adm-label">Notas</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
          className="adm-input"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-[var(--adm-ink)] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          className="adm-check"
        />
        Activo
      </label>

      {error && <p className="adm-alert adm-alert-danger">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="adm-btn adm-btn-primary"
        >
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear vendedor"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/sellers")}
          className="adm-btn adm-btn-ghost"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
