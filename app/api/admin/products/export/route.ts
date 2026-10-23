import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportProductSheet } from "@/lib/db/queries/product-import";

// GET → { rows }: the whole catalog in the import template's columns
// (header first). The client turns it into the .xlsx.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rows = await exportProductSheet();
  return NextResponse.json({ rows });
}
