"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Sparkles } from "lucide-react";
import { toSlug } from "@/lib/validations";
import type { Category } from "@/lib/db/schema";

type ProductPhoto = { productId: number; name: string; active: boolean; url: string };

export function CategoryForm({
  initial,
  productPhotos = [],
}: {
  initial?: Category;
  productPhotos?: ProductPhoto[];
}) {
  const router = useRouter();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    color: initial?.color ?? "#3B82F6",
    active: initial?.active ?? true,
    // null = automatic: the store uses a photo of one of its products.
    imageUrl: initial?.imageUrl ?? null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoPhoto = productPhotos.find((p) => p.active) ?? null;
  const preview = form.imageUrl ?? autoPhoto?.url ?? null;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al subir imagen");
      return;
    }
    const { url } = await res.json();
    setForm((f) => ({ ...f, imageUrl: url }));
  }

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
      className="adm-card p-6 max-w-2xl flex flex-col gap-5"
    >
      <div>
        <label className="adm-label">
          Nombre
        </label>
        <input
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          className="adm-input"
        />
      </div>

      <div>
        <label className="adm-label">
          Slug
        </label>
        <input
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          required
          pattern="[a-z0-9-]+"
          title="Solo letras minúsculas, números y guiones"
          className="adm-input"
        />
      </div>

      <div>
        <label className="adm-label">
          Descripción
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className="adm-input"
        />
      </div>

      <div>
        <label className="adm-label">
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

      <section>
        <span className="adm-label">Imagen en la tienda</span>
        <div className="flex items-start gap-4">
          <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden border border-[var(--adm-line)] bg-white grid place-items-center text-[var(--adm-ink-3)]">
            {preview ? (
              <Image src={preview} alt="" fill sizes="112px" className="object-contain p-2" />
            ) : (
              <ImagePlus size={26} aria-hidden="true" />
            )}
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <p className="text-sm text-[var(--adm-ink)] m-0">
              {form.imageUrl
                ? "Elegida a mano."
                : autoPhoto
                  ? <>Automática: foto de <strong>{autoPhoto.name}</strong>.</>
                  : "Automática: se usará la foto de uno de sus productos cuando tenga alguno con foto."}
            </p>
            <p className="adm-hint !mt-0">
              En automático se usa un producto destacado, si no uno con stock, si no el más nuevo.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="adm-btn adm-btn-ghost"
              >
                <ImagePlus size={16} aria-hidden="true" /> {uploading ? "Subiendo…" : "Subir imagen"}
              </button>
              {form.imageUrl && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: null }))}
                  className="adm-btn adm-btn-ghost"
                >
                  <Sparkles size={16} aria-hidden="true" /> Usar automática
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
          </div>
        </div>

        {productPhotos.length > 0 && (
          <div className="mt-4">
            <p className="adm-hint !mt-0 mb-2">O elige la foto de uno de sus productos:</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2">
              {productPhotos.map((p) => {
                const selected = form.imageUrl === p.url;
                return (
                  <button
                    key={p.productId}
                    type="button"
                    title={p.name}
                    aria-label={`Usar la foto de ${p.name}`}
                    aria-pressed={selected}
                    onClick={() => setForm((f) => ({ ...f, imageUrl: p.url }))}
                    className={`relative aspect-square rounded-lg overflow-hidden bg-white border-2 transition ${
                      selected
                        ? "border-[var(--adm-brand)] ring-2 ring-[var(--adm-brand)]/25"
                        : "border-[var(--adm-line)] hover:border-[var(--adm-line-strong)]"
                    } ${p.active ? "" : "opacity-50"}`}
                  >
                    <Image src={p.url} alt="" fill sizes="80px" className="object-contain p-1" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <label className="flex items-center gap-2.5 text-sm text-[var(--adm-ink)] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          className="adm-check"
        />
        Activa
      </label>

      {error && <p className="adm-alert adm-alert-danger">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="adm-btn adm-btn-primary"
        >
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear categoría"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/categories")}
          className="adm-btn adm-btn-ghost"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
