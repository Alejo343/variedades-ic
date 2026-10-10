import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { changeOwnPassword } from "@/lib/account/password";

// Changes the signed-in owner's own password (see lib/account/password.ts).
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const result = await changeOwnPassword(session.user.email, await req.json());
  return NextResponse.json(result.body, { status: result.status });
}
