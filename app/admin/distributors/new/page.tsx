import { Page, PageHeader } from "../../_components/ui";
import { DistributorForm } from "../_components/DistributorForm";

export default function NewDistributorPage() {
  return (
    <Page>
      <PageHeader back={{ href: "/admin/distributors", label: "Distribuidores" }} title="Nuevo distribuidor" />
      <DistributorForm />
    </Page>
  );
}
