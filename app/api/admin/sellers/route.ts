import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllSellers, createSeller } from "@/lib/db/queries/sellers";
import { resolveSellerPay } from "@/lib/db/queries/seller-pay";
import { db } from "@/lib/db";
import { sellerSchema } from "@/lib/validations";
import { todayInBogota } from "@/app/admin/_lib/format";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const data = await getAllSellers();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = sellerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pay = await resolveSellerPay(db, null, parsed.data, todayInBogota());
  if (!pay.ok) return NextResponse.json({ error: pay.error }, { status: 400 });

  const [seller] = await createSeller({ ...parsed.data, ...pay.values });
  return NextResponse.json(seller, { status: 201 });
}
