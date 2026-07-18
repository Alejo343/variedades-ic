import Link from "next/link";
import { getAllSettlements } from "@/lib/db/queries/settlements";
import { LiquidateButton } from "./_components/LiquidateButton";

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function SettlementsPage() {
  const settlements = await getAllSettlements();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Liquidaciones</h1>
        <Link
          href="/admin/settlements/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nueva liquidación
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Vendedor</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Ventas</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Comisión</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Pérdidas</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">A entregar</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {settlements.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                  No hay liquidaciones registradas
                </td>
              </tr>
            )}
            {settlements.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-gray-600">{s.periodDate}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{s.sellerName ?? "—"}</td>
                <td className="px-5 py-3 text-gray-600">{formatCOP(s.totalSales)}</td>
                <td className="px-5 py-3 text-gray-600">{formatCOP(s.totalCommission)}</td>
                <td className="px-5 py-3 text-gray-600">{formatCOP(s.totalLosses)}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{formatCOP(s.amountDue)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "liquidada" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {s.status === "liquidada" ? "Liquidada" : "Pendiente"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {s.status === "pendiente" && <LiquidateButton id={s.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
