import { getAllCategories } from "@/lib/db/queries/categories";
import { getAllProducts } from "@/lib/db/queries/products";

export default async function AdminDashboard() {
  const [categories, products] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);

  const activeProducts = products.filter((p) => p.active).length;
  const featuredProducts = products.filter((p) => p.featured).length;
  const lowStock = products.filter((p) => p.stock <= 5 && p.active).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Categorías" value={categories.length} />
        <StatCard label="Productos activos" value={activeProducts} />
        <StatCard label="Destacados" value={featuredProducts} />
        <StatCard label="Stock bajo (≤5)" value={lowStock} color="text-orange-600" />
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
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
