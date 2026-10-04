"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos.");
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="adm min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand side */}
      <div className="adm-login-art relative hidden lg:flex flex-col justify-between p-12 overflow-hidden text-white">
        <div className="adm-grid-lines absolute inset-0" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-sky-400 to-sky-700 font-bold text-sm shadow-[0_0_30px_rgba(56,189,248,.45)]">
            IC
          </span>
          <span className="font-display font-semibold text-lg">IC Variedades</span>
        </div>

        <div className="relative max-w-md">
          <p className="adm-eyebrow !text-sky-300/80 mb-4">Panel de gestión</p>
          <h1 className="text-[44px] leading-[1.05] font-semibold">
            Todo el negocio,
            <br />
            <span className="text-sky-300">en un solo lugar.</span>
          </h1>
          <p className="mt-5 text-[15px] text-slate-300/90 leading-relaxed">
            Inventario, compras, ventas en local y por WhatsApp, vendedores en consignación, liquidaciones y caja.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-3 max-w-md">
          {[
            ["Inventario", "al día"],
            ["Caja", "por cuenta"],
            ["Vendedores", "liquidados"],
          ].map(([a, b]) => (
            <div key={a} className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 backdrop-blur-sm">
              <p className="text-[13px] font-medium">{a}</p>
              <p className="text-[12px] text-slate-400">{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm adm-page">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <span className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-sky-400 to-sky-700 text-white font-bold text-sm">
              IC
            </span>
            <span className="font-display font-semibold text-lg">IC Variedades</span>
          </div>
          <div>
            <h2 className="text-[30px] font-semibold leading-tight">Bienvenido de nuevo</h2>
            <p className="text-[var(--adm-ink-2)] mt-2 text-[15px]">Ingresa con tu cuenta de administrador.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
            <div>
              <label className="adm-label" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--adm-ink-3)]" />
                <input id="email" name="email" type="email" required autoComplete="username" className="adm-input h-11 pl-10" />
              </div>
            </div>
            <div>
              <label className="adm-label" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--adm-ink-3)]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="adm-input h-11 pl-10"
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="adm-alert adm-alert-danger">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="adm-btn adm-btn-primary adm-btn-lg mt-2 w-full">
              {loading ? "Entrando…" : "Entrar"}
              {!loading && <ArrowRight />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
