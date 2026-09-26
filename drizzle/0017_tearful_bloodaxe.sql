-- Backfill: existing rows predate this column being required (seller_delivery_items
-- had no unit_cost column at all until it was restored on 2026-09-25); the UI already
-- always sends a real number (default 0) going forward, so 0 is a safe stand-in for
-- the handful of legacy rows that never got one.
UPDATE "purchase_order_items" SET "unit_cost" = 0 WHERE "unit_cost" IS NULL;--> statement-breakpoint
UPDATE "seller_delivery_items" SET "unit_cost" = 0 WHERE "unit_cost" IS NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ALTER COLUMN "unit_cost" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_delivery_items" ALTER COLUMN "unit_cost" SET NOT NULL;