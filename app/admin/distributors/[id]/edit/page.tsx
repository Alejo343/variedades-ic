import { Page, PageHeader } from "../../../_components/ui";
import { notFound } from "next/navigation";
import { getDistributorById } from "@/lib/db/queries/distributors";
import { DistributorForm } from "../../_components/DistributorForm";

export default async function EditDistributorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [distributor] = await getDistributorById(Number(id));

  if (!distributor) notFound();

  return (
    <Page>
      <PageHeader back={{ href: "/admin/distributors", label: "Distribuidores" }} eyebrow="Editar distribuidor" title={distributor.name} />
      <DistributorForm initial={distributor} />
    </Page>
  );
}
