import { FileSpreadsheet, Plus } from "lucide-react";
import { getAllProducts } from "@/lib/db/queries/products";
import { getInventorySummary } from "@/lib/db/queries/reports";
import { ButtonLink, Page, PageHeader } from "../_components/ui";
import { ProductsTable } from "./_components/ProductsTable";
import { formatCOP, formatNumber } from "../_lib/format";

export default async function ProductsPage() {
  const [products, summary] = await Promise.all([getAllProducts(), getInventorySummary()]);

  return (
    <Page>
      <PageHeader
        eyebrow="Catálogo"
        title="Productos"
        description={`${formatNumber(summary.activeProducts)} activos · ${formatNumber(summary.totalUnits)} unidades en bodega · ${formatCOP(summary.totalValue)} a costo`}
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
      <ProductsTable products={products} />
    </Page>
  );
}
