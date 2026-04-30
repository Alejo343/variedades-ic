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
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar producto</h1>
      <ProductForm categories={categories} initial={product} />
    </div>
  );
}
