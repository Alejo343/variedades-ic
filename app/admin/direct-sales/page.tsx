import Link from "next/link";
import { getAllDirectSales } from "@/lib/db/queries/direct-sales";

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function DirectSalesPage() {
  const sales = await getAllDirectSales();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ventas en local</h1>
        <Link
          href="/admin/direct-sales/new"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nueva venta
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Cuenta</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sales.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                  No hay ventas en local registradas
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-gray-600">{new Date(s.saleDate).toLocaleString("es-CO")}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{formatCOP(s.totalAmount)}</td>
                <td className="px-5 py-3 text-gray-500">{s.accountName ?? "—"}</td>
                <td className="px-5 py-3 text-gray-500">{s.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
