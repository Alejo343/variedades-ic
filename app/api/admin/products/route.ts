import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllProducts, createProduct } from "@/lib/db/queries/products";
import { productSchema } from "@/lib/validations";
import { SkuConflictError } from "@/lib/db/queries/sku";

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

  try {
    const [product] = await createProduct(parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof SkuConflictError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const pgErr = err as { code?: string; constraint?: string };
    if (pgErr.code === "23505") {
      const field = pgErr.constraint?.includes("sku") ? "SKU" : "código de proveedor";
      return NextResponse.json({ error: `Ya existe un producto con ese ${field}` }, { status: 400 });
    }
    throw err;
  }
}
