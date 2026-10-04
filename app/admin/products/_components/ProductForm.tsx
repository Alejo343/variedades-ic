"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toSlug } from "@/lib/validations";
import { ImagePlus, X } from "lucide-react";
import type { Category, Product, ProductImage } from "@/lib/db/schema";
import { formatCOP } from "../../_lib/format";

type ExistingImg = { kind: "existing"; id: number; url: string; alt: string };
type NewImg = { kind: "new"; url: string; alt: string };
type Img = ExistingImg | NewImg;

type Props = {
  categories: Category[];
  initial?: Product & { images: ProductImage[] };
};

export function ProductForm({ categories, initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    distributorCode: initial?.distributorCode ?? "",
    price: initial?.price ?? 0,
    purchasePrice: initial?.purchasePrice ?? 0,
    categoryId: initial?.categoryId ?? null as number | null,
    stock: initial?.stock ?? 0,
    minStock: initial?.minStock ?? 0,
    warrantyMonths: initial?.warrantyMonths ?? null as number | null,
    featured: initial?.featured ?? false,
    active: initial?.active ?? true,
    whatsappText: initial?.whatsappText ?? "",
  });
  const [duplicateProduct, setDuplicateProduct] = useState<{ id: number; name: string } | null>(null);

  const [imgs, setImgs] = useState<Img[]>(
    initial?.images.map((i) => ({
      kind: "existing" as const,
      id: i.id,
      url: i.url,
      alt: i.alt ?? "",
    })) ?? []
  );

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: isEdit ? f.slug : toSlug(name) }));
  }

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
    setImgs((prev) => [...prev, { kind: "new", url, alt: form.name }]);
  }

  function removeImg(idx: number) {
    setImgs((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDuplicateProduct(null);

    if (form.distributorCode.trim()) {
      const res = await fetch(
        `/api/admin/products/by-distributor-code?code=${encodeURIComponent(form.distributorCode.trim())}`,
      );
      const match = await res.json();
      if (match && match.id !== initial?.id) {
        setDuplicateProduct(match);
        setLoading(false);
        setError(`Ya existe un producto con ese código de proveedor: ${match.name}`);
        return;
      }
    }

    try {
      if (isEdit) {
        // Update product data
        const res = await fetch(`/api/admin/products/${initial!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error?.formErrors?.[0] ?? "Error al guardar");
          return;
        }

        // Delete removed existing images
        const keptIds = new Set(
          imgs.filter((i): i is ExistingImg => i.kind === "existing").map((i) => i.id)
        );
        for (const img of initial!.images) {
          if (!keptIds.has(img.id)) {
            await fetch(`/api/admin/products/${initial!.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ deleteImageId: img.id }),
            });
          }
        }

        // Add new images
        const newImgs = imgs.filter((i): i is NewImg => i.kind === "new");
        const keptPrimaryExists = initial!.images.some(img => img.isPrimary && keptIds.has(img.id));
        for (let i = 0; i < newImgs.length; i++) {
          await fetch(`/api/admin/products/${initial!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              addImage: {
                url: newImgs[i].url,
                alt: newImgs[i].alt,
                displayOrder: (initial!.images.length) + i,
                isPrimary: !keptPrimaryExists && i === 0,
              },
            }),
          });
        }
      } else {
        // Create product
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error?.formErrors?.[0] ?? "Error al guardar");
          return;
        }
        const product = await res.json();

        // Add images
        for (let i = 0; i < imgs.length; i++) {
          await fetch(`/api/admin/products/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              addImage: {
                url: imgs[i].url,
                alt: imgs[i].alt,
                displayOrder: i,
                isPrimary: i === 0,
              },
            }),
          });
        }
      }

      router.push("/admin/products");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const margin = form.price > 0 && form.purchasePrice > 0 ? Math.round(((form.price - form.purchasePrice) / form.price) * 100) : null;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-start">
      <div className="flex flex-col gap-4 min-w-0">
        <section className="adm-card p-6 flex flex-col gap-4">
          <h2 className="adm-card-title">Información</h2>
          <div>
            <label className="adm-label">Nombre</label>
            <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required className="adm-input h-11 text-[15px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="adm-label">Slug (URL pública)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--adm-ink-3)]">/productos/</span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                  pattern="[a-z0-9-]+"
                  title="Solo letras minúsculas, números y guiones"
                  className="adm-input num pl-[84px] text-[13px]"
                />
              </div>
            </div>
            <div>
              <label className="adm-label">Categoría</label>
              <select
                value={form.categoryId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value ? Number(e.target.value) : null }))}
                className="adm-input"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="adm-label">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              className="adm-input"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="adm-label">SKU</label>
              <input
                value={isEdit ? initial!.sku : "Se genera al guardar"}
                disabled
                className="adm-input num text-[13px]"
              />
            </div>
            <div>
              <label className="adm-label">Código de proveedor</label>
              <input
                value={form.distributorCode}
                onChange={(e) => setForm((f) => ({ ...f, distributorCode: e.target.value }))}
                placeholder="Opcional"
                className="adm-input num"
              />
            </div>
          </div>
        </section>

        <section className="adm-card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="adm-card-title">Precios</h2>
            {margin !== null && (
              <span className={`adm-badge adm-badge-plain ${margin < 0 ? "adm-badge-danger" : margin < 15 ? "adm-badge-warn" : "adm-badge-ok"}`}>
                Margen {margin}% · {formatCOP(form.price - form.purchasePrice)} por unidad
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MoneyInput
              label="Precio de venta"
              value={form.price}
              onChange={(price) => setForm((f) => ({ ...f, price }))}
              required
            />
            <MoneyInput
              label="Precio de compra (costo)"
              value={form.purchasePrice}
              onChange={(purchasePrice) => setForm((f) => ({ ...f, purchasePrice }))}
            />
          </div>
        </section>

        <section className="adm-card p-6 flex flex-col gap-4">
          <h2 className="adm-card-title">Inventario y garantía</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="adm-label">Stock</label>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                className="adm-input num"
              />
            </div>
            <div>
              <label className="adm-label">Stock mínimo</label>
              <input
                type="number"
                min={0}
                value={form.minStock}
                onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) }))}
                className="adm-input num"
              />
              <p className="adm-hint">Alerta cuando el stock llegue a este número.</p>
            </div>
            <div>
              <label className="adm-label">Garantía (meses)</label>
              <input
                type="number"
                min={0}
                value={form.warrantyMonths ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, warrantyMonths: e.target.value ? Number(e.target.value) : null }))}
                placeholder="Sin garantía"
                className="adm-input num"
              />
            </div>
          </div>
          {isEdit && (
            <p className="adm-hint !mt-0">
              Para corregir existencias tras un conteo, usa un ajuste en Inventario: queda registrado en el historial.
            </p>
          )}
        </section>

        <section className="adm-card p-6 flex flex-col gap-3">
          <h2 className="adm-card-title">WhatsApp</h2>
          <div>
            <label className="adm-label">Mensaje predefinido</label>
            <input
              value={form.whatsappText}
              onChange={(e) => setForm((f) => ({ ...f, whatsappText: e.target.value }))}
              placeholder="Hola, quiero pedir…"
              className="adm-input"
            />
            <p className="adm-hint">Texto que se abre en WhatsApp cuando el cliente pulsa “Pedir” en el catálogo.</p>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-4 xl:sticky xl:top-24">
        <section className="adm-card p-5 flex flex-col gap-3">
          <h2 className="adm-card-title">Imágenes</h2>
          <div className="grid grid-cols-3 gap-2">
            {imgs.map((img, i) => (
              <div
                key={i}
                className={`relative aspect-square rounded-xl overflow-hidden border bg-[#f0ede6] group ${
                  i === 0 ? "col-span-3 aspect-[4/3] border-[var(--adm-line-strong)]" : "border-[var(--adm-line)]"
                }`}
              >
                <Image src={img.url} alt={img.alt} fill sizes={i === 0 ? "320px" : "100px"} className="object-cover" />
                {i === 0 && (
                  <span className="absolute left-2 top-2 adm-badge adm-badge-plain bg-white/90 text-[var(--adm-ink)]">Principal</span>
                )}
                <button
                  type="button"
                  onClick={() => removeImg(i)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 grid place-items-center rounded-lg bg-white/90 text-[var(--adm-ink-2)] hover:text-[var(--adm-danger)] opacity-0 group-hover:opacity-100 focus:opacity-100 transition shadow-sm"
                  aria-label="Quitar imagen"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={`rounded-xl border-2 border-dashed border-[var(--adm-line-strong)] grid place-items-center text-[var(--adm-ink-3)] hover:border-[var(--adm-brand)] hover:text-[var(--adm-brand)] transition disabled:opacity-60 ${
                imgs.length === 0 ? "col-span-3 aspect-[4/3]" : "aspect-square"
              }`}
            >
              <span className="flex flex-col items-center gap-1.5 text-[12.5px] font-medium">
                <ImagePlus size={imgs.length === 0 ? 26 : 18} />
                {uploading ? "Subiendo…" : imgs.length === 0 ? "Agregar imagen" : "Agregar"}
              </span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
          <p className="adm-hint !mt-0">JPG, PNG o WebP hasta 10 MB. La primera es la principal.</p>
        </section>

        <section className="adm-card p-5 flex flex-col gap-1">
          <h2 className="adm-card-title mb-2">Visibilidad</h2>
          <Toggle
            checked={form.active}
            onChange={(active) => setForm((f) => ({ ...f, active }))}
            label="Activo"
            hint="Visible en el catálogo y disponible para vender"
          />
          <Toggle
            checked={form.featured}
            onChange={(featured) => setForm((f) => ({ ...f, featured }))}
            label="Destacado"
            hint="Aparece en la página principal"
          />
        </section>

        {error && (
          <p className="adm-alert adm-alert-danger">
            <span>
              {error}
              {duplicateProduct && (
                <>
                  {" — "}
                  <a href={`/admin/products/${duplicateProduct.id}/edit`} className="underline font-medium">
                    Ir a editar {duplicateProduct.name}
                  </a>
                </>
              )}
            </span>
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={loading || uploading} className="adm-btn adm-btn-primary adm-btn-lg flex-1">
            {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
          <button type="button" onClick={() => router.push("/admin/products")} className="adm-btn adm-btn-lg">
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="adm-label">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--adm-ink-3)] text-sm">$</span>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          required={required}
          className="adm-input num pl-7 h-11 text-[15px]"
        />
      </div>
      <p className="adm-hint num">{formatCOP(value)}</p>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer select-none">
      <span>
        <span className="block text-[14px] font-medium">{label}</span>
        {hint && <span className="block text-[12px] text-[var(--adm-ink-3)]">{hint}</span>}
      </span>
      <span className="relative shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block w-10 h-6 rounded-full bg-[#d7d1c4] peer-checked:bg-[var(--adm-ok)] transition peer-focus-visible:ring-4 peer-focus-visible:ring-[rgba(3,105,161,.2)]" />
        <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
