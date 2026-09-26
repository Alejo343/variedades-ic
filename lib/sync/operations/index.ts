import type { OperationHandlers } from "../push";

// Registry of the operations the server knows how to apply (sub-paso 7).
// Filled in partes 2-3; a type in SYNC_OPERATION_TYPES without a handler here
// is rejected as "todavía no está disponible".
export const syncHandlers: OperationHandlers = {};
