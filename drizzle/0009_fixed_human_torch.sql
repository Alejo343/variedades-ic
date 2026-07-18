CREATE TABLE "settlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"period_date" date NOT NULL,
	"total_sales" integer NOT NULL,
	"total_commission" integer NOT NULL,
	"total_losses" integer NOT NULL,
	"amount_due" integer NOT NULL,
	"status" varchar(15) DEFAULT 'pendiente' NOT NULL,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settlements_seller_period_unique" UNIQUE("seller_id","period_date")
);
--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_sales" ADD CONSTRAINT "seller_sales_settlement_id_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements"("id") ON DELETE no action ON UPDATE no action;