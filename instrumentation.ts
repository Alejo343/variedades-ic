export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { eq } = await import("drizzle-orm");
    const path = await import("path");
    const { users } = await import("@/lib/db/schema");
    const { ownerSeedFromEnv } = await import("@/lib/domain/users");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);

    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

    // First owner comes from ADMIN_EMAIL/ADMIN_PASSWORD_HASH, only once — see
    // lib/domain/users.ts#ownerSeedFromEnv.
    const [existingOwner] = await db.select({ id: users.id }).from(users).where(eq(users.role, "owner")).limit(1);
    const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH } = process.env;
    const seed = ownerSeedFromEnv({ ADMIN_EMAIL, ADMIN_PASSWORD_HASH }, !!existingOwner);
    if (seed) await db.insert(users).values(seed).onConflictDoNothing();

    await pool.end();
  }
}
