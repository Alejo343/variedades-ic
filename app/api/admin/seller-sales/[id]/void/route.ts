import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { voidSaleFromPanel } from "@/lib/db/queries/sale-voids";
import { saleVoidSchema } from "@/lib/validations";

// POST { reason? } → voids the sale (lib/domain/sale-void.ts).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const parsed = saleVoidSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await voidSaleFromPanel("seller", Number(id), parsed.data.reason ?? null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
