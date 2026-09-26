ALTER TABLE "cash_accounts" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "cash_movements" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "direct_sale_items" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "direct_sales" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "distributors" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_deliveries" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_delivery_items" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_loss_items" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_losses" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_return_items" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_returns" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_sale_items" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_sales" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "cash_accounts" ADD CONSTRAINT "cash_accounts_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "direct_sale_items" ADD CONSTRAINT "direct_sale_items_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "direct_sales" ADD CONSTRAINT "direct_sales_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "distributors" ADD CONSTRAINT "distributors_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "seller_deliveries" ADD CONSTRAINT "seller_deliveries_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "seller_delivery_items" ADD CONSTRAINT "seller_delivery_items_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "seller_loss_items" ADD CONSTRAINT "seller_loss_items_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "seller_losses" ADD CONSTRAINT "seller_losses_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "seller_return_items" ADD CONSTRAINT "seller_return_items_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "seller_returns" ADD CONSTRAINT "seller_returns_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "seller_sale_items" ADD CONSTRAINT "seller_sale_items_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "seller_sales" ADD CONSTRAINT "seller_sales_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_uuid_unique" UNIQUE("uuid");