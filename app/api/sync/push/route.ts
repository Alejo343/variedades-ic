import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDevice, unauthorizedDevice } from "@/lib/sync/auth";
import { syncHandlers } from "@/lib/sync/operations";
import { applyOperations } from "@/lib/sync/push";
import { syncPushSchema } from "@/lib/validations";

// POST /api/sync/push — see lib/sync/push.ts for the contract. Always 200 with
// one result per operation once the envelope is valid; per-operation outcomes
// (applied / rejected / error / skipped) live in `results`.
export async function POST(req: Request) {
  const principal = await authenticateDevice(req);
  if (!principal) return unauthorizedDevice();

  const parsed = syncPushSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const results = await applyOperations(
    db,
    {
      role: principal.role,
      userId: principal.userId,
      sessionId: principal.sessionId,
      sellerId: principal.sellerId,
      sellerUuid: principal.sellerUuid,
    },
    parsed.data.operations,
    syncHandlers,
  );
  return NextResponse.json({ results });
}
