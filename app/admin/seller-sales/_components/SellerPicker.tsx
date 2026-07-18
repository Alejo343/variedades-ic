"use client";

import { useRouter } from "next/navigation";

type Seller = { id: number; name: string };

export function SellerPicker({ sellers }: { sellers: Seller[] }) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) router.push(`/admin/seller-sales/new?sellerId=${e.target.value}`);
        }}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Selecciona un vendedor...</option>
        {sellers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
