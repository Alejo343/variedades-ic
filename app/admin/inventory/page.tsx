import { getAllProducts } from "@/lib/db/queries/products";
import { getLowStock, getOutOfStock, getRecentMovements } from "@/lib/db/queries/inventory";
import { AdjustmentForm } from "./_components/AdjustmentForm";

const MOVEMENT_LABELS: Record<string, string> = {
  compra: "Compra",
  venta: "Venta",
  entrega_vendedor: "Entrega a vendedor",
  devolucion: "Devolución",
  ajuste: "Ajuste",
  perdida: "Pérdida",
  dano: "Daño",
  robo: "Robo",
};

export default async function InventoryPage() {
  const [lowStock, outOfStock, movements, products] = await Promise.all([
    getLowStock(),
    getOutOfStock(),
    getRecentMovements(50),
    getAllProducts(),
  ]);

  const activeProducts = products.filter((p) => p.active);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-orange-600 mb-3">
            Stock mínimo ({lowStock.length})
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400">Sin alertas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{p.name}</span>
                  <span className="text-orange-600 font-medium">
                    {p.stock} / mín. {p.minStock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-red-600 mb-3">
            Agotados ({outOfStock.length})
          </h2>
          {outOfStock.length === 0 ? (
            <p className="text-sm text-gray-400">Sin productos agotados.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {outOfStock.map((p) => (
                <li key={p.id} className="text-sm text-gray-700">
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AdjustmentForm products={activeProducts.map((p) => ({ id: p.id, name: p.name }))} />

      <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Movimientos recientes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-2 font-medium">Fecha</th>
              <th className="pb-2 font-medium">Producto</th>
              <th className="pb-2 font-medium">Tipo</th>
              <th className="pb-2 font-medium">Cantidad</th>
              <th className="pb-2 font-medium">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-b border-gray-50">
                <td className="py-2 text-gray-500">
                  {new Date(m.createdAt).toLocaleString("es-CO")}
                </td>
                <td className="py-2 text-gray-700">{m.productName ?? `#${m.productId}`}</td>
                <td className="py-2 text-gray-700">{MOVEMENT_LABELS[m.type] ?? m.type}</td>
                <td className={`py-2 font-medium ${m.quantityDelta > 0 ? "text-green-600" : "text-red-600"}`}>
                  {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                </td>
                <td className="py-2 text-gray-500">{m.reason ?? "-"}</td>
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
