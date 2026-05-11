import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllDistributors, createDistributor } from "@/lib/db/queries/distributors";
import { distributorSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const data = await getAllDistributors();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = distributorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [distributor] = await createDistributor(parsed.data);
  return NextResponse.json(distributor, { status: 201 });
}
