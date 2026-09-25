import { getAllProducts } from "@/lib/db/queries/products";
import { getActiveCashAccounts } from "@/lib/db/queries/cash-accounts";
import { DirectSaleForm } from "../_components/DirectSaleForm";

export default async function NewDirectSalePage() {
  const [products, accounts] = await Promise.all([getAllProducts(), getActiveCashAccounts()]);
  const activeProducts = products.filter((p) => p.active).map((p) => ({ id: p.id, name: p.name, price: p.price }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nueva venta en local</h1>
      <DirectSaleForm products={activeProducts} accounts={accounts} />
    </div>
  );
}
