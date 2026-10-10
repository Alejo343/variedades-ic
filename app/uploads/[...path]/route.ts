import { readFile } from "fs/promises";
import { join } from "path";
import { resolveUploadPath } from "@/lib/upload-path";

// Browsers never reach this: OpenLiteSpeed serves /uploads/ straight from
// disk. It exists for the image optimizer (/_next/image), which fetches the
// source from Next itself — and `next start` only serves public/ files that
// existed at build time, so photos uploaded after a deploy answered 404 there
// and the optimizer 400.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolved = resolveUploadPath((await params).path);
  if (!resolved) return new Response("Not found", { status: 404 });

  try {
    const file = await readFile(join(process.cwd(), "public", "uploads", resolved.relativePath));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": resolved.contentType,
        // Uploaded files get a fresh random name; they never change in place.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
