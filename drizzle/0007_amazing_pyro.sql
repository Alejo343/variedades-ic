CREATE TABLE "seller_sale_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"subtotal" integer NOT NULL,
	CONSTRAINT "seller_sale_quantity_positive" CHECK ("seller_sale_items"."quantity" > 0),
	CONSTRAINT "seller_sale_unit_price_not_negative" CHECK ("seller_sale_items"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "seller_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"sale_date" timestamp DEFAULT now() NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"commission_amount" integer DEFAULT 0 NOT NULL,
	"settlement_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seller_sale_items" ADD CONSTRAINT "seller_sale_items_sale_id_seller_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."seller_sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_sale_items" ADD CONSTRAINT "seller_sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_sales" ADD CONSTRAINT "seller_sales_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;