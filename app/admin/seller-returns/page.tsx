import Link from "next/link";
import { getAllSellerReturns } from "@/lib/db/queries/seller-returns";

export default async function SellerReturnsPage() {
  const returns = await getAllSellerReturns();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Devoluciones de vendedores</h1>
        <Link
          href="/admin/seller-returns/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nueva devolución
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Vendedor</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {returns.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                  No hay devoluciones registradas
                </td>
              </tr>
            )}
            {returns.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-gray-600">{new Date(r.returnDate).toLocaleString("es-CO")}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{r.sellerName ?? "—"}</td>
                <td className="px-5 py-3 text-gray-500">{r.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
