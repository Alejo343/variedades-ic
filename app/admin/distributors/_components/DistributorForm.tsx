"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Distributor } from "@/lib/db/schema";

export function DistributorForm({ initial }: { initial?: Distributor }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    city: initial?.city ?? "",
    phone: initial?.phone ?? "",
    notes: initial?.notes ?? "",
    active: initial?.active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEdit
      ? `/api/admin/distributors/${initial!.id}`
      : "/api/admin/distributors";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "Error al guardar");
      return;
    }

    router.push("/admin/distributors");
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
        <label className="adm-label">Ciudad</label>
        <input
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
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
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear distribuidor"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/distributors")}
          className="adm-btn adm-btn-ghost"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
