import { eq } from "drizzle-orm";
import type { z } from "zod";
import type { db as appDb } from "@/lib/db";
import { syncAppliedOperations } from "@/lib/db/schema";
import { authorizeOperation } from "@/lib/domain/sync-permissions";
import type { UserRole } from "@/lib/domain/users";

// POST /api/sync/push (sub-paso 7 of the mobile sync, see variedades-ic-mobile's
// CLAUDE.md, "Fase 10"): applies the operations a phone recorded offline, in
// the order it sends them.
//
// Contract:
// - Each operation runs in its own transaction; a rejected one doesn't undo
//   the ones before it.
// - Idempotent by operation id (generated on the phone): an operation already
//   applied or rejected returns its first result with `duplicate: true` and
//   is never applied twice (sync_applied_operations; concurrent retries wait
//   on its primary key).
// - `rejected` = permanent business error (unknown/forbidden type, invalid
//   payload, SyncRejection from a handler, data/integrity violation in
//   Postgres): recorded, and the phone shows it. `error` = anything else
//   (bug, database down): NOT recorded, and the rest of the batch is
//   `skipped`, since later operations may depend on it — the phone retries.

export type Database = typeof appDb;
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type PushPrincipal = {
  role: UserRole;
  userId: number;
  sessionId: number;
  sellerId: number | null;
  sellerUuid: string | null;
};

export type PushOperation = { id: string; type: string; payload: unknown };
export type PushResult = {
  id: string;
  status: "applied" | "rejected" | "error" | "skipped";
  error?: string;
  duplicate?: true;
};

// Thrown by handlers for a permanent, user-facing business error.
export class SyncRejection extends Error {}

export type OperationHandler<S extends z.ZodType = z.ZodType> = {
  schema: S;
  // For seller operations: which seller the payload is about (must be the
  // pushing seller's own uuid).
  sellerUuid?: (payload: z.infer<S>) => string | undefined;
  apply: (tx: Tx, payload: z.infer<S>, ctx: { principal: PushPrincipal }) => Promise<void>;
};
export type OperationHandlers = Partial<Record<string, OperationHandler>>;

// Keeps each handler's payload typed from its own schema.
export function defineHandler<S extends z.ZodType>(handler: OperationHandler<S>): OperationHandler {
  return handler as unknown as OperationHandler;
}

class AlreadyRecorded extends Error {}

// Postgres data exceptions (22xxx) and integrity violations (23xxx) are the
// operation's fault, not the server's — permanent rejections.
function postgresRejection(e: unknown): string | null {
  const err = e as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } };
  const code = err.cause?.code ?? err.code;
  const constraint = err.cause?.constraint ?? err.constraint;
  if (!code) return null;
  if (code === "23505") return `Ya existe un registro con esos datos (${constraint})`;
  if (code === "23503") return `Hace referencia a un registro que no existe (${constraint})`;
  if (code === "23514") return `Datos no válidos (${constraint})`;
  if (code === "23502") return "Falta un dato obligatorio";
  if (code.startsWith("23")) return `Datos no válidos (${constraint ?? code})`;
  if (code.startsWith("22")) return "Un dato tiene formato inválido";
  return null;
}

function rejectionMessage(e: unknown): string | null {
  if (e instanceof SyncRejection) return e.message;
  return postgresRejection(e);
}

async function recordedResult(database: Database, opId: string): Promise<PushResult | null> {
  const [prev] = await database
    .select({ status: syncAppliedOperations.status, error: syncAppliedOperations.error })
    .from(syncAppliedOperations)
    .where(eq(syncAppliedOperations.opId, opId))
    .limit(1);
  if (!prev) return null;
  return { id: opId, status: prev.status as "applied" | "rejected", ...(prev.error ? { error: prev.error } : {}), duplicate: true };
}

async function applyOne(database: Database, principal: PushPrincipal, op: PushOperation, handlers: OperationHandlers) {
  await database.transaction(async (tx) => {
    // Claim the id first: a concurrent retry of the same operation blocks here
    // until this transaction ends, then finds it recorded.
    const claimed = await tx
      .insert(syncAppliedOperations)
      .values({ opId: op.id, deviceSessionId: principal.sessionId, userId: principal.userId, type: op.type, status: "applied" })
      .onConflictDoNothing()
      .returning({ opId: syncAppliedOperations.opId });
    if (!claimed.length) throw new AlreadyRecorded();

    const byType = authorizeOperation(principal, { type: op.type, sellerUuid: principal.sellerUuid ?? undefined });
    if (!byType.ok) throw new SyncRejection(byType.reason);

    const handler = handlers[op.type];
    if (!handler) throw new SyncRejection(`La operación ${op.type} todavía no está disponible en el servidor`);

    const parsed = handler.schema.safeParse(op.payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new SyncRejection(`Datos inválidos${issue?.path.length ? ` en ${issue.path.join(".")}` : ""}: ${issue?.message}`);
    }

    if (principal.role === "seller") {
      const own = authorizeOperation(principal, { type: op.type, sellerUuid: handler.sellerUuid?.(parsed.data) });
      if (!own.ok) throw new SyncRejection(own.reason);
    }

    await handler.apply(tx, parsed.data, { principal });
  });
}

export async function applyOperations(
  database: Database,
  principal: PushPrincipal,
  operations: PushOperation[],
  handlers: OperationHandlers,
): Promise<PushResult[]> {
  const results: PushResult[] = [];

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];

    const prev = await recordedResult(database, op.id);
    if (prev) {
      results.push(prev);
      continue;
    }

    try {
      await applyOne(database, principal, op, handlers);
      results.push({ id: op.id, status: "applied" });
    } catch (e) {
      if (e instanceof AlreadyRecorded) {
        results.push((await recordedResult(database, op.id))!);
        continue;
      }
      const reason = rejectionMessage(e);
      if (reason !== null) {
        await database
          .insert(syncAppliedOperations)
          .values({ opId: op.id, deviceSessionId: principal.sessionId, userId: principal.userId, type: op.type, status: "rejected", error: reason })
          .onConflictDoNothing();
        results.push({ id: op.id, status: "rejected", error: reason });
        continue;
      }
      console.error(`[sync/push] ${op.type} ${op.id} falló de forma inesperada`, e);
      results.push({ id: op.id, status: "error", error: "Error inesperado del servidor; se reintentará" });
      for (const rest of operations.slice(i + 1)) results.push({ id: rest.id, status: "skipped" });
      break;
    }
  }

  return results;
}
