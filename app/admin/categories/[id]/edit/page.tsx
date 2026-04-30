import { notFound } from "next/navigation";
import { getCategoryById } from "@/lib/db/queries/categories";
import { CategoryForm } from "../../_components/CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category] = await getCategoryById(Number(id));
  if (!category) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar categoría</h1>
      <CategoryForm initial={category} />
    </div>
  );
}
