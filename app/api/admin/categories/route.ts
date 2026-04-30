import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllCategories, createCategory } from "@/lib/db/queries/categories";
import { categorySchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const data = await getAllCategories();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [category] = await createCategory(parsed.data);
  return NextResponse.json(category, { status: 201 });
}
