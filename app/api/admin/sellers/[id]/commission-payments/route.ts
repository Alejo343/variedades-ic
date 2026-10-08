import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCommissionPayment, pendingCommission } from "@/lib/db/queries/commission-payments";
import { commissionPaymentSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

// Preview: what a payment up to ?periodDate would cover.
export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const periodDate = req.nextUrl.searchParams.get("periodDate") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodDate)) return NextResponse.json({ error: "Fecha con formato inválido" }, { status: 400 });

  return NextResponse.json(await pendingCommission(db, Number(id), periodDate));
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const parsed = commissionPaymentSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await createCommissionPayment({ sellerId: Number(id), ...parsed.data });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json(result.payment, { status: 201 });
}
