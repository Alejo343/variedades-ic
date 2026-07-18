CREATE TABLE "seller_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"delivery_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_delivery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"delivery_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer,
	"quantity" integer NOT NULL,
	"unit_cost" integer,
	CONSTRAINT "delivery_quantity_positive" CHECK ("seller_delivery_items"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "seller_deliveries" ADD CONSTRAINT "seller_deliveries_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_delivery_items" ADD CONSTRAINT "seller_delivery_items_delivery_id_seller_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."seller_deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_delivery_items" ADD CONSTRAINT "seller_delivery_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;