import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSellerReturn } from "@/lib/db/queries/seller-returns";
import { sellerReturnSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = sellerReturnSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createSellerReturn(parsed.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.sellerReturn, { status: 201 });
}
