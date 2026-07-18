import Link from "next/link";
import { getAllSellers } from "@/lib/db/queries/sellers";

function formatCommission(type: string, value: number) {
  return type === "percentage" ? `${(value / 100).toFixed(2)}%` : `$${value.toLocaleString("es-CO")}/u`;
}

export default async function SellersPage() {
  const sellers = await getAllSellers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vendedores</h1>
        <Link
          href="/admin/sellers/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nuevo vendedor
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Ciudad</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Teléfono</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Comisión</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sellers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  No hay vendedores registrados
                </td>
              </tr>
            )}
            {sellers.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                <td className="px-5 py-3 text-gray-600">{s.city ?? "—"}</td>
                <td className="px-5 py-3 text-gray-600">{s.phone ?? "—"}</td>
                <td className="px-5 py-3 text-gray-600">
                  {formatCommission(s.commissionType, s.commissionValue)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {s.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/sellers/${s.id}/edit`}
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
