// Users and roles shared by the admin panel and the mobile sync (see
// variedades-ic-mobile's CLAUDE.md, "Fase 10"):
// - owner: sees and does everything; the only role allowed into this panel.
// - seller: tied to one `sellers` row; only uses the mobile app, limited to
//   their own consigned inventory, sales, returns and losses.
export type UserRole = "owner" | "seller";

// Usernames are compared case- and whitespace-insensitively (the owner's is
// their email, so "Admin@X.com " and "admin@x.com" must be the same user).
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function canSignInToPanel(user: { role: UserRole; active: boolean }): boolean {
  return user.active && user.role === "owner";
}

export type OwnerSeed = { username: string; name: string; passwordHash: string; role: "owner" };

// ADMIN_EMAIL/ADMIN_PASSWORD_HASH used to be the panel's only login. They now
// only seed the first owner, once: after that the users table is the source
// of truth and editing the env does nothing.
export function ownerSeedFromEnv(
  env: { ADMIN_EMAIL?: string; ADMIN_PASSWORD_HASH?: string },
  ownerExists: boolean,
): OwnerSeed | null {
  if (ownerExists) return null;
  const username = normalizeUsername(env.ADMIN_EMAIL ?? "");
  const passwordHash = env.ADMIN_PASSWORD_HASH ?? "";
  if (!username || !passwordHash) return null;
  return { username, name: "Dueño", passwordHash, role: "owner" };
}
