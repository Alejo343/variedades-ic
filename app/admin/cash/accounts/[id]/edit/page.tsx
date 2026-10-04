import { Page, PageHeader } from "../../../../_components/ui";
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
    <Page>
      <PageHeader back={{ href: "/admin/cash/accounts", label: "Cuentas de caja" }} eyebrow="Editar cuenta de caja" title={account.name} />
      <CashAccountForm initial={account} />
    </Page>
  );
}
