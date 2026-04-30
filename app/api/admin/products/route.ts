import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllProducts, createProduct } from "@/lib/db/queries/products";
import { productSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const data = await getAllProducts();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [product] = await createProduct(parsed.data);
  return NextResponse.json(product, { status: 201 });
}
