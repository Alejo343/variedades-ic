ALTER TABLE "sellers" ALTER COLUMN "commission_type" SET DEFAULT 'percentage';--> statement-breakpoint
ALTER TABLE "sellers" ALTER COLUMN "commission_value" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "commission_bps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_commission_bps_valid" CHECK ("products"."commission_bps" BETWEEN 0 AND 10000);