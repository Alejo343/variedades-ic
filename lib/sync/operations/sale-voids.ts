import { z } from "zod";
import { SaleVoidError, voidDirectSale as voidDirect, voidSellerSale as voidSeller, type VoidSaleInput } from "@/lib/db/queries/sale-voids";
import { defineHandler, SyncRejection, type Tx } from "../push";
import { rowUuid, utcTimestamp } from "./shared";

// Voiding a sale from the owner's phone (owner only: not in
// SELLER_OPERATIONS). The phone sends one movement uuid per item of the sale
// — the rows it already wrote locally — and the server writes the same ones.

const schema = z.object({
  saleUuid: rowUuid,
  voidedAt: utcTimestamp,
  reason: z.string().max(2000).nullish(),
  items: z.array(z.object({ itemUuid: rowUuid, movementUuid: rowUuid })).min(1),
});

async function run(void_: (tx: Tx, input: VoidSaleInput) => Promise<unknown>, tx: Tx, p: z.infer<typeof schema>) {
  const byItem = new Map(p.items.map((i) => [i.itemUuid, i.movementUuid]));
  try {
    await void_(tx, { saleUuid: p.saleUuid, voidedAt: p.voidedAt, reason: p.reason, movementUuidFor: (uuid) => byItem.get(uuid) });
  } catch (e) {
    if (e instanceof SaleVoidError) throw new SyncRejection(e.message);
    throw e;
  }
}

export const voidDirectSale = defineHandler({ schema, apply: (tx, p) => run(voidDirect, tx, p) });
export const voidSellerSale = defineHandler({ schema, apply: (tx, p) => run(voidSeller, tx, p) });
