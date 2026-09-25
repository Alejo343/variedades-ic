import { notFound } from "next/navigation";
import { getCashAccountById } from "@/lib/db/queries/cash-accounts";
import { CashAccountForm } from "../../_components/CashAccountForm";

export default async function EditCashAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [account] = await getCashAccountById(Number(id));

  if (!account) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar cuenta de caja</h1>
      <CashAccountForm initial={account} />
    </div>
  );
}
