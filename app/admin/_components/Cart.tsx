"use client";

import { useMemo, useRef, useState } from "react";
import { ImageOff, Minus, Plus, Search, Trash2, ShoppingBag } from "lucide-react";
import { formatCOP } from "../_lib/format";

// Shared "ticket" building blocks for every form that picks products and
// quantities (venta en local, entregas, ventas/devoluciones/pérdidas de
// vendedor). UI only — each form still owns its payload and API call.

export type CartProduct = {
  id: number;
  name: string;
  sku?: string | null;
  /** Default unit value for a new line (sale price or cost, depending on the form). */
  unitValue: number;
  /** Max units that can go in the cart; undefined = no limit shown. */
  available?: number;
  imageUrl?: string | null;
};

export type CartLine = { productId: number; quantity: number; unitValue: number };

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.quantity * l.unitValue, 0);
}

export function cartUnits(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.quantity, 0);
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Adds one unit of `product` (or a new line), respecting `available`. Returns the same array if full. */
export function addToCart(lines: CartLine[], product: CartProduct): CartLine[] {
  const existing = lines.find((l) => l.productId === product.id);
  if (existing) {
    if (product.available !== undefined && existing.quantity >= product.available) return lines;
    return lines.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
  }
  if (product.available !== undefined && product.available <= 0) return lines;
  return [...lines, { productId: product.id, quantity: 1, unitValue: product.unitValue }];
}

/**
 * Type-ahead product finder. Enter adds the highlighted product; an exact SKU
 * match wins, so a barcode scanner (types the code + Enter) works out of the box.
 */
