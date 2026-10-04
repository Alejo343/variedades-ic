"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";
import { Badge } from "../../_components/ui";

type AccessUser = { username: string; active: boolean };
type DeviceSession = {
  id: number;
  deviceName: string | null;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
};

// API errors come either as a plain string or as a zod flatten() object.
async function errorMessage(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  const err = data.error;
  if (typeof err === "string") return err;
  const first = err?.formErrors?.[0] ?? Object.values(err?.fieldErrors ?? {}).flat()[0];
  return typeof first === "string" ? first : "Error al guardar";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

// The seller's login for the mobile app (sub-paso 4 of the mobile sync):
// create it, change its password, activate/deactivate it, and revoke phones.
export function SellerAccessCard({
  sellerId,
  user,
  sessions,
}: {
  sellerId: number;
  user: AccessUser | null;
  sessions: DeviceSession[];
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function send(url: string, method: string, body?: unknown): Promise<boolean> {
    setLoading(true);
    setError("");
    setNotice("");
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setLoading(false);
    if (!res.ok) {
      setError(await errorMessage(res));
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (await send(`/api/admin/sellers/${sellerId}/user`, "POST", { username, password })) {
      setPassword("");
      setNotice("Acceso creado. Comparte el usuario y la contraseña con el vendedor.");
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (await send(`/api/admin/sellers/${sellerId}/user`, "PATCH", { password })) {
      setPassword("");
      setNotice("Contraseña cambiada. Los celulares ya conectados siguen funcionando.");
    }
  }

  async function handleToggleActive() {
    if (!user) return;
    if (user.active && !confirm("¿Desactivar el acceso? El vendedor dejará de sincronizar en todos sus celulares.")) return;
    await send(`/api/admin/sellers/${sellerId}/user`, "PATCH", { active: !user.active });
  }

  async function handleRevoke(sessionId: number) {
    if (!confirm("¿Revocar este celular? Tendrá que volver a iniciar sesión para sincronizar.")) return;
    await send(`/api/admin/sellers/${sellerId}/devices/${sessionId}`, "DELETE");
  }

  return (
    <section className="adm-card overflow-hidden">
      <div className="adm-card-head">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg grid place-items-center bg-[var(--adm-brand-soft)] text-[var(--adm-brand)]">
            <Smartphone size={17} />
          </span>
          <div>
            <h2 className="adm-card-title">Acceso a la app móvil</h2>
            <p className="adm-card-desc">El vendedor registra ventas, devoluciones y pérdidas desde su celular.</p>
          </div>
        </div>
        {user && <Badge tone={user.active ? "ok" : "neutral"}>{user.active ? "Activo" : "Desactivado"}</Badge>}
      </div>

      <div className="adm-card-body flex flex-col gap-5">
        {!user ? (
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <p className="sm:col-span-3 text-sm text-[var(--adm-ink-2)]">
              Este vendedor todavía no puede entrar a la app. Crea su usuario para que registre sus ventas desde su celular.
            </p>
            <div>
              <label className="adm-label">Usuario</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
                placeholder="ej. maria.gomez"
                className="adm-input"
              />
            </div>
            <div>
              <label className="adm-label">Contraseña (mínimo 8)</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="adm-input"
              />
            </div>
            <button type="submit" disabled={loading} className="adm-btn adm-btn-primary">
              Crear acceso
            </button>
          </form>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:justify-between">
              <div>
                <p className="adm-eyebrow">Usuario</p>
                <p className="num text-[15px] font-medium mt-1">{user.username}</p>
              </div>
              <form onSubmit={handleChangePassword} className="flex items-end gap-2 flex-1 sm:max-w-md">
                <div className="flex-1">
                  <label className="adm-label">Nueva contraseña (mínimo 8)</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="adm-input"
                  />
                </div>
                <button type="submit" disabled={loading} className="adm-btn">
                  Cambiar
                </button>
              </form>
              <button onClick={handleToggleActive} disabled={loading} className={`adm-btn ${user.active ? "adm-btn-danger" : ""}`}>
                {user.active ? "Desactivar acceso" : "Activar acceso"}
              </button>
            </div>

            <div>
              <p className="adm-eyebrow mb-2">Celulares conectados</p>
              {sessions.length === 0 ? (
                <p className="text-sm text-[var(--adm-ink-3)]">Todavía no ha iniciado sesión en ningún celular.</p>
              ) : (
                <div className="adm-table-wrap rounded-xl border border-[var(--adm-line)]">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Celular</th>
                        <th>Conectado desde</th>
                        <th>Última sincronización</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => (
                        <tr key={s.id}>
                          <td className="t-strong">{s.deviceName ?? "Sin nombre"}</td>
                          <td>{formatDate(s.createdAt)}</td>
                          <td>{formatDate(s.lastSeenAt)}</td>
                          <td className="t-right">
                            {s.revokedAt ? (
                              <Badge plain>Revocado</Badge>
                            ) : (
                              <button onClick={() => handleRevoke(s.id)} disabled={loading} className="adm-btn adm-btn-danger adm-btn-sm">
                                Revocar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {error && <p className="adm-alert adm-alert-danger">{error}</p>}
        {notice && <p className="adm-alert adm-alert-ok">{notice}</p>}
      </div>
    </section>
  );
}
