import Link from "next/link";
import { notFound } from "next/navigation";
import { HandCoins, MapPin, Package, PackageOpen, Pencil, Phone, ReceiptText, ShieldAlert, Store, Undo2 } from "lucide-react";
import { getSellerById } from "@/lib/db/queries/sellers";
import { getSellerInventory } from "@/lib/db/queries/seller-inventory";
import { getAllSellersSalesSummary, getAllSellerSales } from "@/lib/db/queries/seller-sales";
import { getAllDirectSales } from "@/lib/db/queries/direct-sales";
import { getAllSettlements } from "@/lib/db/queries/settlements";
import { getDeviceSessions, getUserBySellerId } from "@/lib/db/queries/users";
import { SellerAccessCard } from "../_components/SellerAccessCard";
import { CommissionPaymentCard } from "../_components/CommissionPaymentCard";
import { getCommissionPaymentsForSeller } from "@/lib/db/queries/commission-payments";
import { getActiveCashAccounts } from "@/lib/db/queries/cash-accounts";
import { Badge, ButtonLink, Card, EmptyState, Page, PageHeader, Stat, StatusBadge } from "../../_components/ui";
import { formatCOP, formatDateTime, formatPlainDate } from "../../_lib/format";

function formatCommission(type: string, value: number) {
  return type === "percentage" ? `${(value / 100).toLocaleString("es-CO", { maximumFractionDigits: 2 })}%` : `${formatCOP(value)} por unidad`;
}