export function ProductSearch({
  products,
  lines,
  onPick,
  valueLabel = "Precio",
  emptyText = "No hay productos disponibles.",
}: {
  products: CartProduct[];
  lines: CartLine[];
  onPick: (p: CartProduct) => void;
  valueLabel?: string | null;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const inCart = useMemo(() => new Map(lines.map((l) => [l.productId, l.quantity])), [lines]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    const list = q ? products.filter((p) => normalize(`${p.name} ${p.sku ?? ""}`).includes(q)) : products;
    // Out-of-stock products sink to the bottom so the first highlighted row is always pickable.
    const outOfStock = (p: CartProduct) => p.available !== undefined && p.available <= 0;
    return [...list.filter((p) => !outOfStock(p)), ...list.filter(outOfStock)].slice(0, 60);
  }, [products, query]);

  const safeIndex = Math.min(index, Math.max(results.length - 1, 0));

  function remaining(p: CartProduct) {
    return p.available === undefined ? Infinity : p.available - (inCart.get(p.id) ?? 0);
  }

  function pick(p: CartProduct | undefined) {
    if (!p || remaining(p) <= 0) return;
    onPick(p);
    setQuery("");
    setIndex(0);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
      scrollTo(safeIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
      scrollTo(safeIndex - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const q = query.trim().toLowerCase();
      const exact = q ? products.find((p) => p.sku?.toLowerCase() === q) : undefined;
      pick(exact ?? results[safeIndex]);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  }

  function scrollTo(i: number) {
    listRef.current?.querySelector(`[data-idx="${i}"]`)?.scrollIntoView({ block: "nearest" });
  }

  return (
    <div className="flex flex-col min-h-0">
      <div className="relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--adm-ink-3)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Buscar producto por nombre o SKU…"
          className="adm-input h-12 pl-10 text-[15px]"
          autoComplete="off"
          aria-label="Buscar producto"
        />
      </div>
      <p className="text-[11.5px] text-[var(--adm-ink-3)] mt-2 mb-3 flex gap-3">
        <span>
          <span className="adm-kbd">↑</span> <span className="adm-kbd">↓</span> moverse
        </span>
        <span>
          <span className="adm-kbd">Enter</span> agregar
        </span>
      </p>

      <div ref={listRef} className="flex-1 overflow-y-auto -mx-1 px-1 max-h-[420px] lg:max-h-[calc(100vh-360px)]">
        {products.length === 0 && <p className="py-10 text-center text-sm text-[var(--adm-ink-3)]">{emptyText}</p>}
        {products.length > 0 && results.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--adm-ink-3)]">Sin resultados para “{query}”.</p>
        )}
        <ul className="flex flex-col gap-1">
          {results.map((p, i) => {
            const left = remaining(p);
            const disabled = left <= 0;
            const qty = inCart.get(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  data-idx={i}
                  onClick={() => pick(p)}
                  onMouseMove={() => setIndex(i)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition border ${
                    i === safeIndex && !disabled
                      ? "bg-[var(--adm-brand-soft)] border-[#bfe2f6]"
                      : "border-transparent hover:bg-[var(--adm-surface-2)]"
                  } ${disabled ? "opacity-45 cursor-not-allowed" : ""}`}
                >
                  <span className="w-10 h-10 rounded-lg bg-[#f0ede6] overflow-hidden grid place-items-center shrink-0">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <ImageOff size={14} className="text-[var(--adm-ink-3)]" />
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-medium text-[var(--adm-ink)] truncate">{p.name}</span>
                    <span className="block text-[12px] text-[var(--adm-ink-3)]">
                      {p.sku && <span className="num">{p.sku}</span>}
                      {p.available !== undefined && (
                        <span className={p.available <= 0 ? "text-[var(--adm-danger)]" : ""}>
                          {p.sku ? " · " : ""}
                          {p.available <= 0 ? "sin existencias" : `disp. ${p.available}`}
                        </span>
                      )}
                    </span>
                  </span>
                  {qty ? (
                    <span className="num text-[12px] font-semibold px-2 h-6 rounded-md bg-[var(--adm-ink)] text-white grid place-items-center">
                      ×{qty}
                    </span>
                  ) : null}
                  {valueLabel && <span className="num text-[13.5px] font-semibold shrink-0">{formatCOP(p.unitValue)}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** The ticket: one row per product with a quantity stepper and optional unit value. */
export function CartLines({
  products,
  lines,
  onChange,
  valueLabel = "Precio",
  emptyText = "Busca y agrega productos al ticket.",
}: {
  products: CartProduct[];
  lines: CartLine[];
  onChange: (lines: CartLine[]) => void;
  valueLabel?: string | null;
  emptyText?: string;
}) {
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function update(productId: number, patch: Partial<CartLine>) {
    onChange(lines.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-10 px-4 border border-dashed border-[var(--adm-line-strong)] rounded-xl">
        <ShoppingBag size={22} className="text-[var(--adm-ink-3)] mb-2" />
        <p className="text-[13.5px] text-[var(--adm-ink-3)]">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-[#f0ede6]">
      {lines.map((l) => {
        const p = byId.get(l.productId);
        const max = p?.available;
        return (
          <li key={l.productId} className="py-3 first:pt-0">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium leading-snug">{p?.name ?? `#${l.productId}`}</p>
                {max !== undefined && <p className="text-[11.5px] text-[var(--adm-ink-3)]">máx. {max}</p>}
              </div>
              <button
                type="button"
                onClick={() => onChange(lines.filter((x) => x.productId !== l.productId))}
                className="w-7 h-7 grid place-items-center rounded-lg text-[var(--adm-ink-3)] hover:text-[var(--adm-danger)] hover:bg-[var(--adm-danger-soft)] transition"
                aria-label="Quitar"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center rounded-lg border border-[var(--adm-line-strong)] bg-white overflow-hidden h-9">
                <button
                  type="button"
                  onClick={() => (l.quantity > 1 ? update(l.productId, { quantity: l.quantity - 1 }) : undefined)}
                  disabled={l.quantity <= 1}
                  className="w-8 h-full grid place-items-center text-[var(--adm-ink-2)] hover:bg-[var(--adm-surface-2)] disabled:opacity-30"
                  aria-label="Menos"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min={1}
                  max={max}
                  value={l.quantity}
                  onChange={(e) => {
                    const n = Math.max(1, Math.floor(Number(e.target.value) || 1));
                    update(l.productId, { quantity: max !== undefined ? Math.min(n, max) : n });
                  }}
                  className="num w-11 h-full text-center text-[14px] font-semibold outline-none border-x border-[var(--adm-line)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Cantidad"
                />
                <button
                  type="button"
                  onClick={() => update(l.productId, { quantity: l.quantity + 1 })}
                  disabled={max !== undefined && l.quantity >= max}
                  className="w-8 h-full grid place-items-center text-[var(--adm-ink-2)] hover:bg-[var(--adm-surface-2)] disabled:opacity-30"
                  aria-label="Más"
                >
                  <Plus size={14} />
                </button>
              </div>
              {valueLabel ? (
                <>
                  <span className="text-[var(--adm-ink-3)] text-[13px]">×</span>
                  <div className="relative flex-1 min-w-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[var(--adm-ink-3)]">$</span>
                    <input
                      type="number"
                      min={0}
                      value={l.unitValue}
                      onChange={(e) => update(l.productId, { unitValue: Math.max(0, Number(e.target.value) || 0) })}
                      className="adm-input num h-9 pl-6 text-[13.5px]"
                      aria-label={valueLabel}
                      title={valueLabel}
                    />
                  </div>
                  <span className="num text-[14px] font-semibold w-24 text-right shrink-0">{formatCOP(l.quantity * l.unitValue)}</span>
                </>
              ) : (
                <span className="text-[13px] text-[var(--adm-ink-3)]">unidades</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Two-column POS shell: product finder on the left, sticky ticket on the right. */
export function PosLayout({ finder, ticket }: { finder: React.ReactNode; ticket: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-4 items-start">
      <section className="adm-card p-5">{finder}</section>
      <section className="adm-card lg:sticky lg:top-24 flex flex-col">{ticket}</section>
    </div>
  );
}
