import {
  LayoutDashboard,
  BarChart3,
  Package,
  Tags,
  Warehouse,
  Truck,
  ShoppingCart,
  MessageCircle,
  Store,
  Users,
  PackageOpen,
  HandCoins,
  Undo2,
  ShieldAlert,
  ReceiptText,
  Wallet,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; keywords?: string };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    label: "General",
    items: [
      { href: "/admin", label: "Inicio", icon: LayoutDashboard, keywords: "dashboard resumen" },
      { href: "/admin/reports", label: "Reportes", icon: BarChart3, keywords: "utilidad informes" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/admin/products", label: "Productos", icon: Package, keywords: "sku catalogo" },
      { href: "/admin/categories", label: "Categorías", icon: Tags },
      { href: "/admin/inventory", label: "Inventario", icon: Warehouse, keywords: "stock ajuste movimientos" },
    ],
  },
  {
    label: "Ventas",
    items: [
      { href: "/admin/direct-sales", label: "Ventas en local", icon: Store, keywords: "pos mostrador cobrar" },
      { href: "/admin/sales-orders", label: "Pedidos WhatsApp", icon: MessageCircle, keywords: "ventas clientes" },
    ],
  },
  {
    label: "Compras",
    items: [
      { href: "/admin/purchase-orders", label: "Pedidos de compra", icon: ShoppingCart, keywords: "excel credito" },
      { href: "/admin/distributors", label: "Distribuidores", icon: Truck, keywords: "proveedores" },
    ],
  },
  {
    label: "Vendedores",
    items: [
      { href: "/admin/sellers", label: "Vendedores", icon: Users, keywords: "consignacion" },
      { href: "/admin/deliveries", label: "Entregas", icon: PackageOpen },
      { href: "/admin/seller-sales", label: "Ventas de vendedores", icon: HandCoins },
      { href: "/admin/seller-returns", label: "Devoluciones", icon: Undo2 },
      { href: "/admin/seller-losses", label: "Pérdidas y daños", icon: ShieldAlert, keywords: "robo dano perdida" },
      { href: "/admin/settlements", label: "Liquidaciones", icon: ReceiptText, keywords: "comision cierre" },
    ],
  },
  {
    label: "Finanzas",
    items: [{ href: "/admin/cash", label: "Caja", icon: Wallet, keywords: "cuentas ingresos gastos saldo" }],
  },
];

/** Shortcuts to create things, shown in the command palette and the "Nuevo" menu. */
export const QUICK_ACTIONS: NavItem[] = [
  { href: "/admin/direct-sales/new", label: "Nueva venta en local", icon: Store, keywords: "cobrar pos" },
  { href: "/admin/products/new", label: "Nuevo producto", icon: Package },
  { href: "/admin/products/import", label: "Importar productos desde Excel", icon: FileSpreadsheet, keywords: "plantilla cargar catalogo masivo" },
  { href: "/admin/purchase-orders/new", label: "Nuevo pedido de compra", icon: ShoppingCart },
  { href: "/admin/sales-orders/new", label: "Nuevo pedido WhatsApp", icon: MessageCircle },
  { href: "/admin/deliveries/new", label: "Entregar a vendedor", icon: PackageOpen },
  { href: "/admin/seller-sales/new", label: "Registrar venta de vendedor", icon: HandCoins },
  { href: "/admin/settlements/new", label: "Nueva liquidación", icon: ReceiptText },
];

export function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
}

export function currentNavItem(pathname: string): NavItem | undefined {
  let best: NavItem | undefined;
  for (const g of NAV)
    for (const it of g.items)
      if (isActive(pathname, it.href) && (!best || it.href.length > best.href.length)) best = it;
  return best;
}

export function currentGroup(pathname: string): string | undefined {
  const item = currentNavItem(pathname);
  return NAV.find((g) => g.items.includes(item!))?.label;
}
