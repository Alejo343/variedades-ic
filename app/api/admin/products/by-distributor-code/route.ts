import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findProductByDistributorCode } from "@/lib/db/queries/products";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Falta el parámetro code" }, { status: 400 });

  const product = await findProductByDistributorCode(code);
  return NextResponse.json(product);
}
