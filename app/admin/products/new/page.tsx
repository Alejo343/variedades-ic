import { Page, PageHeader } from "../../_components/ui";
import { getActiveCategories } from "@/lib/db/queries/categories";
import { ProductForm } from "../_components/ProductForm";

export default async function NewProductPage() {
  const categories = await getActiveCategories();

  return (
    <Page>
      <PageHeader back={{ href: "/admin/products", label: "Productos" }} title="Nuevo producto" />
      <ProductForm categories={categories} />
    </Page>
  );
}
