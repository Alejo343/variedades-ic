"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: number;
  pending: number;
};

export function PaymentForm({ orderId, pending }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(pending);
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/purchase-orders/${orderId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method: method || undefined, notes: notes || undefined }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Error al registrar el pago");
      return;
    }

    setAmount(0);
    setMethod("");
    setNotes("");
    router.refresh();
  }

  if (pending <= 0) return null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap">
        <input
          type="number"
          min={1}
          max={pending}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Monto (centavos)"
          className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          placeholder="Método (opcional)"
          className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas (opcional)"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading || amount < 1}
        className="self-start bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
      >
        {loading ? "Registrando..." : "Registrar pago"}
      </button>
    </form>
  );
}
