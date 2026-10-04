import { Page, PageHeader } from "../../../_components/ui";
import { CashAccountForm } from "../_components/CashAccountForm";

export default function NewCashAccountPage() {
  return (
    <Page>
      <PageHeader back={{ href: "/admin/cash/accounts", label: "Cuentas de caja" }} title="Nueva cuenta de caja" />
      <CashAccountForm />
    </Page>
  );
}
