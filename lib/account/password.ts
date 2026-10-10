import bcrypt from "bcryptjs";
import { getOwnerCredentials, updateOwnerPassword } from "@/lib/db/queries/users";
import { normalizeUsername } from "@/lib/domain/users";
import { ownPasswordChangeSchema } from "@/lib/validations";

// The signed-in owner changing their own panel password. Requires the current
// password, so a session left open on a shared computer can't lock the owner
// out. The owner's phone keeps syncing: device tokens don't depend on it.

const BCRYPT_COST = 12;

export type PasswordChangeResult = { status: number; body: unknown };

export async function changeOwnPassword(sessionUsername: string, input: unknown): Promise<PasswordChangeResult> {
  const parsed = ownPasswordChangeSchema.safeParse(input);
  if (!parsed.success) return { status: 400, body: { error: parsed.error.flatten() } };

  const [owner] = await getOwnerCredentials(normalizeUsername(sessionUsername));
  if (!owner) return { status: 404, body: { error: "Usuario no encontrado" } };

  const valid = await bcrypt.compare(parsed.data.currentPassword, owner.passwordHash);
  if (!valid) {
    return { status: 400, body: { error: { formErrors: [], fieldErrors: { currentPassword: ["La contraseña actual no es correcta"] } } } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_COST);
  await updateOwnerPassword(owner.id, passwordHash);
  return { status: 200, body: { ok: true } };
}
