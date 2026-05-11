import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllPurchaseOrders, createPurchaseOrder, addPurchaseOrderItem } from "@/lib/db/queries/purchase-orders";
import { purchaseOrderSchema, purchaseOrderItemSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const data = await getAllPurchaseOrders();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();

  if (body.addItem) {
    const parsed = purchaseOrderItemSchema.safeParse(body.addItem);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const [item] = await addPurchaseOrderItem(parsed.data);
    return NextResponse.json(item, { status: 201 });
  }

  const parsed = purchaseOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [order] = await createPurchaseOrder(parsed.data);
  return NextResponse.json(order, { status: 201 });
}
