import { NextResponse } from "next/server";
import { authenticateDevice, principalPayload, unauthorizedDevice } from "@/lib/sync/auth";

// Lets the phone check that its token still works (not revoked, user and
// seller still active) and refresh what it knows about its own user.
export async function GET(req: Request) {
  const principal = await authenticateDevice(req);
  if (!principal) return unauthorizedDevice();
  return NextResponse.json(principalPayload(principal));
}
