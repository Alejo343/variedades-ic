"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ImageOff, Search, X } from "lucide-react";

export type AdjustmentProduct = {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  minStock: number;
  imageUrl: string | null;
};

type Mode = "in" | "out" | "count";

const MAX_RESULTS = 6;

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function stockTone(p: AdjustmentProduct) {
  if (p.stock < 0) return "text-[var(--adm-danger)]";
  if (p.stock === 0) return "text-[var(--adm-danger)]";
  if (p.stock <= p.minStock) return "text-[var(--adm-warn)]";
  return "text-[var(--adm-ink-2)]";
}

/**
 * Type-ahead product picker. Enter picks the highlighted row; an exact SKU
 * match wins, so a barcode scanner (code + Enter) works too.
 */
function ProductCombobox({ products, onPick }: { products: AdjustmentProduct[]; onPick: (p: AdjustmentProduct) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const { results, total } = useMemo(() => {
    const q = normalize(query.trim());
    const list = q ? products.filter((p) => normalize(`${p.name} ${p.sku ?? ""}`).includes(q)) : products;
    return { results: list.slice(0, MAX_RESULTS), total: list.length };
  }, [products, query]);

  const safeIndex = Math.min(index, Math.max(results.length - 1, 0));

  function pick(p: AdjustmentProduct | undefined) {
    if (!p) return;
    onPick(p);
    setQuery("");
    setOpen(false);
    setIndex(0);
  }

  function move(to: number) {
    setIndex(to);
    listRef.current?.querySelector(`[data-idx="${to}"]`)?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      move(Math.min(safeIndex + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(Math.max(safeIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const q = query.trim().toLowerCase();
      const exact = q ? products.find((p) => p.sku?.toLowerCase() === q) : undefined;
      pick(exact ?? (open || q ? results[safeIndex] : undefined));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--adm-ink-3)] pointer-events-none" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="Buscar por nombre o SKU…"
        className="adm-input pl-9"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Buscar producto"
      />
      {open && (
        <ul
          ref={listRef}
          id={listId}
          className="absolute z-20 left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-[var(--adm-line-strong)] bg-white shadow-lg p-1"
          role="listbox"
        >
          {results.length === 0 && (
            <li className="px-3 py-4 text-center text-[13px] text-[var(--adm-ink-3)]">
              {products.length === 0 ? "No hay productos activos." : `Sin resultados para “${query}”.`}
            </li>
          )}
          {results.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                data-idx={i}
                // mousedown fires before the input's blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(p);
                }}
                onMouseMove={() => setIndex(i)}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left ${
                  i === safeIndex ? "bg-[var(--adm-brand-soft)]" : ""
                }`}
                role="option"
                aria-selected={i === safeIndex}
              >
                <span className="w-8 h-8 rounded-md bg-[#f0ede6] overflow-hidden grid place-items-center shrink-0">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <ImageOff size={12} className="text-[var(--adm-ink-3)]" />
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-medium truncate">{p.name}</span>
                  {p.sku && <span className="block num text-[11.5px] text-[var(--adm-ink-3)]">{p.sku}</span>}
                </span>
                <span className={`num text-[13px] font-semibold shrink-0 ${stockTone(p)}`}>{p.stock}</span>
              </button>
            </li>
          ))}
          {total > results.length && (
            <li className="px-3 py-2 text-center text-[11.5px] text-[var(--adm-ink-3)] border-t border-[var(--adm-line)] mt-1">
              Mostrando {results.length} de {total} — escribe para filtrar
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export function AdjustmentForm({ products, initialProductId }: { products: AdjustmentProduct[]; initialProductId?: number }) {
  const router = useRouter();
  const [productId, setProductId] = useState<number | null>(
    initialProductId && products.some((p) => p.id === initialProductId) ? initialProductId : null,
  );
  const [mode, setMode] = useState<Mode>("in");
  const [amount, setAmount] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  const product = products.find((p) => p.id === productId) ?? null;

  // In "count" mode the user types what's physically on the shelf and the delta is derived.
  const quantityDelta =
    amount === "" || !product ? 0 : mode === "in" ? amount : mode === "out" ? -amount : amount - product.stock;
  const after = product ? product.stock + quantityDelta : 0;

  function choose(p: AdjustmentProduct) {
    setProductId(p.id);
    setError("");
    requestAnimationFrame(() => amountRef.current?.focus());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || quantityDelta === 0) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/inventory/adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantityDelta, reason }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(
        typeof data.error === "string" ? data.error : (data.error?.formErrors?.[0] ?? "Error al registrar el ajuste"),
      );
      return;
    }

    setProductId(null);
    setAmount("");
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
        {product ? (
          <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--adm-line-strong)] bg-[var(--adm-surface-2)]">
            <span className="w-11 h-11 rounded-lg bg-[#f0ede6] overflow-hidden grid place-items-center shrink-0">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageOff size={14} className="text-[var(--adm-ink-3)]" />
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-medium leading-snug truncate">{product.name}</span>
              <span className="block text-[12px] text-[var(--adm-ink-3)]">
                {product.sku && <span className="num">{product.sku} · </span>}
                stock <span className={`num font-semibold ${stockTone(product)}`}>{product.stock}</span>
                {product.minStock > 0 && <span className="num"> / mín. {product.minStock}</span>}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setProductId(null)}
              className="w-7 h-7 grid place-items-center rounded-lg text-[var(--adm-ink-3)] hover:text-[var(--adm-ink)] hover:bg-white transition"
              aria-label="Cambiar producto"
              title="Cambiar producto"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <ProductCombobox products={products} onPick={choose} />
        )}
      </div>

      <div className="adm-seg [&>*]:flex-1 [&>*]:justify-center">
        <button type="button" data-active={mode === "in"} onClick={() => setMode("in")}>
          + Entrada
        </button>
        <button type="button" data-active={mode === "out"} onClick={() => setMode("out")}>
          − Salida
        </button>
        <button type="button" data-active={mode === "count"} onClick={() => setMode("count")}>
          Conteo
        </button>
      </div>

      <div>
        <label className="adm-label" htmlFor="adj-amount">
          {mode === "count" ? "Unidades contadas" : "Cantidad"}
        </label>
        <input
          id="adj-amount"
          ref={amountRef}
          type="number"
          min={mode === "count" ? 0 : 1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value === "" ? "" : Math.max(0, Math.floor(Number(e.target.value))))}
          placeholder={mode === "count" ? "Lo que hay en la estantería" : "Unidades"}
          required
          className="adm-input num"
        />
      </div>

      {product && amount !== "" && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[var(--adm-surface-2)] text-[13px]">
          <span className="flex items-center gap-2 num">
            <span className="text-[var(--adm-ink-3)]">{product.stock}</span>
            <ArrowRight size={13} className="text-[var(--adm-ink-3)]" />
            <span className={`font-semibold ${after < 0 ? "text-[var(--adm-danger)]" : "text-[var(--adm-ink)]"}`}>{after}</span>
          </span>
          <span
            className={`num font-semibold ${
              quantityDelta > 0 ? "text-[var(--adm-ok)]" : quantityDelta < 0 ? "text-[var(--adm-danger)]" : "text-[var(--adm-ink-3)]"
            }`}
          >
            {quantityDelta === 0 ? "Sin diferencia" : quantityDelta > 0 ? `+${quantityDelta}` : quantityDelta}
          </span>
        </div>
      )}

      <div>
        <label className="adm-label" htmlFor="adj-reason">
          Motivo
        </label>
        <input
          id="adj-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej. Conteo físico del sábado"
          required
          className="adm-input"
        />
      </div>

      {error && <p className="adm-alert adm-alert-danger">{error}</p>}
      <button type="submit" disabled={loading || !product || quantityDelta === 0} className="adm-btn adm-btn-primary">
        {loading ? "Guardando…" : "Registrar ajuste"}
      </button>
    </form>
  );
}
