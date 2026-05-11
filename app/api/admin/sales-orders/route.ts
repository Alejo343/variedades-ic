import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllSalesOrders, createSalesOrder, addSalesOrderItem } from "@/lib/db/queries/sales-orders";
import { salesOrderSchema, salesOrderItemSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const data = await getAllSalesOrders();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();

  if (body.addItem) {
    const parsed = salesOrderItemSchema.safeParse(body.addItem);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const [item] = await addSalesOrderItem(parsed.data);
    return NextResponse.json(item, { status: 201 });
  }

  const parsed = salesOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [order] = await createSalesOrder(parsed.data);
  return NextResponse.json(order, { status: 201 });
}
