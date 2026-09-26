import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { deviceSessions } from "@/lib/db/schema";
import { authenticateDevice, unauthorizedDevice } from "@/lib/sync/auth";

// "Cerrar sesión" on the phone: revokes only this phone's token.
export async function POST(req: Request) {
  const principal = await authenticateDevice(req);
  if (!principal) return unauthorizedDevice();
  await db.update(deviceSessions).set({ revokedAt: new Date() }).where(eq(deviceSessions.id, principal.sessionId));
  return NextResponse.json({ ok: true });
}
