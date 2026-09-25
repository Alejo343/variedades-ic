import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllCashAccounts, createCashAccount } from "@/lib/db/queries/cash-accounts";
import { cashAccountSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const data = await getAllCashAccounts();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = cashAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [account] = await createCashAccount(parsed.data);
  return NextResponse.json(account, { status: 201 });
}
