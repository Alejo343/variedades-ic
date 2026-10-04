import { Page, PageHeader } from "../../_components/ui";
import { CategoryForm } from "../_components/CategoryForm";

export default function NewCategoryPage() {
  return (
    <Page>
      <PageHeader back={{ href: "/admin/categories", label: "Categorías" }} title="Nueva categoría" />
      <CategoryForm />
    </Page>
  );
}
