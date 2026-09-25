"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: number; name: string };

export function LiquidateButton({ id, accounts }: { id: number; accounts: Account[] }) {
  const router = useRouter();
  const [accountId, setAccountId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (accountId === "") {
      setError("Selecciona la cuenta");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/settlements/${id}/liquidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Error al liquidar");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : "")}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Cuenta...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm disabled:opacity-60"
        >
          {loading ? "Liquidando..." : "Liquidar"}
        </button>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
