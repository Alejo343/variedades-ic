"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: number; name: string };

type Props = {
  orderId: number;
  pending: number;
  accounts: Account[];
};

export function PaymentForm({ orderId, pending, accounts }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(pending);
  const [accountId, setAccountId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (accountId === "") {
      setError("Selecciona la cuenta");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/purchase-orders/${orderId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, accountId, notes: notes || undefined }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Error al registrar el pago");
      return;
    }

    setAmount(0);
    setAccountId("");
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
          placeholder="Monto (COP)"
          className="w-40 adm-input num"
        />
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : "")}
          required
          className="flex-1 min-w-40 adm-input"
        >
          <option value="">Cuenta...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas (opcional)"
        className="adm-input"
      />
      {error && <p className="adm-alert adm-alert-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading || amount < 1}
        className="adm-btn adm-btn-primary self-start"
      >
        {loading ? "Registrando…" : "Registrar pago"}
      </button>
    </form>
  );
}
