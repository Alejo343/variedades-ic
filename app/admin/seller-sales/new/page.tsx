import { notFound } from "next/navigation";
import { getActiveSellers, getSellerById } from "@/lib/db/queries/sellers";
import { getSellerInventory } from "@/lib/db/queries/seller-inventory";
import { SellerPicker } from "../_components/SellerPicker";
import { SellerSaleForm } from "../_components/SellerSaleForm";

export default async function NewSellerSalePage({
  searchParams,
}: {
  searchParams: Promise<{ sellerId?: string }>;
}) {
  const { sellerId } = await searchParams;

  if (!sellerId) {
    const sellers = await getActiveSellers();
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Nueva venta de vendedor</h1>
        <SellerPicker sellers={sellers} />
      </div>
    );
  }

  const [[seller], inventory] = await Promise.all([
    getSellerById(Number(sellerId)),
    getSellerInventory(Number(sellerId)),
  ]);

  if (!seller) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Nueva venta de vendedor</h1>
      <p className="text-sm text-gray-500 mb-6">{seller.name}</p>
      <SellerSaleForm sellerId={seller.id} inventory={inventory} />
    </div>
  );
}
