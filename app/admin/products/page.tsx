import Link from "next/link";
import { getAllProducts } from "@/lib/db/queries/products";

function formatCOP(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);
}

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <Link
          href="/admin/products/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Precio</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {p.name}
                  {p.featured && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                      Destacado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.categoryName ?? "—"}</td>
                <td className="px-4 py-3 text-gray-800">{formatCOP(p.price)}</td>
                <td
                  className={`px-4 py-3 font-medium ${
                    p.stock <= 5 ? "text-orange-600" : "text-gray-800"
                  }`}
                >
                  {p.stock}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No hay productos aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
