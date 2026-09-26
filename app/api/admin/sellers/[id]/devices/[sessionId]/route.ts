import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { revokeSellerDeviceSession } from "@/lib/db/queries/users";

type Ctx = { params: Promise<{ id: string; sessionId: string }> };

// Revokes one phone's sync token; the seller's other phones keep working.
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, sessionId } = await ctx.params;
  const [revoked] = await revokeSellerDeviceSession(Number(id), Number(sessionId));
  if (!revoked) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(revoked);
}
