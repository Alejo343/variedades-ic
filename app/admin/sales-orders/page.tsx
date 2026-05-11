import Link from "next/link";
import { getAllSalesOrders } from "@/lib/db/queries/sales-orders";

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-blue-100 text-blue-700",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n / 100);
}

export default async function SalesOrdersPage() {
  const orders = await getAllSalesOrders();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos de clientes</h1>
        <Link
          href="/admin/sales-orders/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nuevo pedido
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">#</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Cliente</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Teléfono</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-right px-5 py-3 font-medium text-gray-600">Total</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  No hay pedidos registrados
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-gray-500">#{o.id}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{o.customerName}</td>
                <td className="px-5 py-3 text-gray-600">{o.customerPhone}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_STYLES[o.status] ?? "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-gray-700">
                  {o.totalPrice ? formatCOP(o.totalPrice) : "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/sales-orders/${o.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver
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
