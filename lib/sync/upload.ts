import { mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

// Shared by /api/admin/upload (browser session) and /api/sync/upload (phone
// token, sub-paso 8) — both need the same file, so this validates and
// converts it exactly once. Product photos always land as WebP under
// public/uploads/products/ regardless of who uploaded them, so upsertProduct
// (sub-paso 7, parte 3a) sees the same kind of URL either way.
export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_SIZE_MB = 10;

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function saveProductImage(file: File | null): Promise<UploadResult> {
  if (!file) return { ok: false, error: "No se recibió archivo" };
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return { ok: false, error: "Tipo de archivo no permitido" };
  if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) return { ok: false, error: `El archivo supera ${MAX_UPLOAD_SIZE_MB}MB` };

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${crypto.randomUUID()}.webp`;
  const uploadDir = join(process.cwd(), "public", "uploads", "products");
  const savePath = join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });
  await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 85 }).toFile(savePath);

  return { ok: true, url: `/uploads/products/${filename}` };
}
