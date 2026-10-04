import Link from "next/link";
import { Plus, Tags, Pencil } from "lucide-react";
import { getAllCategories } from "@/lib/db/queries/categories";
import { getAllProducts } from "@/lib/db/queries/products";
import { Badge, ButtonLink, EmptyState, Page, PageHeader } from "../_components/ui";

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([getAllCategories(), getAllProducts()]);

  const counts = new Map<number, { products: number; units: number }>();
  for (const p of products) {
    if (!p.categoryId || !p.active) continue;
    const c = counts.get(p.categoryId) ?? { products: 0, units: 0 };
    c.products += 1;
    c.units += Math.max(p.stock, 0);
    counts.set(p.categoryId, c);
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Catálogo"
        title="Categorías"
        description="Agrupan el catálogo público y definen el prefijo del SKU de cada producto."
        actions={
          <ButtonLink href="/admin/categories/new" variant="primary" icon={Plus}>
            Nueva categoría
          </ButtonLink>
        }
      />

      {categories.length === 0 ? (
        <div className="adm-card">
          <EmptyState
            icon={Tags}
            title="Aún no hay categorías"
            description="Crea la primera para empezar a organizar tus productos."
            action={
              <ButtonLink href="/admin/categories/new" variant="primary" icon={Plus}>
                Nueva categoría
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const c = counts.get(cat.id) ?? { products: 0, units: 0 };
            const color = cat.color ?? "#a8a39a";
            return (
              <Link
                key={cat.id}
                href={`/admin/categories/${cat.id}/edit`}
                className={`adm-card group relative overflow-hidden p-5 transition hover:shadow-md hover:border-[var(--adm-line-strong)] ${
                  cat.active ? "" : "opacity-60"
                }`}
              >
                <span
                  className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[.14] transition group-hover:scale-110"
                  style={{ background: color }}
                  aria-hidden
                />
                <div className="relative flex items-start justify-between gap-3">
                  <span
                    className="w-10 h-10 rounded-xl grid place-items-center text-white font-semibold text-[14px] shadow-sm"
                    style={{ background: color }}
                  >
                    {cat.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex items-center gap-2">
                    {!cat.active && <Badge>Inactiva</Badge>}
                    <Pencil size={15} className="text-[var(--adm-ink-3)] opacity-0 group-hover:opacity-100 transition" />
                  </span>
                </div>
                <h2 className="relative mt-4 text-[17px] font-semibold">{cat.name}</h2>
                <p className="relative num text-[12px] text-[var(--adm-ink-3)]">/{cat.slug}</p>
                {cat.description && (
                  <p className="relative text-[13px] text-[var(--adm-ink-2)] mt-2 line-clamp-2">{cat.description}</p>
                )}
                <div className="relative flex gap-6 mt-4 pt-4 border-t border-[var(--adm-line)]">
                  <div>
                    <p className="num text-[18px] font-semibold">{c.products}</p>
                    <p className="text-[12px] text-[var(--adm-ink-3)]">productos activos</p>
                  </div>
                  <div>
                    <p className="num text-[18px] font-semibold">{c.units}</p>
                    <p className="text-[12px] text-[var(--adm-ink-3)]">unidades</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Page>
  );
}
