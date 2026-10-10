import { Page, PageHeader } from "../../../_components/ui";
import { notFound } from "next/navigation";
import { getCategoryById, getCategoryProductPhotos } from "@/lib/db/queries/categories";
import { CategoryForm } from "../../_components/CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category] = await getCategoryById(Number(id));
  if (!category) notFound();
  const photos = await getCategoryProductPhotos(category.id);

  return (
    <Page>
      <PageHeader back={{ href: "/admin/categories", label: "Categorías" }} eyebrow="Editar categoría" title={category.name} />
      <CategoryForm initial={category} productPhotos={photos} />
    </Page>
  );
}
