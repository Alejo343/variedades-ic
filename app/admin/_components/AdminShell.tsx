"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronRight, LogOut, Menu, Plus, Search, X, ExternalLink } from "lucide-react";
import { NAV, QUICK_ACTIONS, currentGroup, currentNavItem, isActive } from "../_lib/nav";
import { CommandPalette } from "./CommandPalette";

export function AdminShell({ user, children }: { user: { name: string; email: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Close the mobile drawer on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const item = currentNavItem(pathname);
  const group = currentGroup(pathname);

  return (
    <div className="adm min-h-screen lg:pl-[248px]">
      {/* Desktop sidebar */}
      <aside className="adm-sidebar hidden lg:flex fixed inset-y-0 left-0 w-[248px] flex-col z-30">
        <SidebarContent pathname={pathname} user={user} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="adm-overlay absolute inset-0 bg-[#0b1220]/50" onClick={() => setDrawerOpen(false)} />
          <aside className="adm-sidebar adm-drawer absolute inset-y-0 left-0 w-[272px] max-w-[85vw] flex flex-col shadow-2xl">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 w-8 h-8 grid place-items-center rounded-lg text-[var(--adm-nav-ink)] hover:bg-white/10"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
            <SidebarContent pathname={pathname} user={user} />
          </aside>
        </div>
      )}

      {/* Top bar */}
      <header className="adm-topbar sticky top-0 z-20 h-16 flex items-center gap-3 px-4 sm:px-6 lg:px-10">
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden adm-btn adm-btn-ghost w-10 px-0"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <nav aria-label="Ubicación" className="hidden sm:flex items-center gap-1.5 text-[13px] min-w-0">
          {group && <span className="text-[var(--adm-ink-3)]">{group}</span>}
          {group && item && <ChevronRight size={14} className="text-[var(--adm-ink-3)]" />}
          {item && (
            <Link href={item.href} className="font-medium text-[var(--adm-ink)] truncate hover:underline underline-offset-4">
              {item.label}
            </Link>
          )}
        </nav>

        <div className="flex-1" />

        <button
          onClick={() => setPaletteOpen(true)}
          className="adm-btn h-9 gap-2 text-[var(--adm-ink-3)] font-normal w-9 px-0 sm:w-64 sm:px-3 sm:justify-start"
          aria-label="Buscar"
        >
          <Search size={16} />
          <span className="hidden sm:inline flex-1 text-left text-[13.5px]">Buscar o ir a…</span>
          <span className="hidden sm:inline adm-kbd">Ctrl K</span>
        </button>

        <NewMenu />
      </header>

      <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-[1400px]">{children}</main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function SidebarContent({ pathname, user }: { pathname: string; user: { name: string; email: string } }) {
  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="h-16 px-5 flex items-center gap-3 shrink-0">
        <span className="relative w-9 h-9 rounded-xl grid place-items-center bg-gradient-to-br from-sky-400 to-sky-700 text-white font-bold text-[13px] shadow-[0_0_24px_rgba(56,189,248,.35)]">
          IC
        </span>
        <div className="leading-tight">
          <p className="font-display text-white font-semibold text-[15px]">IC Variedades</p>
          <p className="text-[11.5px] text-[#6b7890]">Gestión del negocio</p>
        </div>
      </div>

      <nav className="adm-sidebar-scroll flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((g) => (
          <div key={g.label}>
            <p className="adm-navgroup">{g.label}</p>
            <div className="flex flex-col gap-0.5">
              {g.items.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="adm-navlink" data-active={isActive(pathname, href)}>
                  <Icon />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[.06] shrink-0">
        <Link
          href="/"
          target="_blank"
          className="adm-navlink text-[13px]"
        >
          <ExternalLink />
          Ver tienda pública
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-xl px-2.5 py-2 bg-white/[.04]">
          <span className="w-8 h-8 rounded-full grid place-items-center bg-[#1e293b] text-[#cbd5e1] text-[12px] font-semibold shrink-0">
            {initials || "A"}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[13px] text-white font-medium truncate">{user.name}</p>
            <p className="text-[11.5px] text-[#6b7890] truncate">{user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-8 h-8 grid place-items-center rounded-lg text-[#8592aa] hover:text-white hover:bg-white/10 transition"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

function NewMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="adm-btn adm-btn-primary h-9" aria-expanded={open}>
        <Plus />
        <span className="hidden sm:inline">Nuevo</span>
      </button>
      {open && (
        <div className="adm-pop absolute right-0 mt-2 w-72 adm-card p-1.5 shadow-[var(--adm-shadow-lg)] z-40">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] text-[var(--adm-ink-2)] hover:bg-[#f4f2ed] hover:text-[var(--adm-ink)] transition"
            >
              <Icon size={16} className="text-[var(--adm-ink-3)]" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
