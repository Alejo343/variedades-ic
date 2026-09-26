ALTER TABLE "seller_losses" ADD COLUMN "settlement_id" integer;--> statement-breakpoint
ALTER TABLE "seller_losses" ADD CONSTRAINT "seller_losses_settlement_id_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Hand-added backfill: losses already charged by an existing settlement (the
-- old rule: same seller, same day) get linked to it, so the new rule (every
-- pending loss up to the settlement date) never charges them again.
UPDATE "seller_losses" l SET "settlement_id" = s."id"
FROM "settlements" s
WHERE s."seller_id" = l."seller_id" AND DATE(l."loss_date") = s."period_date" AND l."settlement_id" IS NULL;
