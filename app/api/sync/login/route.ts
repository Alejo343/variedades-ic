import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { deviceSessions, sellers, users } from "@/lib/db/schema";
import { createLoginThrottle } from "@/lib/domain/login-throttle";
import type { UserRole } from "@/lib/domain/users";
import { principalPayload } from "@/lib/sync/auth";
import { generateDeviceToken, hashDeviceToken } from "@/lib/sync/tokens";
import { syncLoginSchema } from "@/lib/validations";

// Sync login from the phone (sub-paso 5): username + password → a long-lived
// device token. Owners and sellers can both sign in here (only owners can use
// the web panel). Public on the internet, hence the throttle and the uniform
// error message — it never reveals whether the username exists.

const throttle = createLoginThrottle({ maxFailures: 5, windowMs: 15 * 60_000 });
const INVALID = "Usuario o contraseña incorrectos";

// Compared against when the username doesn't exist, so a wrong username takes
// as long as a wrong password (no timing hint about which usernames exist).
let dummyHash: string | undefined;

export async function POST(req: Request) {
  const parsed = syncLoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { username, password, deviceName } = parsed.data;

  const now = Date.now();
  const gate = throttle.check(username, now);
  if (!gate.allowed) {
    const minutes = Math.ceil(gate.retryAfterMs / 60_000);
    return NextResponse.json(
      { error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} min.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(gate.retryAfterMs / 1000)) } },
    );
  }

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      active: users.active,
      passwordHash: users.passwordHash,
      sellerUuid: sellers.uuid,
      sellerName: sellers.name,
      sellerActive: sellers.active,
    })
    .from(users)
    .leftJoin(sellers, eq(sellers.id, users.sellerId))
    .where(eq(users.username, username))
    .limit(1);

  dummyHash ??= await bcrypt.hash("not-a-real-password", 12);
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
  const allowed = !!user && passwordOk && user.active && (user.role === "owner" || user.sellerActive === true);
  if (!allowed) {
    throttle.recordFailure(username, now);
    return NextResponse.json({ error: INVALID }, { status: 401 });
  }
  throttle.reset(username);

  const token = generateDeviceToken();
  await db.insert(deviceSessions).values({ userId: user.id, tokenHash: hashDeviceToken(token), deviceName: deviceName ?? null });

  return NextResponse.json(
    { token, ...principalPayload({ ...user, role: user.role as UserRole }) },
    { status: 201 },
  );
}
