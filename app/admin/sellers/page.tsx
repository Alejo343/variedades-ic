import Link from "next/link";
import { ChevronRight, MapPin, Phone, Plus, Users } from "lucide-react";
import { getAllSellers } from "@/lib/db/queries/sellers";
import { getAllSellersInventory } from "@/lib/db/queries/seller-inventory";
import { Badge, ButtonLink, EmptyState, Page, PageHeader } from "../_components/ui";
import { formatCOP } from "../_lib/format";

function formatCommission(type: string, value: number) {
  return type === "percentage" ? `${(value / 100).toLocaleString("es-CO", { maximumFractionDigits: 2 })}%` : `${formatCOP(value)}/u`;
}

export default async function SellersPage() {
  const [sellers, inventory] = await Promise.all([getAllSellers(), getAllSellersInventory()]);

  const units = new Map<number, number>();
  for (const row of inventory) {
    if (row.sellerId !== null) units.set(row.sellerId, (units.get(row.sellerId) ?? 0) + row.quantity);
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Vendedores"
        title="Vendedores"
        description="Personas que venden tu mercancía en consignación y liquidan con comisión."
        actions={
          <ButtonLink href="/admin/sellers/new" variant="primary" icon={Plus}>
            Nuevo vendedor
          </ButtonLink>
        }
      />

      {sellers.length === 0 ? (
        <div className="adm-card">
          <EmptyState icon={Users} title="No hay vendedores registrados" description="Agrega un vendedor para entregarle mercancía en consignación." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sellers.map((s) => {
            const initials = s.name
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const u = units.get(s.id) ?? 0;
            return (
              <Link
                key={s.id}
                href={`/admin/sellers/${s.id}`}
                className={`adm-card group p-5 flex flex-col gap-4 transition hover:shadow-md hover:border-[var(--adm-line-strong)] ${s.active ? "" : "opacity-60"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full grid place-items-center bg-[#16171b] text-white text-[14px] font-semibold shrink-0">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[15.5px] truncate">
                      {s.name}
                      {s.inventoryMode === "store" && <span className="ml-2 text-[11.5px] font-medium text-[var(--adm-ink-3)]">· Tienda</span>}
                    </p>
                    <div className="flex flex-wrap gap-x-3 text-[12.5px] text-[var(--adm-ink-3)]">
                      {s.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} />
                          {s.city}
                        </span>
                      )}
                      {s.phone && (
                        <span className="inline-flex items-center gap-1 num">
                          <Phone size={12} />
                          {s.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[var(--adm-ink-3)] group-hover:translate-x-0.5 transition" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--adm-line)]">
                  <div>
                    <p className="adm-eyebrow">Comisión</p>
                    <p className="num text-[15px] font-semibold mt-1">{formatCommission(s.commissionType, s.commissionValue)}</p>
                  </div>
                  <div>
                    <p className="adm-eyebrow">En su poder</p>
                    <p className="num text-[15px] font-semibold mt-1">
                      {u} <span className="text-[12px] font-normal text-[var(--adm-ink-3)]">unidades</span>
                    </p>
                  </div>
                </div>
                {!s.active && <Badge className="self-start">Inactivo</Badge>}
              </Link>
            );
          })}
        </div>
      )}
    </Page>
  );
}
