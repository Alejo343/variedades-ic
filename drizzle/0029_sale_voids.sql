ALTER TABLE "direct_sales" ADD COLUMN "voided_at" timestamp;--> statement-breakpoint
ALTER TABLE "direct_sales" ADD COLUMN "void_reason" text;--> statement-breakpoint
ALTER TABLE "seller_sales" ADD COLUMN "voided_at" timestamp;--> statement-breakpoint
ALTER TABLE "seller_sales" ADD COLUMN "void_reason" text;