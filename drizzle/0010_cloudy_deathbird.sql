CREATE TABLE "purchase_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"method" varchar(30),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_payment_amount_positive" CHECK ("purchase_payments"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "purchase_type" varchar(10) DEFAULT 'contado' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;