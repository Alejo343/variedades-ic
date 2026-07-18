import { getActiveSellers } from "@/lib/db/queries/sellers";
import { getAllProducts } from "@/lib/db/queries/products";
import { DeliveryForm } from "../_components/DeliveryForm";

export default async function NewDeliveryPage() {
  const [sellers, products] = await Promise.all([getActiveSellers(), getAllProducts()]);
  const activeProducts = products
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, name: p.name, purchasePrice: p.purchasePrice }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nueva entrega a vendedor</h1>
      <DeliveryForm sellers={sellers} products={activeProducts} />
    </div>
  );
}
