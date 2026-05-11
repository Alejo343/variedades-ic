import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { markPurchaseOrderReceived } from "@/lib/db/queries/purchase-orders";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const updated = await markPurchaseOrderReceived(Number(id));

  if (!updated) {
    return NextResponse.json(
      { error: "No encontrado o el stock ya fue actualizado" },
      { status: 400 }
    );
  }

  return NextResponse.json(updated);
}
