CREATE TABLE "seller_loss_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"loss_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer,
	"quantity" integer NOT NULL,
	"type" varchar(10) NOT NULL,
	"unit_cost" integer NOT NULL,
	CONSTRAINT "loss_quantity_positive" CHECK ("seller_loss_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "seller_losses" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"loss_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_return_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer,
	"quantity" integer NOT NULL,
	CONSTRAINT "return_quantity_positive" CHECK ("seller_return_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "seller_returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"return_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seller_loss_items" ADD CONSTRAINT "seller_loss_items_loss_id_seller_losses_id_fk" FOREIGN KEY ("loss_id") REFERENCES "public"."seller_losses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_loss_items" ADD CONSTRAINT "seller_loss_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_losses" ADD CONSTRAINT "seller_losses_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_return_items" ADD CONSTRAINT "seller_return_items_return_id_seller_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."seller_returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_return_items" ADD CONSTRAINT "seller_return_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_returns" ADD CONSTRAINT "seller_returns_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;