CREATE TABLE "cash_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(15) DEFAULT 'efectivo' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "cash_accounts" ("id", "name", "type") VALUES (1, 'Efectivo', 'efectivo'), (2, 'Transferencia', 'banco');--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('"cash_accounts"', 'id'), 2, true);--> statement-breakpoint
ALTER TABLE "cash_movements" ADD COLUMN "account_id" integer;--> statement-breakpoint
ALTER TABLE "direct_sales" ADD COLUMN "account_id" integer;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD COLUMN "account_id" integer;--> statement-breakpoint
ALTER TABLE "seller_delivery_items" ADD COLUMN "unit_cost" integer;--> statement-breakpoint
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_account_id_cash_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."cash_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_sales" ADD CONSTRAINT "direct_sales_account_id_cash_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."cash_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_account_id_cash_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."cash_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Backfill: existing rows had no real account, map by best-effort guess from
-- the free-text field being replaced (cash_movements never had one, so it
-- always falls back to account 1 "Efectivo").
UPDATE "cash_movements" SET "account_id" = 1;--> statement-breakpoint
UPDATE "direct_sales" SET "account_id" = CASE WHEN "payment_method" ILIKE '%transfer%' THEN 2 ELSE 1 END;--> statement-breakpoint
UPDATE "purchase_payments" SET "account_id" = CASE WHEN "method" ILIKE '%transfer%' THEN 2 ELSE 1 END;