import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDevice, unauthorizedDevice } from "@/lib/sync/auth";
import { pullChanges } from "@/lib/sync/pull";

const PAGE_SIZE = 500;

// GET /api/sync/pull?since=<cursor> — see lib/sync/pull.ts for the contract.
// The phone starts with since=0 and keeps calling with the returned cursor
// while hasMore is true.
export async function GET(req: Request) {
  const principal = await authenticateDevice(req);
  if (!principal) return unauthorizedDevice();

  const raw = new URL(req.url).searchParams.get("since") ?? "0";
  const since = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(since)) {
    return NextResponse.json({ error: "since debe ser un entero >= 0" }, { status: 400 });
  }

  // One snapshot for every table (REPEATABLE READ) — required by pullChanges.
  const client = await db.$client.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const result = await pullChanges(client, { role: principal.role, sellerId: principal.sellerId }, since, PAGE_SIZE);
    await client.query("COMMIT");
    return NextResponse.json(result);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
