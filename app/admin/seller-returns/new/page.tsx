import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveSellers, getSellerById } from "@/lib/db/queries/sellers";
import { getSellerInventory } from "@/lib/db/queries/seller-inventory";
import { SellerPicker } from "@/app/admin/_components/SellerPicker";
import { SellerOperationForm } from "@/app/admin/_components/SellerOperationForm";
import { Page, PageHeader } from "@/app/admin/_components/ui";

export default async function NewSellerReturnPage({ searchParams }: { searchParams: Promise<{ sellerId?: string }> }) {
  const { sellerId } = await searchParams;
  const back = { href: "/admin/seller-returns", label: "Devoluciones" };

  if (!sellerId) {
    const sellers = await getActiveSellers();
    return (
      <Page>
        <PageHeader back={back} title="Nueva devolución" description="Mercancía que el vendedor regresa al inventario principal." />
        <SellerPicker sellers={sellers} basePath="/admin/seller-returns/new" />
      </Page>
    );
  }

  const [[seller], inventory] = await Promise.all([getSellerById(Number(sellerId)), getSellerInventory(Number(sellerId))]);

  if (!seller) notFound();

  return (
    <Page>
      <PageHeader
        back={back}
        eyebrow="Nueva devolución"
        title={seller.name}
        actions={
          <Link href="/admin/seller-returns/new" className="adm-btn adm-btn-ghost">
            Cambiar vendedor
          </Link>
        }
      />
      <SellerOperationForm mode="return" sellerId={seller.id} inventory={inventory} />
    </Page>
  );
}
