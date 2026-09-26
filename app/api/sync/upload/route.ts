import { NextResponse } from "next/server";
import { authenticateDevice, unauthorizedDevice } from "@/lib/sync/auth";
import { saveProductImage } from "@/lib/sync/upload";

// Upload from the phone (sub-paso 8): the photo has to reach the server as a
// real URL before upsertProduct's push, which rejects a file:// path (see
// lib/sync/operations/catalog.ts). Owner only — sellers never edit the
// catalog (CLAUDE.md, "Fase 10").
export async function POST(req: Request) {
  const principal = await authenticateDevice(req);
  if (!principal) return unauthorizedDevice();
  if (principal.role !== "owner") return NextResponse.json({ error: "Solo el dueño puede subir fotos de productos" }, { status: 403 });

  const formData = await req.formData();
  const result = await saveProductImage(formData.get("file") as File | null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ url: result.url }, { status: 201 });
}
