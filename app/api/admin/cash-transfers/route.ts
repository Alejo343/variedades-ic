import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCashTransfer } from "@/lib/db/queries/cash";
import { cashTransferSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = cashTransferSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const movements = await createCashTransfer(parsed.data);
    return NextResponse.json(movements, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo registrar la transferencia";
    return NextResponse.json({ error: { formErrors: [message] } }, { status: 400 });
  }
}
