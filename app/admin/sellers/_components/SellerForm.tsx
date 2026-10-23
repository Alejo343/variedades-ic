"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Seller } from "@/lib/db/schema";
import { formatCOP } from "../../_lib/format";

export function SellerForm({ initial }: { initial?: Seller }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    city: initial?.city ?? "",
    inventoryMode: initial?.inventoryMode ?? "consignment",
    payType: initial?.payType ?? "commission",
    salaryAmount: initial?.salaryAmount ? String(initial.salaryAmount) : "",
    salaryPeriod: initial?.salaryPeriod ?? "weekly",
    notes: initial?.notes ?? "",
    active: initial?.active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Only a store seller can be salaried (lib/domain/salary.ts).
  const salaried = form.inventoryMode === "store" && form.payType === "salary";
  const salaryAmount = Number(form.salaryAmount.replace(/\D/g, "")) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name: form.name,
      phone: form.phone,
      city: form.city,
      inventoryMode: form.inventoryMode,
      payType: salaried ? "salary" : "commission",
      salaryAmount: salaried ? salaryAmount : null,
      salaryPeriod: salaried ? form.salaryPeriod : null,
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

      {form.inventoryMode === "store" && (
        <div>
          <label className="adm-label">Cómo se le paga</label>
          <select
            value={form.payType}
            onChange={(e) => setForm((f) => ({ ...f, payType: e.target.value }))}
            className="adm-input"
          >
            <option value="commission">Comisión por venta</option>
            <option value="salary">Sueldo fijo</option>
          </select>
          <p className="mt-1.5 text-xs text-[var(--adm-ink-3)]">
            {form.payType === "salary"
              ? "Sus ventas no generan comisión. El sueldo se paga por semana (lunes a domingo) o por mes, desde hoy."
              : "Gana el porcentaje de comisión de cada producto que vende."}
          </p>
        </div>
      )}

      {salaried && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="adm-label">Sueldo *</label>
            <input
              value={form.salaryAmount}
              onChange={(e) => setForm((f) => ({ ...f, salaryAmount: e.target.value }))}
              inputMode="numeric"
              placeholder="Ej. 300000"
              className="adm-input num"
            />
            {salaryAmount > 0 && <p className="mt-1.5 text-xs text-[var(--adm-ink-3)] num">{formatCOP(salaryAmount)}</p>}
          </div>
          <div>
            <label className="adm-label">Cada</label>
            <select
              value={form.salaryPeriod}
              onChange={(e) => setForm((f) => ({ ...f, salaryPeriod: e.target.value }))}
              className="adm-input"
            >
              <option value="weekly">Semana</option>
              <option value="monthly">Mes</option>
            </select>
          </div>
        </div>
      )}

      {!salaried && (
        <p className="-mt-2 text-xs text-[var(--adm-ink-3)]">
          La comisión no se configura aquí: cada producto tiene su porcentaje y vale para todos los vendedores.
        </p>
      )}

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
