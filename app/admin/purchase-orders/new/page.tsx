import { getActiveDistributors } from "@/lib/db/queries/distributors";
import { getAllProducts } from "@/lib/db/queries/products";
import { PurchaseOrderForm } from "../_components/PurchaseOrderForm";

export default async function NewPurchaseOrderPage() {
  const [distributors, products] = await Promise.all([
    getActiveDistributors(),
    getAllProducts(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuevo pedido de compra</h1>
      <PurchaseOrderForm distributors={distributors} products={products} />
    </div>
  );
}
