import { notFound } from "next/navigation";
import { getActiveSellers, getSellerById } from "@/lib/db/queries/sellers";
import { previewSettlement } from "@/lib/db/queries/settlements";
import { SellerPicker } from "@/app/admin/_components/SellerPicker";
import { SettlementPreview } from "../_components/SettlementPreview";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewSettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ sellerId?: string; date?: string }>;
}) {
  const { sellerId, date } = await searchParams;

  if (!sellerId) {
    const sellers = await getActiveSellers();
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Nueva liquidación</h1>
        <SellerPicker sellers={sellers} basePath="/admin/settlements/new" />
      </div>
    );
  }

  const periodDate = date ?? todayISO();
  const [[seller], preview] = await Promise.all([
    getSellerById(Number(sellerId)),
    previewSettlement(Number(sellerId), periodDate),
  ]);

  if (!seller) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Nueva liquidación</h1>
      <p className="text-sm text-gray-500 mb-6">{seller.name}</p>
      <SettlementPreview sellerId={seller.id} periodDate={periodDate} preview={preview} />
    </div>
  );
}
