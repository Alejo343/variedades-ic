import { getAllProducts } from "@/lib/db/queries/products";
import { SalesOrderForm } from "../_components/SalesOrderForm";
import { Page, PageHeader } from "../../_components/ui";

export default async function NewSalesOrderPage() {
  const products = await getAllProducts();
  const active = products
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitValue: p.price, imageUrl: p.imageUrl }));

  return (
    <Page>
      <PageHeader
        back={{ href: "/admin/sales-orders", label: "Pedidos por WhatsApp" }}
        title="Nuevo pedido de cliente"
        description="El stock se valida y descuenta cuando confirmes el pedido."
      />
      <SalesOrderForm products={active} />
    </Page>
  );
}
