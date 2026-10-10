"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { ACCOUNT_ITEM, NAV, QUICK_ACTIONS, type NavItem } from "../_lib/nav";

type Entry = NavItem & { section: string };

const ENTRIES: Entry[] = [
  ...QUICK_ACTIONS.map((a) => ({ ...a, section: "Acciones" })),
  ...NAV.flatMap((g) => g.items.map((it) => ({ ...it, section: g.label }))),
  { ...ACCOUNT_ITEM, section: "Cuenta" },
];

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Ctrl+K jump-to for every section and creation shortcut of the panel. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <PaletteDialog onClose={onClose} />;
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return ENTRIES;
    return ENTRIES.filter((e) => normalize(`${e.label} ${e.section} ${e.keywords ?? ""}`).includes(q));
  }, [query]);

  const safeIndex = Math.min(index, Math.max(results.length - 1, 0));

  function go(entry: Entry | undefined) {
    if (!entry) return;
    onClose();
    router.push(entry.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[safeIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${safeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [safeIndex]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Buscar">
      <div className="adm-overlay absolute inset-0 bg-[#0b1220]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="adm-pop relative w-full max-w-xl adm-card overflow-hidden shadow-[var(--adm-shadow-lg)]" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--adm-line)]">
          <Search size={18} className="text-[var(--adm-ink-3)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder="Buscar sección o acción…"
            className="flex-1 bg-transparent outline-none text-[15px] text-[var(--adm-ink)] placeholder:text-[#b0aca4]"
          />
          <span className="adm-kbd">Esc</span>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-[var(--adm-ink-3)]">Sin resultados para “{query}”.</p>}
          {results.map((r, i) => {
            const header = i === 0 || results[i - 1].section !== r.section ? r.section : null;
            const Icon = r.icon;
            return (
              <div key={`${r.section}-${r.href}`}>
                {header && <p className="adm-eyebrow px-3 pt-3 pb-1.5">{header}</p>}
                <button
                  data-idx={i}
                  onMouseMove={() => setIndex(i)}
                  onClick={() => go(r)}
                  className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg text-left text-[14px] transition ${
                    i === safeIndex ? "bg-[var(--adm-brand-soft)] text-[var(--adm-ink)]" : "text-[var(--adm-ink-2)]"
                  }`}
                >
                  <Icon size={16} className={i === safeIndex ? "text-[var(--adm-brand)]" : "text-[var(--adm-ink-3)]"} />
                  <span className="flex-1">{r.label}</span>
                  {i === safeIndex && <CornerDownLeft size={14} className="text-[var(--adm-ink-3)]" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