export default async function SellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sellerId = Number(id);
  const [[seller], inventory, [user], summaries, sales, directSales, settlements] = await Promise.all([
    getSellerById(sellerId),
    getSellerInventory(sellerId),
    getUserBySellerId(sellerId),
    getAllSellersSalesSummary(),
    getAllSellerSales(),
    getAllDirectSales(),
    getAllSettlements(),
  ]);

  if (!seller) notFound();

  const sessions = user ? await getDeviceSessions(user.id) : [];
  const [commissionPayments, accounts] =
    seller.inventoryMode === "store" ? await Promise.all([getCommissionPaymentsForSeller(sellerId), getActiveCashAccounts()]) : [[], []];
  const summary = summaries.find((s) => s.sellerId === sellerId);
  // A store seller sells the principal inventory as in-store sales (no
  // deliveries, no settlements); a consignment seller, from their own stock.
  const isStore = seller.inventoryMode === "store";
  const recentSales = (isStore ? directSales : sales).filter((s) => s.sellerId === sellerId).slice(0, 6);
  const sellerSettlements = settlements.filter((s) => s.sellerId === sellerId);
  const pendingSettlement = sellerSettlements.filter((s) => s.status === "pendiente").reduce((t, s) => t + s.amountDue, 0);

  const units = inventory.reduce((s, i) => s + i.quantity, 0);
  const valueAtPrice = inventory.reduce((s, i) => s + i.quantity * (i.productPrice ?? 0), 0);
  const valueAtCost = inventory.reduce((s, i) => s + i.quantity * (i.productPurchasePrice ?? 0), 0);

  const q = `?sellerId=${seller.id}`;

  return (
    <Page>
      <PageHeader
        back={{ href: "/admin/sellers", label: "Vendedores" }}
        title={
          <span className="inline-flex items-center gap-3">
            {seller.name}
            {isStore && <Badge>Tienda principal</Badge>}
            {!seller.active && <Badge>Inactivo</Badge>}
          </span>
        }
        description={
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {seller.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} />
                {seller.city}
              </span>
            )}
            {seller.phone && (
              <span className="inline-flex items-center gap-1.5 num">
                <Phone size={14} />
                {seller.phone}
              </span>
            )}
            <span>Comisión {formatCommission(seller.commissionType, seller.commissionValue)}</span>
          </span>
        }
        actions={
          <ButtonLink href={`/admin/sellers/${seller.id}/edit`} icon={Pencil}>
            Editar
          </ButtonLink>
        }
      />

      {/* Quick operations for this seller */}
      {isStore ? (
        <p className="adm-alert adm-alert-info">
          <Store size={16} />
          Vende del inventario principal desde su celular; cada venta entra a caja al momento con su comisión.
        </p>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { href: `/admin/deliveries/new${q}`, icon: PackageOpen, label: "Entregar" },
          { href: `/admin/seller-sales/new${q}`, icon: HandCoins, label: "Registrar venta" },
          { href: `/admin/seller-returns/new${q}`, icon: Undo2, label: "Devolución" },
          { href: `/admin/seller-losses/new${q}`, icon: ShieldAlert, label: "Pérdida / daño" },
          { href: `/admin/settlements/new${q}`, icon: ReceiptText, label: "Liquidar" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={label} href={href} className="adm-btn justify-start h-11">
            <Icon className="text-[var(--adm-ink-3)]" />
            {label}
          </Link>
        ))}
      </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {!isStore && (
          <>
            <Stat label="Unidades en su poder" value={units} hint={`${inventory.length} productos distintos`} icon={Package} tone="info" />
            <Stat label="Valor a precio de venta" value={formatCOP(valueAtPrice)} hint={`A costo: ${formatCOP(valueAtCost)}`} tone="violet" />
          </>
        )}
        <Stat
          label="Ventas históricas"
          value={formatCOP(summary?.totalAmount ?? 0)}
          hint={`${summary?.count ?? 0} ventas · comisión ${formatCOP(summary?.totalCommission ?? 0)}`}
          icon={HandCoins}
          tone="ok"
        />
        {isStore && <Stat label="Comisión acumulada" value={formatCOP(summary?.totalCommission ?? 0)} icon={HandCoins} tone="violet" />}
        {!isStore && <Stat
          label="Por cobrar en liquidaciones"
          value={formatCOP(pendingSettlement)}
          valueTone={pendingSettlement > 0 ? "warn" : "neutral"}
          icon={ReceiptText}
          tone="warn"
          href="/admin/settlements"
        />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4 items-start">
        {!isStore && <Card title="Inventario actual" description="Lo que el vendedor tiene asignado ahora (entregas − ventas − devoluciones − pérdidas)" flush>
          {inventory.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Sin inventario asignado"
              action={
                <ButtonLink href={`/admin/deliveries/new${q}`} variant="primary" icon={PackageOpen}>
                  Hacer una entrega
                </ButtonLink>
              }
            />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="t-right">Cantidad</th>
                    <th className="t-right">Precio</th>
                    <th className="t-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.productId}>
                      <td className="t-strong">{item.productName ?? `#${item.productId}`}</td>
                      <td className="t-right num t-strong">{item.quantity}</td>
                      <td className="t-right num">{formatCOP(item.productPrice)}</td>
                      <td className="t-right num">{formatCOP(item.quantity * (item.productPrice ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="t-right num">{units}</td>
                    <td />
                    <td className="t-right num">{formatCOP(valueAtPrice)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>}

        <div className="flex flex-col gap-4">
          <Card
            title="Ventas recientes"
            actions={
              <Link href={isStore ? "/admin/direct-sales" : "/admin/seller-sales"} className="adm-link text-[13px]">
                Ver todas
              </Link>
            }
            flush
          >
            {recentSales.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--adm-ink-3)]">Sin ventas registradas.</p>
            ) : (
              <ul className="divide-y divide-[#f0ede6]">
                {recentSales.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-[13.5px]">
                        <span className="num text-[var(--adm-ink-3)]">#{s.id}</span> · {formatDateTime(s.saleDate)}
                      </p>
                      <p className="num text-[12px] text-[var(--adm-ink-3)]">Comisión {formatCOP(s.commissionAmount)}</p>
                    </div>
                    <span className="num font-semibold text-[14px]">{formatCOP(s.totalAmount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {!isStore && <Card title="Liquidaciones" flush>
            {sellerSettlements.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--adm-ink-3)]">Aún no hay liquidaciones.</p>
            ) : (
              <ul className="divide-y divide-[#f0ede6]">
                {sellerSettlements.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-[13.5px]">{formatPlainDate(s.periodDate)}</p>
                      <p className="num text-[12px] text-[var(--adm-ink-3)]">{formatCOP(s.amountDue)} a entregar</p>
                    </div>
                    <StatusBadge kind="settlement" status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>}
        </div>
      </div>

      {isStore && (
        <CommissionPaymentCard
          sellerId={seller.id}
          accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
          payments={commissionPayments.map((p) => ({ ...p, paidAt: p.paidAt.toISOString() }))}
        />
      )}

      <SellerAccessCard
        sellerId={seller.id}
        user={user ? { username: user.username, active: user.active } : null}
        sessions={sessions.map((s) => ({
          id: s.id,
          deviceName: s.deviceName,
          createdAt: s.createdAt.toISOString(),
          lastSeenAt: s.lastSeenAt.toISOString(),
          revokedAt: s.revokedAt?.toISOString() ?? null,
        }))}
      />
    </Page>
  );
}
