CREATE TABLE "salary_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"sync_version" bigint DEFAULT 0 NOT NULL,
	"seller_id" integer NOT NULL,
	"period" varchar(10) NOT NULL,
	"period_start" date NOT NULL,
	"amount" integer NOT NULL,
	"account_id" integer NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "salary_payments_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "salary_payments_seller_period_unique" UNIQUE("seller_id","period","period_start"),
	CONSTRAINT "salary_payments_amount_positive" CHECK ("salary_payments"."amount" > 0),
	CONSTRAINT "salary_payments_period_valid" CHECK ("salary_payments"."period" IN ('weekly', 'monthly'))
);
--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "pay_type" varchar(15) DEFAULT 'commission' NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "salary_amount" integer;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "salary_period" varchar(10);--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "salary_start_date" date;--> statement-breakpoint
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_account_id_cash_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."cash_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_pay_type_valid" CHECK ("sellers"."pay_type" IN ('commission', 'salary'));--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_salary_period_valid" CHECK ("sellers"."salary_period" IS NULL OR "sellers"."salary_period" IN ('weekly', 'monthly'));--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_salary_complete" CHECK ("sellers"."pay_type" <> 'salary' OR ("sellers"."inventory_mode" = 'store' AND "sellers"."salary_amount" > 0 AND "sellers"."salary_period" IS NOT NULL AND "sellers"."salary_start_date" IS NOT NULL));--> statement-breakpoint
-- Hand-added: salary_payments syncs to the phones, so it gets the same
-- sync_version / tombstone triggers as the tables of 0020 (and 0025).
CREATE TRIGGER sync_bump_version BEFORE INSERT OR UPDATE ON "salary_payments" FOR EACH ROW EXECUTE FUNCTION sync_bump_version();--> statement-breakpoint
CREATE TRIGGER sync_record_tombstone AFTER DELETE ON "salary_payments" FOR EACH ROW EXECUTE FUNCTION sync_record_tombstone();
