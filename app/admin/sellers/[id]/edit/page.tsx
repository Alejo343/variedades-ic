import { Page, PageHeader } from "../../../_components/ui";
import { notFound } from "next/navigation";
import { getSellerById } from "@/lib/db/queries/sellers";
import { SellerForm } from "../../_components/SellerForm";

export default async function EditSellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [seller] = await getSellerById(Number(id));

  if (!seller) notFound();

  return (
    <Page>
      <PageHeader back={{ href: `/admin/sellers/${seller.id}`, label: seller.name }} eyebrow="Editar vendedor" title={seller.name} />
      <SellerForm initial={seller} />
    </Page>
  );
}
