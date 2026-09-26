"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccessUser = { username: string; active: boolean };
type DeviceSession = {
  id: number;
  deviceName: string | null;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
};

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

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
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Acceso a la app</h2>
        {user && (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              user.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {user.active ? "Activo" : "Desactivado"}
          </span>
        )}
      </div>

      {!user ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-3 max-w-md">
          <p className="text-sm text-gray-500">
            Este vendedor todavía no puede entrar a la app. Crea su usuario para que registre sus ventas desde su
            celular.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario *</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="off"
              placeholder="ej. maria.gomez"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña * (mínimo 8)</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="self-start bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Crear acceso
          </button>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Usuario: <span className="font-medium text-gray-800">{user.username}</span>
            </p>
            <button
              onClick={handleToggleActive}
              disabled={loading}
              className="border border-gray-300 text-sm text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {user.active ? "Desactivar acceso" : "Activar acceso"}
            </button>
          </div>

          <form onSubmit={handleChangePassword} className="flex items-end gap-2 max-w-md">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña (mínimo 8)</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="border border-gray-300 text-sm text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Cambiar
            </button>
          </form>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Celulares conectados</h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400">Todavía no ha iniciado sesión en ningún celular.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Celular</th>
                    <th className="pb-2 font-medium">Conectado desde</th>
                    <th className="pb-2 font-medium">Última sincronización</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50">
                      <td className="py-2 text-gray-700">{s.deviceName ?? "Sin nombre"}</td>
                      <td className="py-2 text-gray-600">{formatDate(s.createdAt)}</td>
                      <td className="py-2 text-gray-600">{formatDate(s.lastSeenAt)}</td>
                      <td className="py-2 text-right">
                        {s.revokedAt ? (
                          <span className="text-xs text-gray-400">Revocado</span>
                        ) : (
                          <button
                            onClick={() => handleRevoke(s.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                          >
                            Revocar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-green-700">{notice}</p>}
    </div>
  );
}
