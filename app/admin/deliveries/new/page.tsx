import { getActiveSellers } from "@/lib/db/queries/sellers";
import { getAllProducts } from "@/lib/db/queries/products";
import { DeliveryForm } from "../_components/DeliveryForm";
import { Page, PageHeader } from "../../_components/ui";

export default async function NewDeliveryPage({ searchParams }: { searchParams: Promise<{ sellerId?: string }> }) {
  const { sellerId } = await searchParams;
  const [sellers, products] = await Promise.all([getActiveSellers(), getAllProducts()]);
  const activeProducts = products
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      unitValue: p.purchasePrice ?? 0,
      available: Math.max(p.stock, 0),
      imageUrl: p.imageUrl,
    }));
  const initialSellerId = sellers.some((s) => String(s.id) === sellerId) ? Number(sellerId) : undefined;

  return (
    <Page>
      <PageHeader
        back={{ href: "/admin/deliveries", label: "Entregas" }}
        title="Nueva entrega a vendedor"
        description="Sale del inventario principal y queda a cargo del vendedor."
      />
      <DeliveryForm sellers={sellers} products={activeProducts} initialSellerId={initialSellerId} />
    </Page>
  );
}
