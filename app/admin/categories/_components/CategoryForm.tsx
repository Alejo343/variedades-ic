"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toSlug } from "@/lib/validations";
import type { Category } from "@/lib/db/schema";

export function CategoryForm({ initial }: { initial?: Category }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    color: initial?.color ?? "#3B82F6",
    active: initial?.active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: isEdit ? f.slug : toSlug(name) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEdit
      ? `/api/admin/categories/${initial!.id}`
      : "/api/admin/categories";
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

    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-6 max-w-lg flex flex-col gap-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre
        </label>
        <input
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Slug
        </label>
        <input
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          required
          pattern="[a-z0-9-]+"
          title="Solo letras minúsculas, números y guiones"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            className="w-10 h-10 rounded cursor-pointer border border-gray-300"
          />
          <span className="text-sm text-gray-500">{form.color}</span>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          className="w-4 h-4 accent-blue-600"
        />
        Activa
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear categoría"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/categories")}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
