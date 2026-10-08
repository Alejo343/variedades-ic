import bcrypt from "bcryptjs";
import { getSellerById } from "@/lib/db/queries/sellers";
import { createSellerUser, getUserBySellerId, getUserByUsername, updateSellerUser } from "@/lib/db/queries/users";
import { sellerUserCreateSchema, sellerUserUpdateSchema } from "@/lib/validations";

// A seller's app login (username + password), managed by the owner from the
// panel (/api/admin/sellers/[id]/user) or from the owner's phone
// (/api/sync/sellers/[sellerUuid]/access). Same rules on both paths.

const BCRYPT_COST = 12;

export type AccessResult = { status: number; body: unknown };

// Creates the seller's login (one per seller — the users table enforces it).
export async function createSellerAccess(sellerId: number, input: unknown): Promise<AccessResult> {
  const parsed = sellerUserCreateSchema.safeParse(input);
  if (!parsed.success) return { status: 400, body: { error: parsed.error.flatten() } };

  const [seller] = await getSellerById(sellerId);
  if (!seller) return { status: 404, body: { error: "No encontrado" } };

  const [existing] = await getUserBySellerId(sellerId);
  if (existing) return { status: 409, body: { error: "Este vendedor ya tiene usuario" } };

  const [taken] = await getUserByUsername(parsed.data.username);
  if (taken) return { status: 409, body: { error: `El usuario "${parsed.data.username}" ya existe` } };

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);
  try {
    const [user] = await createSellerUser({ sellerId, name: seller.name, username: parsed.data.username, passwordHash });
    return { status: 201, body: user };
  } catch (e) {
    // Lost a race against another create: the UNIQUE constraints still hold.
    if ((e as { code?: string }).code === "23505") return { status: 409, body: { error: "El usuario ya existe" } };
    throw e;
  }
}

// Changes the password and/or activates/deactivates the login. Deactivating
// cuts off sync on every phone of that seller (checked on each sync request).
export async function updateSellerAccess(sellerId: number, input: unknown): Promise<AccessResult> {
  const parsed = sellerUserUpdateSchema.safeParse(input);
  if (!parsed.success) return { status: 400, body: { error: parsed.error.flatten() } };

  const { password, active } = parsed.data;
  const passwordHash = password === undefined ? undefined : await bcrypt.hash(password, BCRYPT_COST);
  const [user] = await updateSellerUser(sellerId, { passwordHash, active });
  if (!user) return { status: 404, body: { error: "No encontrado" } };
  return { status: 200, body: user };
}
