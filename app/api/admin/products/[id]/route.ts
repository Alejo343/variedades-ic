import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getProductById, updateProduct, deleteProduct, addProductImage, deleteProductImage } from "@/lib/db/queries/products";
import { productSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const product = await getProductById(Number(id));

  if (!product) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  if (body.addImage) {
    const [img] = await addProductImage({ productId: Number(id), ...body.addImage });
    return NextResponse.json(img);
  }

  if (body.deleteImageId) {
    const [img] = await deleteProductImage(Number(body.deleteImageId));
    return NextResponse.json(img);
  }

  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await updateProduct(Number(id), parsed.data);
  if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const [deleted] = await deleteProduct(Number(id));

  if (!deleted) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(deleted);
}
