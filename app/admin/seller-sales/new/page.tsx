import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveSellers, getSellerById } from "@/lib/db/queries/sellers";
import { getSellerInventory } from "@/lib/db/queries/seller-inventory";
import { SellerPicker } from "@/app/admin/_components/SellerPicker";
import { SellerOperationForm } from "@/app/admin/_components/SellerOperationForm";
import { Page, PageHeader } from "@/app/admin/_components/ui";

export default async function NewSellerSalePage({ searchParams }: { searchParams: Promise<{ sellerId?: string }> }) {
  const { sellerId } = await searchParams;
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

  const [[seller], inventory] = await Promise.all([getSellerById(Number(sellerId)), getSellerInventory(Number(sellerId))]);

  if (!seller) notFound();

  return (
    <Page>
      <PageHeader
        back={back}
        eyebrow="Nueva venta de vendedor"
        title={seller.name}
        actions={
          <Link href="/admin/seller-sales/new" className="adm-btn adm-btn-ghost">
            Cambiar vendedor
          </Link>
        }
      />
      <SellerOperationForm mode="sale" sellerId={seller.id} inventory={inventory} />
    </Page>
  );
}
