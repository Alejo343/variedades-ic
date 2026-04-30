import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getCategoryById, updateCategory, deleteCategory } from "@/lib/db/queries/categories";
import { categorySchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const [category] = await getCategoryById(Number(id));

  if (!category) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(category);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = categorySchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await updateCategory(Number(id), parsed.data);
  if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const [deleted] = await deleteCategory(Number(id));

  if (!deleted) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(deleted);
}
