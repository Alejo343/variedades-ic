import { getAllProducts } from "@/lib/db/queries/products";
import { getActiveCashAccounts } from "@/lib/db/queries/cash-accounts";
import { getDirectSaleById } from "@/lib/db/queries/direct-sales";
import { DirectSaleForm } from "../_components/DirectSaleForm";
import { Page, PageHeader } from "../../_components/ui";

export default async function NewDirectSalePage({ searchParams }: { searchParams: Promise<{ corregir?: string }> }) {
  const { corregir } = await searchParams;
  const [products, accounts, voided] = await Promise.all([
    getAllProducts(),
    getActiveCashAccounts(),
    corregir ? getDirectSaleById(Number(corregir)) : null,
  ]);
  const activeProducts = products
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitValue: p.price, available: Math.max(p.stock, 0), imageUrl: p.imageUrl }));
  // Corregir: the voided sale's lines, at the price it was charged.
  const initial = voided?.voidedAt
    ? {
        lines: voided.items
          .filter((i) => activeProducts.some((p) => p.id === i.productId))
          .map((i) => ({ productId: i.productId, quantity: i.quantity, unitValue: i.unitPrice })),
        accountId: voided.accountId,
      }
    : undefined;

  return (
    <Page>
      <PageHeader
        back={{ href: "/admin/direct-sales", label: "Ventas en local" }}
        title={initial ? `Corregir venta #${voided!.id}` : "Nueva venta en local"}
        description={initial ? "La venta anterior quedó anulada. Ajusta lo que estaba mal y cobra de nuevo." : undefined}
      />
      <DirectSaleForm products={activeProducts} accounts={accounts} initial={initial} />
    </Page>
  );
}
