"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/categories", label: "Categorías" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/inventory", label: "Inventario" },
  { href: "/admin/distributors", label: "Distribuidores" },
  { href: "/admin/purchase-orders", label: "Compras" },
  { href: "/admin/sales-orders", label: "Ventas" },
  { href: "/admin/direct-sales", label: "Ventas en local" },
  { href: "/admin/sellers", label: "Vendedores" },
  { href: "/admin/deliveries", label: "Entregas" },
  { href: "/admin/seller-sales", label: "Ventas de vendedores" },
  { href: "/admin/cash", label: "Caja" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
      {links.map(({ href, label }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
