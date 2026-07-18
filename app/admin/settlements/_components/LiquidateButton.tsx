"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LiquidateButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/settlements/${id}/liquidate`, { method: "POST" });

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
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-blue-600 hover:text-blue-800 font-medium text-sm disabled:opacity-60"
      >
        {loading ? "Liquidando..." : "Liquidar"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
