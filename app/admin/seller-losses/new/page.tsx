import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveSellers, getSellerById } from "@/lib/db/queries/sellers";
import { getSellerInventory } from "@/lib/db/queries/seller-inventory";
import { SellerPicker } from "@/app/admin/_components/SellerPicker";
import { SellerOperationForm } from "@/app/admin/_components/SellerOperationForm";
import { Page, PageHeader } from "@/app/admin/_components/ui";

export default async function NewSellerLossPage({ searchParams }: { searchParams: Promise<{ sellerId?: string }> }) {
  const { sellerId } = await searchParams;
  const back = { href: "/admin/seller-losses", label: "Pérdidas y daños" };

  if (!sellerId) {
    const sellers = await getActiveSellers();
    return (
      <Page>
        <PageHeader back={back} title="Nueva pérdida, daño o robo" description="El costo lo asume el vendedor en su liquidación." />
        <SellerPicker sellers={sellers} basePath="/admin/seller-losses/new" />
      </Page>
    );
  }

  const [[seller], inventory] = await Promise.all([getSellerById(Number(sellerId)), getSellerInventory(Number(sellerId))]);

  if (!seller) notFound();

  return (
    <Page>
      <PageHeader
        back={back}
        eyebrow="Nueva pérdida, daño o robo"
        title={seller.name}
        actions={
          <Link href="/admin/seller-losses/new" className="adm-btn adm-btn-ghost">
            Cambiar vendedor
          </Link>
        }
      />
      <SellerOperationForm mode="loss" sellerId={seller.id} inventory={inventory} />
    </Page>
  );
}
