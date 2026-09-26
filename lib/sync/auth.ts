import { and, eq, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deviceSessions, sellers, users } from "@/lib/db/schema";
import type { UserRole } from "@/lib/domain/users";
import { hashDeviceToken, parseBearer } from "./tokens";

// Who is behind a sync request (sub-paso 5). A token only works while its
// session isn't revoked, its user is active and — for a seller — the sellers
// row is active too; all three are checked on every request, so revoking a
// phone or deactivating a user/seller in the panel takes effect immediately.
export type DevicePrincipal = {
  sessionId: number;
  userId: number;
  username: string;
  name: string;
  role: UserRole;
  sellerId: number | null;
  sellerUuid: string | null;
  sellerName: string | null;
};

export async function authenticateDevice(req: Request): Promise<DevicePrincipal | null> {
  const token = parseBearer(req.headers.get("authorization"));
  if (!token) return null;

  const [row] = await db
    .select({
      sessionId: deviceSessions.id,
      userId: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      sellerId: users.sellerId,
      sellerUuid: sellers.uuid,
      sellerName: sellers.name,
    })
    .from(deviceSessions)
    .innerJoin(users, eq(users.id, deviceSessions.userId))
    .leftJoin(sellers, eq(sellers.id, users.sellerId))
    .where(
      and(
        eq(deviceSessions.tokenHash, hashDeviceToken(token)),
        isNull(deviceSessions.revokedAt),
        eq(users.active, true),
        or(eq(users.role, "owner"), eq(sellers.active, true)),
      ),
    )
    .limit(1);
  if (!row) return null;

  await db.update(deviceSessions).set({ lastSeenAt: new Date() }).where(eq(deviceSessions.id, row.sessionId));
  return { ...row, role: row.role as UserRole };
}

export const unauthorizedDevice = () =>
  NextResponse.json({ error: "Sesión no válida. Vuelve a iniciar sesión." }, { status: 401 });

// What the phone learns about its own user — the same shape from login and
// from /api/sync/me. Local ids are never sent; the seller is identified by uuid.
export function principalPayload(p: Pick<DevicePrincipal, "username" | "name" | "role" | "sellerUuid" | "sellerName">) {
  return {
    user: { username: p.username, name: p.name, role: p.role },
    seller: p.sellerUuid ? { uuid: p.sellerUuid, name: p.sellerName } : null,
  };
}
