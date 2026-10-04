import { getAllProducts } from "@/lib/db/queries/products";
import { getActiveCashAccounts } from "@/lib/db/queries/cash-accounts";
import { DirectSaleForm } from "../_components/DirectSaleForm";
import { Page, PageHeader } from "../../_components/ui";

export default async function NewDirectSalePage() {
  const [products, accounts] = await Promise.all([getAllProducts(), getActiveCashAccounts()]);
  const activeProducts = products
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitValue: p.price, available: Math.max(p.stock, 0), imageUrl: p.imageUrl }));

  return (
    <Page>
      <PageHeader back={{ href: "/admin/direct-sales", label: "Ventas en local" }} title="Nueva venta en local" />
      <DirectSaleForm products={activeProducts} accounts={accounts} />
    </Page>
  );
}
