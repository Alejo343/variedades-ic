import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import { auth } from "@/lib/auth";
import { AdminShell } from "./_components/AdminShell";

// Every admin page reads live DB data: render per request, never prerender at build time.
export const dynamic = "force-dynamic";

const display = Bricolage_Grotesque({
  variable: "--font-adm-display",
  subsets: ["latin"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-adm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const fonts = `${display.variable} ${mono.variable}`;

  // Without a session the proxy only lets /admin/login through: render it bare, no nav.
  const session = await auth();
  if (!session) return <div className={fonts}>{children}</div>;

  const user = {
    name: session.user?.name ?? "Administrador",
    email: session.user?.email ?? "",
  };

  return (
    <div className={fonts}>
      <AdminShell user={user}>{children}</AdminShell>
    </div>
  );
}
