import { getAllCategories } from "@/lib/db/queries/categories";
import { getAllProducts } from "@/lib/db/queries/products";
import { getAllPurchaseOrders } from "@/lib/db/queries/purchase-orders";
import { getAllSalesOrders } from "@/lib/db/queries/sales-orders";
import { getLowStock, getOutOfStock } from "@/lib/db/queries/inventory";
import { getCashBalance } from "@/lib/db/queries/cash";

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminDashboard() {
  const [categories, products, purchaseOrders, salesOrders, lowStock, outOfStock, cashBalance] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
    getAllPurchaseOrders(),
    getAllSalesOrders(),
    getLowStock(),
    getOutOfStock(),
    getCashBalance(),
  ]);

  const activeProducts = products.filter((p) => p.active).length;
  const featuredProducts = products.filter((p) => p.featured).length;
  const pendingPurchases = purchaseOrders.filter(
    (o) => o.status === "pendiente" || o.status === "en_viaje"
  ).length;
  const pendingSales = salesOrders.filter(
    (o) => o.status === "pendiente" || o.status === "confirmado"
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Categorías" value={categories.length} />
        <StatCard label="Productos activos" value={activeProducts} />
        <StatCard label="Destacados" value={featuredProducts} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Stock mínimo" value={lowStock.length} color="text-orange-600" />
        <StatCard label="Agotados" value={outOfStock.length} color="text-red-600" />
        <StatCard label="Compras pendientes" value={pendingPurchases} color="text-blue-600" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Ventas sin entregar" value={pendingSales} color="text-amber-600" />
        <StatCard
          label="Saldo en caja"
          value={formatCOP(cashBalance)}
          color={cashBalance >= 0 ? "text-green-600" : "text-red-600"}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "text-gray-800",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
