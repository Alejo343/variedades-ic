import { Page, PageHeader } from "../../_components/ui";
import { ProductImporter } from "./_components/ProductImporter";

export default function ImportProductsPage() {
  return (
    <Page>
      <PageHeader
        back={{ href: "/admin/products", label: "Productos" }}
        eyebrow="Catálogo"
        title="Importar productos desde Excel"
        description="Carga tu catálogo o actualiza precios y existencias de muchos productos a la vez."
      />
      <ProductImporter />
    </Page>
  );
}
