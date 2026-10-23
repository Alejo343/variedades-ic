import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { createSalaryPayment } from "@/lib/db/queries/salary-payments";
import { salaryPaymentSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

// Paying one period of a salaried store seller's salary.
export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const parsed = salaryPaymentSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await createSalaryPayment({ sellerId: Number(id), ...parsed.data });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json(result.payment, { status: 201 });
}
