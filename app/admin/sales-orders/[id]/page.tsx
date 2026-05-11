import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalesOrderById } from "@/lib/db/queries/sales-orders";
import { SalesStatusActions } from "../_components/SalesStatusActions";

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

export default async function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getSalesOrderById(Number(id));

  if (!order) notFound();

  const total = order.items.reduce(
    (sum, i) => sum + i.quantity * (i.unitPrice ?? 0),
    0
  );

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/sales-orders"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Pedidos de clientes
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            Pedido #{order.id}
          </h1>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-500"
          }`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-3 text-sm">
        <Row label="Cliente" value={order.customerName} />
        <Row label="Teléfono" value={order.customerPhone} />
        {order.deliveryNote && <Row label="Entrega" value={order.deliveryNote} />}
        {order.notes && <Row label="Notas" value={order.notes} />}
        <Row
          label="Fecha"
          value={new Date(order.createdAt).toLocaleDateString("es-CO")}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">
          Productos
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Producto</th>
              <th className="text-right px-5 py-3 font-medium text-gray-600">Cantidad</th>
              <th className="text-right px-5 py-3 font-medium text-gray-600">Precio unit.</th>
              <th className="text-right px-5 py-3 font-medium text-gray-600">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 text-gray-800">{item.productName}</td>
                <td className="px-5 py-3 text-right text-gray-700">{item.quantity}</td>
                <td className="px-5 py-3 text-right text-gray-700">
                  {item.unitPrice ? formatCOP(item.unitPrice) : "—"}
                </td>
                <td className="px-5 py-3 text-right text-gray-700">
                  {item.unitPrice
                    ? formatCOP(item.quantity * item.unitPrice)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          {total > 0 && (
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={3} className="px-5 py-3 text-right font-semibold text-gray-700">
                  Total
                </td>
                <td className="px-5 py-3 text-right font-bold text-gray-800">
                  {formatCOP(total)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <SalesStatusActions orderId={order.id} status={order.status} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-28 text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
