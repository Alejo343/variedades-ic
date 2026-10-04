import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getSalesOrderById } from "@/lib/db/queries/sales-orders";
import { getActiveCashAccounts } from "@/lib/db/queries/cash-accounts";
import { SalesStatusActions } from "../_components/SalesStatusActions";
import { Card, DefinitionList, Page, PageHeader, StatusBadge, StatusTimeline } from "../../_components/ui";
import { formatCOP, formatDateTime } from "../../_lib/format";

export default async function SalesOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, accounts] = await Promise.all([getSalesOrderById(Number(id)), getActiveCashAccounts()]);

  if (!order) notFound();

  const total = order.items.reduce((sum, i) => sum + i.quantity * (i.unitPrice ?? 0), 0);
  const waPhone = order.customerPhone.replace(/\D/g, "");
  const waLink = `https://wa.me/${waPhone.length === 10 ? `57${waPhone}` : waPhone}`;

  return (
    <Page>
      <PageHeader
        back={{ href: "/admin/sales-orders", label: "Pedidos por WhatsApp" }}
        eyebrow={`Pedido #${order.id}`}
        title={order.customerName}
        actions={
          <>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="adm-btn">
              <MessageCircle />
              Escribir por WhatsApp
            </a>
            <StatusBadge kind="sales" status={order.status} />
          </>
        }
      />

      <div className="adm-card p-5">
        <StatusTimeline
          current={order.status}
          steps={[
            { value: "pendiente", label: "Pendiente" },
            { value: "confirmado", label: "Confirmado" },
            { value: "entregado", label: "Entregado" },
          ]}
        />
        {(order.status === "pendiente" || order.status === "confirmado") && (
          <div className="mt-5 pt-5 border-t border-[var(--adm-line)]">
            {order.status === "pendiente" && (
              <p className="text-[13px] text-[var(--adm-ink-2)] mb-3">
                Al confirmar se descuenta el stock y el total entra como ingreso en la cuenta elegida.
              </p>
            )}
            <SalesStatusActions orderId={order.id} status={order.status} accounts={accounts} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-start">
        <Card title="Productos" flush>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="t-right">Cantidad</th>
                  <th className="t-right">Precio unit.</th>
                  <th className="t-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="t-strong">{item.productName}</td>
                    <td className="t-right num">{item.quantity}</td>
                    <td className="t-right num">{item.unitPrice ? formatCOP(item.unitPrice) : "—"}</td>
                    <td className="t-right num">{item.unitPrice ? formatCOP(item.quantity * item.unitPrice) : "—"}</td>
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

        <Card title="Cliente">
          <DefinitionList
            items={[
              { label: "Nombre", value: order.customerName },
              { label: "Teléfono", value: <span className="num">{order.customerPhone}</span> },
              { label: "Fecha", value: formatDateTime(order.createdAt) },
              ...(order.deliveryNote ? [{ label: "Entrega", value: order.deliveryNote }] : []),
              ...(order.notes ? [{ label: "Notas", value: order.notes }] : []),
            ]}
          />
        </Card>
      </div>
    </Page>
  );
}
