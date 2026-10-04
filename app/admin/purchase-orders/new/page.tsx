import { getActiveDistributors } from "@/lib/db/queries/distributors";
import { getAllProducts } from "@/lib/db/queries/products";
import { PurchaseOrderForm } from "../_components/PurchaseOrderForm";
import { Page, PageHeader } from "../../_components/ui";

export default async function NewPurchaseOrderPage() {
  const [distributors, products] = await Promise.all([getActiveDistributors(), getAllProducts()]);

  return (
    <Page>
      <PageHeader
        back={{ href: "/admin/purchase-orders", label: "Pedidos de compra" }}
        title="Nuevo pedido de compra"
        description="Arma el pedido a mano o impórtalo desde el Excel del distribuidor."
      />
      <PurchaseOrderForm distributors={distributors} products={products} />
    </Page>
  );
}
