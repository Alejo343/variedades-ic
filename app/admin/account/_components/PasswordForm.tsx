"use client";

import { useState } from "react";
import { ErrorAlert, Field } from "../../_components/ui";

type Fields = "currentPassword" | "newPassword" | "confirmPassword";
const EMPTY: Record<Fields, string> = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordForm() {
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Fields, string>>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: Fields, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => ({ ...e, [field]: undefined }));
    setDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});
    setDone(false);

    const res = await fetch("/api/admin/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const fe = (data.error?.fieldErrors ?? {}) as Partial<Record<Fields, string[]>>;
      setFieldErrors({
        currentPassword: fe.currentPassword?.[0],
        newPassword: fe.newPassword?.[0],
        confirmPassword: fe.confirmPassword?.[0],
      });
      const general = data.error?.formErrors?.[0] ?? (typeof data.error === "string" ? data.error : "");
      if (general || Object.keys(fe).length === 0) setError(general || "No se pudo cambiar la contraseña");
      return;
    }

    setForm(EMPTY);
    setDone(true);
  }

  const input = (field: Fields, autoComplete: string) => (
    <>
      <input
        id={field}
        type="password"
        value={form[field]}
        onChange={(e) => set(field, e.target.value)}
        autoComplete={autoComplete}
        required
        className="adm-input"
        aria-invalid={!!fieldErrors[field]}
      />
      {fieldErrors[field] && <p className="text-[13px] text-[var(--adm-danger)] mt-1.5">{fieldErrors[field]}</p>}
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="adm-card p-6 max-w-lg flex flex-col gap-5">
      <h2 className="text-[17px] font-semibold text-[var(--adm-ink)]">Cambiar contraseña</h2>

      <Field label="Contraseña actual" htmlFor="currentPassword">
        {input("currentPassword", "current-password")}
      </Field>
      <Field label="Contraseña nueva" htmlFor="newPassword" hint="Mínimo 8 caracteres.">
        {input("newPassword", "new-password")}
      </Field>
      <Field label="Repite la contraseña nueva" htmlFor="confirmPassword">
        {input("confirmPassword", "new-password")}
      </Field>

      <ErrorAlert>{error}</ErrorAlert>
      {done && (
        <p role="status" className="adm-alert adm-alert-ok">
          Contraseña actualizada.
        </p>
      )}

      <div className="pt-1">
        <button type="submit" disabled={loading} className="adm-btn adm-btn-primary">
          {loading ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}
