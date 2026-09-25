ALTER TABLE "cash_movements" ALTER COLUMN "account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "direct_sales" ALTER COLUMN "account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_payments" ALTER COLUMN "account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "direct_sales" DROP COLUMN "payment_method";--> statement-breakpoint
ALTER TABLE "purchase_payments" DROP COLUMN "method";