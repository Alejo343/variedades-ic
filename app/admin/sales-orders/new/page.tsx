import { getAllProducts } from "@/lib/db/queries/products";
import { SalesOrderForm } from "../_components/SalesOrderForm";

export default async function NewSalesOrderPage() {
  const products = await getAllProducts();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuevo pedido de cliente</h1>
      <SalesOrderForm products={products} />
    </div>
  );
}
