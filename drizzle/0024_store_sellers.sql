ALTER TABLE "direct_sales" ADD COLUMN "seller_id" integer;--> statement-breakpoint
ALTER TABLE "direct_sales" ADD COLUMN "commission_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "inventory_mode" varchar(15) DEFAULT 'consignment' NOT NULL;--> statement-breakpoint
ALTER TABLE "direct_sales" ADD CONSTRAINT "direct_sales_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_inventory_mode_valid" CHECK ("sellers"."inventory_mode" IN ('consignment', 'store'));