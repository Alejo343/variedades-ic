import { AdminNav } from "./_components/AdminNav";
import { SignOutButton } from "./_components/SignOutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-56 bg-white shadow-sm flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="font-bold text-gray-800 text-base">IC Variedades</span>
          <p className="text-xs text-gray-400 mt-0.5">Panel Admin</p>
        </div>
        <AdminNav />
        <div className="px-3 py-4 border-t border-gray-100">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
