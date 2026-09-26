import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { getSellerById } from "@/lib/db/queries/sellers";
import { createSellerUser, getUserBySellerId, getUserByUsername, updateSellerUser } from "@/lib/db/queries/users";
import { sellerUserCreateSchema, sellerUserUpdateSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

const BCRYPT_COST = 12;

// Creates the seller's app login (one per seller — the users table enforces it).
export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const sellerId = Number(id);
  const parsed = sellerUserCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [seller] = await getSellerById(sellerId);
  if (!seller) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const [existing] = await getUserBySellerId(sellerId);
  if (existing) return NextResponse.json({ error: "Este vendedor ya tiene usuario" }, { status: 409 });

  const [taken] = await getUserByUsername(parsed.data.username);
  if (taken) return NextResponse.json({ error: `El usuario "${parsed.data.username}" ya existe` }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);
  try {
    const [user] = await createSellerUser({ sellerId, name: seller.name, username: parsed.data.username, passwordHash });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    // Lost a race against another create: the UNIQUE constraints still hold.
    if ((e as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 });
    }
    throw e;
  }
}

// Changes the password and/or activates/deactivates the login. Deactivating
// cuts off sync on every phone of that seller (checked on each sync request).
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const parsed = sellerUserUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { password, active } = parsed.data;
  const passwordHash = password === undefined ? undefined : await bcrypt.hash(password, BCRYPT_COST);
  const [user] = await updateSellerUser(Number(id), { passwordHash, active });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(user);
}
