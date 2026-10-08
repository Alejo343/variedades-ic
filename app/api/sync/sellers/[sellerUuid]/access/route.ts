import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sellers } from "@/lib/db/schema";
import { getUserBySellerId } from "@/lib/db/queries/users";
import { createSellerAccess, updateSellerAccess } from "@/lib/sellers/access";
import { authenticateDevice, unauthorizedDevice } from "@/lib/sync/auth";

type Ctx = { params: Promise<{ sellerUuid: string }> };

// The owner managing a seller's app login from the phone. Online only (it
// sets a password, which never lives on a phone), owner only. The seller is
// named by uuid — local ids are per device.
async function resolve(req: Request, ctx: Ctx): Promise<{ sellerId: number } | NextResponse> {
  const principal = await authenticateDevice(req);
  if (!principal) return unauthorizedDevice();
  if (principal.role !== "owner") return NextResponse.json({ error: "Solo el dueño puede gestionar accesos" }, { status: 403 });

  const { sellerUuid } = await ctx.params;
  const [seller] = await db.select({ id: sellers.id }).from(sellers).where(eq(sellers.uuid, sellerUuid)).limit(1).catch(() => []);
  if (!seller) {
    return NextResponse.json({ error: "El vendedor todavía no está en el servidor. Sincroniza y vuelve a intentar." }, { status: 404 });
  }
  return { sellerId: seller.id };
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const r = await resolve(req, ctx);
  if (r instanceof NextResponse) return r;
  const [user] = await getUserBySellerId(r.sellerId);
  return NextResponse.json({ user: user ? { username: user.username, active: user.active } : null });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const r = await resolve(req, ctx);
  if (r instanceof NextResponse) return r;
  const result = await createSellerAccess(r.sellerId, await req.json());
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const r = await resolve(req, ctx);
  if (r instanceof NextResponse) return r;
  const result = await updateSellerAccess(r.sellerId, await req.json());
  return NextResponse.json(result.body, { status: result.status });
}
