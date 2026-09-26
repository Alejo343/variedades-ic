import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getPurchaseOrderById } from "@/lib/db/queries/purchase-orders";
import { getPurchaseOrderBalance, getPaymentsForOrder } from "@/lib/db/queries/purchase-payments";
import { getActiveCashAccounts } from "@/lib/db/queries/cash-accounts";
import { StatusActions } from "../_components/StatusActions";
import { PaymentForm } from "../_components/PaymentForm";

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  en_viaje: "bg-blue-100 text-blue-700",
  recibido: "bg-green-100 text-green-700",
  cancelado: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_viaje: "En viaje",
  recibido: "Recibido",
  cancelado: "Cancelado",
};

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPurchaseOrderById(Number(id));

  if (!order) notFound();

  const total = order.items.reduce(
    (sum, i) => sum + i.quantity * (i.unitCost ?? 0),
    0
  );

  const isCredito = order.purchaseType === "credito";
  const [balance, payments, accounts] = isCredito
    ? await Promise.all([getPurchaseOrderBalance(db, order.id), getPaymentsForOrder(order.id), getActiveCashAccounts()])
    : [null, [], []];

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/purchase-orders"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Pedidos de compra
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
        <Row label="Distribuidor" value={order.distributorName ?? "—"} />
        <Row label="Tipo de compra" value={isCredito ? "Crédito" : "Contado"} />
        <Row
          label="Fecha del pedido"
          value={new Date(order.orderDate).toLocaleDateString("es-CO")}
        />
        <Row
          label="Fecha esperada de recogida"
          value={
            order.expectedDate
              ? new Date(order.expectedDate).toLocaleDateString("es-CO")
              : "—"
          }
        />
        {order.notes && <Row label="Notas" value={order.notes} />}
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
              <th className="text-right px-5 py-3 font-medium text-gray-600">Costo unit.</th>
              <th className="text-right px-5 py-3 font-medium text-gray-600">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 text-gray-800">{item.productName}</td>
                <td className="px-5 py-3 text-right text-gray-700">{item.quantity}</td>
                <td className="px-5 py-3 text-right text-gray-700">
                  {item.unitCost ? formatCOP(item.unitCost) : "—"}
                </td>
                <td className="px-5 py-3 text-right text-gray-700">
                  {item.unitCost
                    ? formatCOP(item.quantity * item.unitCost)
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

      <StatusActions orderId={order.id} status={order.status} />

      {isCredito && balance && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">
            Cuenta por pagar
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-sm">
              <Row label="Costo total" value={formatCOP(balance.totalCost)} />
              <Row label="Pagado" value={formatCOP(balance.totalPaid)} />
              <Row label="Saldo pendiente" value={formatCOP(balance.pending)} />
            </div>

            {payments.length > 0 && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Fecha</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Monto</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Cuenta</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 text-gray-600">
                        {new Date(p.paidAt).toLocaleString("es-CO")}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-800">{formatCOP(p.amount)}</td>
                      <td className="px-3 py-2 text-gray-600">{p.accountName ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{p.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {order.status !== "cancelado" && (
              <PaymentForm orderId={order.id} pending={balance.pending} accounts={accounts} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-44 text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
