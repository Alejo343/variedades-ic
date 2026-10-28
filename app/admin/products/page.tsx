import { FileSpreadsheet, Plus } from "lucide-react";
import { getAllProducts } from "@/lib/db/queries/products";
import { getInventorySummary } from "@/lib/db/queries/reports";
import { getSellerHeldTotalsByProduct } from "@/lib/db/queries/seller-inventory";
import { ButtonLink, Page, PageHeader } from "../_components/ui";
import { ProductsTable } from "./_components/ProductsTable";
import { formatCOP, formatNumber } from "../_lib/format";

export default async function ProductsPage() {
  const [products, summary, held] = await Promise.all([getAllProducts(), getInventorySummary(), getSellerHeldTotalsByProduct()]);
  const heldUnits = [...held.values()].reduce((s, q) => s + q, 0);

  return (
    <Page>
      <PageHeader
        eyebrow="Catálogo"
        title="Productos"
        description={`${formatNumber(summary.activeProducts)} activos · ${formatNumber(summary.totalUnits)} unidades en bodega · ${formatCOP(summary.totalValue)} a costo${heldUnits !== 0 ? ` · ${formatNumber(heldUnits)} con vendedores` : ""}`}
        actions={
          <>
            <ButtonLink href="/admin/products/import" icon={FileSpreadsheet}>
              Importar Excel
            </ButtonLink>
            <ButtonLink href="/admin/products/new" variant="primary" icon={Plus}>
              Nuevo producto
            </ButtonLink>
          </>
        }
      />
      <ProductsTable products={products.map((p) => ({ ...p, heldBySellers: held.get(p.id) ?? 0 }))} />
    </Page>
  );
}
