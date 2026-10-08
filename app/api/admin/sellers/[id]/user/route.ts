import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { createSellerAccess, updateSellerAccess } from "@/lib/sellers/access";

type Ctx = { params: Promise<{ id: string }> };

// Creates the seller's app login (see lib/sellers/access.ts).
export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const result = await createSellerAccess(Number(id), await req.json());
  return NextResponse.json(result.body, { status: result.status });
}

// Changes the password and/or activates/deactivates the login.
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const result = await updateSellerAccess(Number(id), await req.json());
  return NextResponse.json(result.body, { status: result.status });
}
