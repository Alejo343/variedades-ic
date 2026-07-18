import { getAllCashMovements, getCashBalance } from "@/lib/db/queries/cash";
import { CashMovementForm } from "./_components/CashMovementForm";

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  settlement: "Liquidación",
  sales_order: "Venta WhatsApp",
  direct_sale: "Venta en local",
};

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function CashPage() {
  const [movements, balance] = await Promise.all([getAllCashMovements(), getCashBalance()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Caja</h1>
        <div className="bg-white rounded-xl shadow-sm px-5 py-3">
          <p className="text-xs text-gray-500">Saldo actual</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCOP(balance)}
          </p>
        </div>
      </div>

      <CashMovementForm />

      <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Movimientos</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-2 font-medium">Fecha</th>
              <th className="pb-2 font-medium">Tipo</th>
              <th className="pb-2 font-medium">Monto</th>
              <th className="pb-2 font-medium">Concepto</th>
              <th className="pb-2 font-medium">Origen</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-b border-gray-50">
                <td className="py-2 text-gray-500">
                  {new Date(m.movementDate).toLocaleString("es-CO")}
                </td>
                <td className="py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      m.type === "ingreso" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {m.type === "ingreso" ? "Ingreso" : "Gasto"}
                  </span>
                </td>
                <td className={`py-2 font-medium ${m.type === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                  {m.type === "ingreso" ? "+" : "-"}
                  {formatCOP(m.amount)}
                </td>
                <td className="py-2 text-gray-700">{m.concept}</td>
                <td className="py-2 text-gray-500">
                  {m.sourceType ? (SOURCE_LABELS[m.sourceType] ?? m.sourceType) : "-"}
                </td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-400">
                  Sin movimientos todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
