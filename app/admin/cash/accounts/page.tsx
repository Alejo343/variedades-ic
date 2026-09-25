import Link from "next/link";
import { getCashAccountsWithBalances } from "@/lib/db/queries/cash-accounts";

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function CashAccountsPage() {
  const accounts = await getCashAccountsWithBalances();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/cash" className="text-sm text-blue-600 hover:text-blue-800">
            ← Caja
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">Cuentas de caja</h1>
        </div>
        <Link
          href="/admin/cash/accounts/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nueva cuenta
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-right px-5 py-3 font-medium text-gray-600">Saldo</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  No hay cuentas registradas
                </td>
              </tr>
            )}
            {accounts.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 font-medium text-gray-800">{a.name}</td>
                <td className="px-5 py-3 text-gray-600 capitalize">{a.type}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {a.active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td
                  className={`px-5 py-3 text-right font-medium ${
                    a.balance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCOP(a.balance)}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/cash/accounts/${a.id}/edit`} className="text-blue-600 hover:text-blue-800 font-medium">
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
