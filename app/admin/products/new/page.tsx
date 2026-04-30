import { getActiveCategories } from "@/lib/db/queries/categories";
import { ProductForm } from "../_components/ProductForm";

export default async function NewProductPage() {
  const categories = await getActiveCategories();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
