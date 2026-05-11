import { notFound } from "next/navigation";
import { getDistributorById } from "@/lib/db/queries/distributors";
import { DistributorForm } from "../../_components/DistributorForm";

export default async function EditDistributorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [distributor] = await getDistributorById(Number(id));

  if (!distributor) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar distribuidor</h1>
      <DistributorForm initial={distributor} />
    </div>
  );
}
