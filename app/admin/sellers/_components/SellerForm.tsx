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
      setError(data.error?.formErrors?.[0] ?? "Error al guardar");
      return;
    }

    router.push("/admin/sellers");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-6 max-w-lg flex flex-col gap-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
        <input
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de comisión</label>
          <select
            value={form.commissionType}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                commissionType: e.target.value as "percentage" | "fixed_per_unit",
                commissionDisplay: 0,
              }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="percentage">Porcentaje</option>
            <option value="fixed_per_unit">Fijo por unidad</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {form.commissionType === "percentage" ? "Porcentaje (%)" : "Valor por unidad (COP)"}
          </label>
          <input
            type="number"
            min={0}
            step={form.commissionType === "percentage" ? "0.01" : "1"}
            value={form.commissionDisplay}
            onChange={(e) => setForm((f) => ({ ...f, commissionDisplay: Number(e.target.value) }))}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          className="w-4 h-4 accent-blue-600"
        />
        Activo
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear vendedor"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/sellers")}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
