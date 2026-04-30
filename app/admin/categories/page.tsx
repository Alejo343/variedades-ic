import Link from "next/link";
import { getAllCategories } from "@/lib/db/queries/categories";

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
        <Link
          href="/admin/categories/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nueva categoría
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Color</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                <td className="px-4 py-3 text-gray-500">{cat.slug}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ background: cat.color ?? "#000" }}
                    />
                    <span className="text-gray-500">{cat.color}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      cat.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {cat.active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/categories/${cat.id}/edit`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No hay categorías aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
