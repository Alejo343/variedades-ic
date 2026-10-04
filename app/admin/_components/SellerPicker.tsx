import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { EmptyState } from "./ui";

type Seller = { id: number; name: string; city?: string | null };

/** Step 1 of every per-seller flow: pick the seller (links to `${basePath}?sellerId=`). */
export function SellerPicker({ sellers, basePath }: { sellers: Seller[]; basePath: string }) {
  if (sellers.length === 0) {
    return (
      <div className="adm-card">
        <EmptyState icon={Users} title="No hay vendedores activos" description="Crea un vendedor primero desde la sección Vendedores." />
      </div>
    );
  }
  return (
    <div>
      <p className="adm-eyebrow mb-3">Elige el vendedor</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {sellers.map((s) => {
          const initials = s.name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return (
            <Link
              key={s.id}
              href={`${basePath}?sellerId=${s.id}`}
              className="adm-card group flex items-center gap-3 p-4 transition hover:shadow-md hover:border-[var(--adm-line-strong)]"
            >
              <span className="w-10 h-10 rounded-full grid place-items-center bg-[#16171b] text-white text-[13px] font-semibold shrink-0">
                {initials}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium truncate">{s.name}</span>
                {s.city && <span className="block text-[12.5px] text-[var(--adm-ink-3)]">{s.city}</span>}
              </span>
              <ChevronRight size={18} className="text-[var(--adm-ink-3)] group-hover:translate-x-0.5 transition" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
