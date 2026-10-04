import { Page, PageHeader } from "../../../_components/ui";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/db/queries/products";
import { getActiveCategories } from "@/lib/db/queries/categories";
import { ProductForm } from "../../_components/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(Number(id)),
    getActiveCategories(),
  ]);

  if (!product) notFound();

  return (
    <Page>
      <PageHeader back={{ href: "/admin/products", label: "Productos" }} eyebrow="Editar producto" title={product.name} />
      <ProductForm categories={categories} initial={product} />
    </Page>
  );
}
