import { createHash, randomBytes } from "crypto";

// Device tokens for the mobile sync (sub-paso 5): 32 random bytes, sent by the
// phone as `Authorization: Bearer <token>`. The server only keeps the SHA-256
// (device_sessions.token_hash) — a plain hash is enough because the token is
// random and long, unlike a password.

export function generateDeviceToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function parseBearer(header: string | null): string | null {
  const match = header?.trim().match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}
