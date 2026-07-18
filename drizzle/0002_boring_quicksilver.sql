CREATE TABLE "inventory_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer,
	"owner_type" varchar(10) NOT NULL,
	"seller_id" integer,
	"type" varchar(20) NOT NULL,
	"quantity_delta" integer NOT NULL,
	"unit_cost" integer,
	"reason" text,
	"source_type" varchar(30),
	"source_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quantity_delta_not_zero" CHECK ("inventory_movements"."quantity_delta" <> 0)
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "purchase_price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "min_stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "warranty_months" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "has_variants" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;