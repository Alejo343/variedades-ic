import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return NextResponse.json({ error: `El archivo supera ${MAX_SIZE_MB}MB` }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${crypto.randomUUID()}.webp`;
  const savePath = join(process.cwd(), "public", "uploads", "products", filename);

  await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(savePath);

  return NextResponse.json({ url: `/uploads/products/${filename}` }, { status: 201 });
}
