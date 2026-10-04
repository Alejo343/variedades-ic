import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveSellers, getSellerById } from "@/lib/db/queries/sellers";
import { previewSettlement } from "@/lib/db/queries/settlements";
import { SellerPicker } from "@/app/admin/_components/SellerPicker";
import { SettlementPreview } from "../_components/SettlementPreview";
import { Page, PageHeader } from "../../_components/ui";
import { todayInBogota } from "../../_lib/format";

export default async function NewSettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ sellerId?: string; date?: string }>;
}) {
  const { sellerId, date } = await searchParams;
  const back = { href: "/admin/settlements", label: "Liquidaciones" };

  if (!sellerId) {
    const sellers = await getActiveSellers();
    return (
      <Page>
        <PageHeader back={back} title="Nueva liquidación" description="Cierra las cuentas de un vendedor hasta una fecha." />
        <SellerPicker sellers={sellers} basePath="/admin/settlements/new" />
      </Page>
    );
  }

  const periodDate = date ?? todayInBogota();
  const [[seller], preview] = await Promise.all([
    getSellerById(Number(sellerId)),
    previewSettlement(Number(sellerId), periodDate),
  ]);

  if (!seller) notFound();

  return (
    <Page>
      <PageHeader
        back={back}
        eyebrow="Nueva liquidación"
        title={seller.name}
        actions={
          <Link href="/admin/settlements/new" className="adm-btn adm-btn-ghost">
            Cambiar vendedor
          </Link>
        }
      />
      <SettlementPreview sellerId={seller.id} periodDate={periodDate} preview={preview} />
    </Page>
  );
}
