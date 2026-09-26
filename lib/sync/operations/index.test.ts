import { describe, expect, it } from "vitest";
import { SYNC_OPERATION_TYPES } from "@/lib/domain/sync-permissions";
import { syncHandlers } from ".";

// The push catalog (sync-permissions) and the handler registry must list the
// same operations: a type without a handler would be rejected on every push,
// and a handler without a type could never be authorized.
describe("registro de operaciones de push", () => {
  it("tiene exactamente un handler por cada tipo de operación", () => {
    expect(Object.keys(syncHandlers).sort()).toEqual([...SYNC_OPERATION_TYPES].sort());
  });
});
