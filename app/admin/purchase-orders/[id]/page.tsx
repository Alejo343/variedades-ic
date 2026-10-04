import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPurchaseOrderById } from "@/lib/db/queries/purchase-orders";
import { getPurchaseOrderBalance, getPaymentsForOrder } from "@/lib/db/queries/purchase-payments";
import { getActiveCashAccounts } from "@/lib/db/queries/cash-accounts";
import { StatusActions } from "../_components/StatusActions";
import { PaymentForm } from "../_components/PaymentForm";
import { Badge, Card, DefinitionList, Page, PageHeader, StatusBadge, StatusTimeline } from "../../_components/ui";
import { formatCOP, formatDate, formatDateTime } from "../../_lib/format";

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getPurchaseOrderById(Number(id));

  if (!order) notFound();

  const total = order.items.reduce((sum, i) => sum + i.quantity * (i.unitCost ?? 0), 0);
  const units = order.items.reduce((sum, i) => sum + i.quantity, 0);

  const isCredito = order.purchaseType === "credito";
  const [balance, payments, accounts] = isCredito
    ? await Promise.all([getPurchaseOrderBalance(db, order.id), getPaymentsForOrder(order.id), getActiveCashAccounts()])
    : [null, [], []];
  const paidPct = balance && balance.totalCost > 0 ? Math.min(100, (balance.totalPaid / balance.totalCost) * 100) : 0;

  return (
    <Page>
      <PageHeader
        back={{ href: "/admin/purchase-orders", label: "Pedidos de compra" }}
        eyebrow={`Pedido de compra #${order.id}`}
        title={order.distributorName ?? "Sin distribuidor"}
        actions={
          <>
            {isCredito ? (
              <Badge tone="violet" plain>
                Crédito
              </Badge>
            ) : (
              <Badge plain>Contado</Badge>
            )}
            <StatusBadge kind="purchase" status={order.status} />
          </>
        }
      />

      <div className="adm-card p-5">
        <StatusTimeline
          current={order.status}
          steps={[
            { value: "pendiente", label: "Pendiente" },
            { value: "en_viaje", label: "En viaje" },
            { value: "recibido", label: "Recibido" },
          ]}
        />
        {order.status !== "recibido" && order.status !== "cancelado" && (
          <div className="mt-5 pt-5 border-t border-[var(--adm-line)]">
            <StatusActions orderId={order.id} status={order.status} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 items-start">
        <Card title="Productos" description={`${order.items.length} productos · ${units} unidades`} flush>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="t-right">Cantidad</th>
                  <th className="t-right">Costo unit.</th>
                  <th className="t-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="t-strong">{item.productName}</td>
                    <td className="t-right num">{item.quantity}</td>
                    <td className="t-right num">{item.unitCost ? formatCOP(item.unitCost) : "—"}</td>
                    <td className="t-right num">{item.unitCost ? formatCOP(item.quantity * item.unitCost) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="t-right">
                    Total
                  </td>
                  <td className="t-right num text-[15px]">{formatCOP(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Detalles">
            <DefinitionList
              items={[
                { label: "Fecha del pedido", value: formatDate(order.orderDate) },
                { label: "Recogida esperada", value: formatDate(order.expectedDate) },
                { label: "Tipo de compra", value: isCredito ? "Crédito" : "Contado" },
                { label: "Total", value: <span className="num font-semibold">{formatCOP(total)}</span> },
                ...(order.notes ? [{ label: "Notas", value: order.notes }] : []),
              ]}
            />
          </Card>

          {isCredito && balance && (
            <Card title="Cuenta por pagar">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="adm-eyebrow">Saldo pendiente</p>
                  <p className={`num text-[26px] font-semibold mt-1 ${balance.pending > 0 ? "text-[var(--adm-warn)]" : "text-[var(--adm-ok)]"}`}>
                    {formatCOP(balance.pending)}
                  </p>
                </div>
                {balance.pending <= 0 && <Badge tone="ok">Pagado</Badge>}
              </div>
              <div className="h-2 rounded-full bg-[#efece5] mt-4 overflow-hidden">
                <div className="h-full rounded-full bg-[var(--adm-ok)]" style={{ width: `${paidPct}%` }} />
              </div>
              <div className="flex justify-between text-[12.5px] text-[var(--adm-ink-3)] mt-2">
                <span className="num">Pagado {formatCOP(balance.totalPaid)}</span>
                <span className="num">de {formatCOP(balance.totalCost)}</span>
              </div>

              {payments.length > 0 && (
                <ul className="mt-5 flex flex-col divide-y divide-[#f0ede6] border-t border-[var(--adm-line)]">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[13.5px]">{formatDateTime(p.paidAt)}</p>
                        <p className="text-[12px] text-[var(--adm-ink-3)] truncate">
                          {p.accountName ?? "—"}
                          {p.notes ? ` · ${p.notes}` : ""}
                        </p>
                      </div>
                      <span className="num font-semibold text-[14px]">{formatCOP(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {order.status !== "cancelado" && balance.pending > 0 && (
                <div className="mt-5 pt-5 border-t border-[var(--adm-line)]">
                  <p className="adm-label">Registrar pago</p>
                  <PaymentForm orderId={order.id} pending={balance.pending} accounts={accounts} />
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
