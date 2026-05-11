import Link from "next/link";
import { getAllDistributors } from "@/lib/db/queries/distributors";

export default async function DistributorsPage() {
  const distributors = await getAllDistributors();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Distribuidores</h1>
        <Link
          href="/admin/distributors/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nuevo distribuidor
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Ciudad</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Teléfono</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {distributors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  No hay distribuidores registrados
                </td>
              </tr>
            )}
            {distributors.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 font-medium text-gray-800">{d.name}</td>
                <td className="px-5 py-3 text-gray-600">{d.city ?? "—"}</td>
                <td className="px-5 py-3 text-gray-600">{d.phone ?? "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      d.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {d.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/distributors/${d.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
