ALTER TABLE "products" ADD COLUMN "distributor_code" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_distributor_code_unique" UNIQUE("distributor_code");