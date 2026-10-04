import { Page, PageHeader } from "../../_components/ui";
import { SellerForm } from "../_components/SellerForm";

export default function NewSellerPage() {
  return (
    <Page>
      <PageHeader back={{ href: "/admin/sellers", label: "Vendedores" }} title="Nuevo vendedor" />
      <SellerForm />
    </Page>
  );
}
