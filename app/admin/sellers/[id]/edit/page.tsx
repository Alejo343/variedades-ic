import { notFound } from "next/navigation";
import { getSellerById } from "@/lib/db/queries/sellers";
import { SellerForm } from "../../_components/SellerForm";

export default async function EditSellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [seller] = await getSellerById(Number(id));

  if (!seller) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar vendedor</h1>
      <SellerForm initial={seller} />
    </div>
  );
}
