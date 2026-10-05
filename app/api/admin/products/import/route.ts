import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { productImportSchema } from "@/lib/validations";
import { applyProductImport, previewProductImport } from "@/lib/db/queries/product-import";

// POST { rows, dryRun: true }  → plan (preview, writes nothing)
// POST { rows, dryRun: false } → applies the plan in one transaction
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = productImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.dryRun) {
    const plan = await previewProductImport(parsed.data.rows);
    return NextResponse.json({ plan });
  }

  const result = await applyProductImport(parsed.data.rows);
  if (!result.ok) return NextResponse.json({ error: result.error, plan: result.plan }, { status: 400 });
  return NextResponse.json(result);
}
