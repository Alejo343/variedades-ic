import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveProductImage } from "@/lib/sync/upload";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const result = await saveProductImage(formData.get("file") as File | null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ url: result.url }, { status: 201 });
}
