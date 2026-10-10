import { auth } from "@/lib/auth";
import { Page, PageHeader } from "../_components/ui";
import { PasswordForm } from "./_components/PasswordForm";

export default async function AccountPage() {
  const session = await auth();

  return (
    <Page>
      <PageHeader
        title="Mi cuenta"
        description={
          <>
            Sesión iniciada como <strong>{session?.user?.email}</strong>. Al cambiar la contraseña, los celulares
            conectados siguen sincronizando; la nueva se usa en el próximo inicio de sesión.
          </>
        }
      />
      <PasswordForm />
    </Page>
  );
}
