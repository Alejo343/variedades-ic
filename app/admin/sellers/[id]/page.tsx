import Link from "next/link";
import { notFound } from "next/navigation";
import { getSellerById } from "@/lib/db/queries/sellers";
import { getSellerInventory } from "@/lib/db/queries/seller-inventory";
import { getDeviceSessions, getUserBySellerId } from "@/lib/db/queries/users";
import { SellerAccessCard } from "../_components/SellerAccessCard";

function formatCommission(type: string, value: number) {
  return type === "percentage" ? `${(value / 100).toFixed(2)}%` : `$${value.toLocaleString("es-CO")}/u`;
}

export default async function SellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [[seller], inventory, [user]] = await Promise.all([
    getSellerById(Number(id)),
    getSellerInventory(Number(id)),
    getUserBySellerId(Number(id)),
  ]);

  if (!seller) notFound();

  const sessions = user ? await getDeviceSessions(user.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{seller.name}</h1>
          <p className="text-sm text-gray-500">
            {seller.city ?? "—"} · {seller.phone ?? "—"} · Comisión{" "}
            {formatCommission(seller.commissionType, seller.commissionValue)}
          </p>
        </div>
        <Link
          href={`/admin/sellers/${seller.id}/edit`}
          className="border border-gray-300 text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          Editar
        </Link>
      </div>

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

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Inventario actual ({inventory.length})
        </h2>
        {inventory.length === 0 ? (
          <p className="text-sm text-gray-400">Este vendedor no tiene inventario asignado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Producto</th>
                <th className="pb-2 font-medium">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.productId} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">{item.productName ?? `#${item.productId}`}</td>
                  <td className="py-2 font-medium text-gray-800">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
