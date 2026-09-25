import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSalesOrderById,
  updateSalesOrder,
  deleteSalesOrder,
  confirmSalesOrder,
} from "@/lib/db/queries/sales-orders";
import { salesOrderSchema, accountSelectionSchema } from "@/lib/validations";
import { canTransitionSalesOrder, type SalesOrderStatus } from "@/lib/domain/order-status";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const order = await getSalesOrderById(Number(id));

  if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = salesOrderSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.status) {
    if (parsed.data.status === "confirmado") {
      const accountParsed = accountSelectionSchema.safeParse(body);
      if (!accountParsed.success) {
        return NextResponse.json({ error: accountParsed.error.flatten() }, { status: 400 });
      }

      const result = await confirmSalesOrder(Number(id), accountParsed.data.accountId);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result.order);
    }

    const current = await getSalesOrderById(Number(id));
    if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (!canTransitionSalesOrder(current.status as SalesOrderStatus, parsed.data.status)) {
      return NextResponse.json(
        { error: `No se puede pasar de '${current.status}' a '${parsed.data.status}'` },
        { status: 400 }
      );
    }
  }

  const [updated] = await updateSalesOrder(Number(id), parsed.data);
  if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const [deleted] = await deleteSalesOrder(Number(id));

  if (!deleted) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(deleted);
}
