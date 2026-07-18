CREATE TABLE "cash_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(10) NOT NULL,
	"amount" integer NOT NULL,
	"concept" varchar(200) NOT NULL,
	"movement_date" timestamp DEFAULT now() NOT NULL,
	"source_type" varchar(30),
	"source_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "amount_positive" CHECK ("cash_movements"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "direct_sale_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"subtotal" integer NOT NULL,
	CONSTRAINT "quantity_positive" CHECK ("direct_sale_items"."quantity" > 0),
	CONSTRAINT "unit_price_not_negative" CHECK ("direct_sale_items"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "direct_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_date" timestamp DEFAULT now() NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"phone" varchar(50),
	"city" varchar(100),
	"commission_type" varchar(15) NOT NULL,
	"commission_value" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "direct_sale_items" ADD CONSTRAINT "direct_sale_items_sale_id_direct_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."direct_sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_sale_items" ADD CONSTRAINT "direct_sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;