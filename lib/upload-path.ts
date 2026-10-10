import { extname } from "path";

// Contract for app/uploads/[...path]/route.ts: turns the URL segments after
// /uploads/ into a path relative to public/uploads/, or null when the request
// could reach outside that folder or isn't an image we store.
// Invariants: every segment is a plain file/folder name (no "..", no slashes,
// no hidden files), and the extension is one of UPLOAD_CONTENT_TYPES.
export const UPLOAD_CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

const SAFE_SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

export function resolveUploadPath(segments: string[]): { relativePath: string; contentType: string } | null {
  if (segments.length === 0) return null;
  if (!segments.every((s) => SAFE_SEGMENT.test(s) && !s.includes(".."))) return null;
  const contentType = UPLOAD_CONTENT_TYPES[extname(segments[segments.length - 1]).toLowerCase()];
  if (!contentType) return null;
  return { relativePath: segments.join("/"), contentType };
}
