import Link from "next/link";
import { getAllSellerLosses } from "@/lib/db/queries/seller-losses";

const TYPE_LABELS: Record<string, string> = {
  perdida: "Pérdida",
  dano: "Daño",
  robo: "Robo",
};

export default async function SellerLossesPage() {
  const losses = await getAllSellerLosses();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pérdidas, daños y robos de vendedores</h1>
        <Link
          href="/admin/seller-losses/new"
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nuevo registro
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Vendedor</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {losses.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                  No hay registros
                </td>
              </tr>
            )}
            {losses.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-gray-600">{new Date(l.lossDate).toLocaleString("es-CO")}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{l.sellerName ?? "—"}</td>
                <td className="px-5 py-3 text-gray-500">{TYPE_LABELS[l.type] ?? l.type}</td>
                <td className="px-5 py-3 text-gray-500">{l.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
