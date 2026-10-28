import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveSellers, getSellerById } from "@/lib/db/queries/sellers";
import { getSellerSaleById } from "@/lib/db/queries/seller-sales";
import { getSellerInventory } from "@/lib/db/queries/seller-inventory";
import { SellerPicker } from "@/app/admin/_components/SellerPicker";
import { SellerOperationForm } from "@/app/admin/_components/SellerOperationForm";
import { Page, PageHeader } from "@/app/admin/_components/ui";

export default async function NewSellerSalePage({
  searchParams,
}: {
  searchParams: Promise<{ sellerId?: string; corregir?: string }>;
}) {
  const { sellerId, corregir } = await searchParams;
  const back = { href: "/admin/seller-sales", label: "Ventas de vendedores" };

  if (!sellerId) {
    const sellers = await getActiveSellers();
    return (
      <Page>
        <PageHeader back={back} title="Nueva venta de vendedor" description="Registra lo que el vendedor vendió de su inventario en consignación." />
        <SellerPicker sellers={sellers} basePath="/admin/seller-sales/new" />
      </Page>
    );
  }

  const [[seller], inventory, voided] = await Promise.all([
    getSellerById(Number(sellerId)),
    getSellerInventory(Number(sellerId)),
    corregir ? getSellerSaleById(Number(corregir)) : null,
  ]);

  if (!seller) notFound();

  // Corregir: the voided sale's lines (its units are back in the seller's inventory).
  const initialLines =
    voided?.voidedAt && voided.sellerId === seller.id
      ? voided.items
          .filter((i) => inventory.some((p) => p.productId === i.productId))
          .map((i) => ({ productId: i.productId, quantity: i.quantity, unitValue: i.unitPrice }))
      : undefined;

  return (
    <Page>
      <PageHeader
        back={back}
        eyebrow={initialLines ? `Corregir venta #${voided!.id}` : "Nueva venta de vendedor"}
        title={seller.name}
        description={initialLines ? "La venta anterior quedó anulada. Ajusta lo que estaba mal y regístrala de nuevo." : undefined}
        actions={
          <Link href="/admin/seller-sales/new" className="adm-btn adm-btn-ghost">
            Cambiar vendedor
          </Link>
        }
      />
      <SellerOperationForm mode="sale" sellerId={seller.id} inventory={inventory} initialLines={initialLines} />
    </Page>
  );
}
