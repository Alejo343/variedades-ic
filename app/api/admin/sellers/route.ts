import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllSellers, createSeller } from "@/lib/db/queries/sellers";
import { sellerSchema } from "@/lib/validations";

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

  const [seller] = await createSeller(parsed.data);
  return NextResponse.json(seller, { status: 201 });
}
