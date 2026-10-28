import Link from "next/link";
import { Card, Page, PageHeader } from "../../../_components/ui";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/db/queries/products";
import { getActiveCategories } from "@/lib/db/queries/categories";
import { getSellerHoldingsOfProduct } from "@/lib/db/queries/seller-inventory";
import { ProductForm } from "../../_components/ProductForm";
import { formatNumber } from "../../../_lib/format";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, holdings] = await Promise.all([
    getProductById(Number(id)),
    getActiveCategories(),
    getSellerHoldingsOfProduct(Number(id)),
  ]);

  if (!product) notFound();

  // Sellers' units sit beside the shop's stock, never inside it.
  const held = holdings.reduce((s, h) => s + h.quantity, 0);

  return (
    <Page>
      <PageHeader back={{ href: "/admin/products", label: "Productos" }} eyebrow="Editar producto" title={product.name} />
      {holdings.length > 0 && (
        <Card
          title="Con vendedores"
          description={`${formatNumber(product.stock)} en tienda + ${formatNumber(held)} con vendedores = ${formatNumber(product.stock + held)} en total en el negocio`}
          flush>
          <ul className="divide-y divide-[#f0ede6]">
            {holdings.map((h) => (
              <li key={h.sellerId}>
                <Link href={`/admin/sellers/${h.sellerId}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--adm-surface-2)]">
                  <span className="flex-1 text-[13.5px] truncate">{h.sellerName}</span>
                  <span className={`num text-[13px] font-semibold ${h.quantity < 0 ? "text-[var(--adm-danger)]" : "text-[var(--adm-violet)]"}`}>
                    {h.quantity < 0 ? `${h.quantity}, revisar` : `${h.quantity} ${h.quantity === 1 ? "unidad" : "unidades"}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <ProductForm categories={categories} initial={product} />
    </Page>
  );
}
