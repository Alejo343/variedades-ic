"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toSlug } from "@/lib/validations";
import type { Category, Product, ProductImage } from "@/lib/db/schema";

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
    price: initial?.price ?? 0,
    categoryId: initial?.categoryId ?? null as number | null,
    stock: initial?.stock ?? 0,
    featured: initial?.featured ?? false,
    active: initial?.active ?? true,
    whatsappText: initial?.whatsappText ?? "",
  });

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
        for (let i = 0; i < newImgs.length; i++) {
          await fetch(`/api/admin/products/${initial!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              addImage: {
                url: newImgs[i].url,
                alt: newImgs[i].alt,
                displayOrder: (initial!.images.length) + i,
                isPrimary: initial!.images.length === 0 && i === 0,
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

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-6 max-w-2xl flex flex-col gap-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
            pattern="[a-z0-9-]+"
            title="Solo letras minúsculas, números y guiones"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio (COP)</label>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            value={form.categoryId ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                categoryId: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Texto WhatsApp{" "}
            <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            value={form.whatsappText}
            onChange={(e) => setForm((f) => ({ ...f, whatsappText: e.target.value }))}
            placeholder="Hola, quiero pedir..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            className="w-4 h-4 accent-blue-600"
          />
          Destacado
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="w-4 h-4 accent-blue-600"
          />
          Activo
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes</label>
        {imgs.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {imgs.map((img, i) => (
              <div
                key={i}
                className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                <Image src={img.url} alt={img.alt} fill className="object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                    Principal
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImg(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="border border-gray-300 text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
        >
          {uploading ? "Subiendo..." : "+ Agregar imagen"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || uploading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
