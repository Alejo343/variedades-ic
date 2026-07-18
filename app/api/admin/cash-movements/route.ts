import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCashMovement } from "@/lib/db/queries/cash";
import { cashMovementSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = cashMovementSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [movement] = await createCashMovement(parsed.data);
  return NextResponse.json(movement, { status: 201 });
}
