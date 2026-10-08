CREATE TABLE "commission_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"sync_version" bigint DEFAULT 0 NOT NULL,
	"seller_id" integer NOT NULL,
	"period_date" date NOT NULL,
	"sale_count" integer NOT NULL,
	"total_commission" integer NOT NULL,
	"account_id" integer NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "commission_payments_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "commission_payments_total_positive" CHECK ("commission_payments"."total_commission" > 0)
);
--> statement-breakpoint
ALTER TABLE "direct_sales" ADD COLUMN "commission_payment_id" integer;--> statement-breakpoint
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_account_id_cash_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."cash_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_sales" ADD CONSTRAINT "direct_sales_commission_payment_id_commission_payments_id_fk" FOREIGN KEY ("commission_payment_id") REFERENCES "public"."commission_payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Hand-added: commission_payments syncs to the phones, so it gets the same
-- sync_version / tombstone triggers as the 22 tables of 0020.
CREATE TRIGGER sync_bump_version BEFORE INSERT OR UPDATE ON "commission_payments" FOR EACH ROW EXECUTE FUNCTION sync_bump_version();--> statement-breakpoint
CREATE TRIGGER sync_record_tombstone AFTER DELETE ON "commission_payments" FOR EACH ROW EXECUTE FUNCTION sync_record_tombstone();
