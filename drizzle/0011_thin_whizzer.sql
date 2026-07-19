ALTER TABLE "direct_sale_items" DROP COLUMN "variant_id";--> statement-breakpoint
ALTER TABLE "inventory_movements" DROP COLUMN "variant_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "has_variants";--> statement-breakpoint
ALTER TABLE "seller_delivery_items" DROP COLUMN "variant_id";--> statement-breakpoint
ALTER TABLE "seller_loss_items" DROP COLUMN "variant_id";--> statement-breakpoint
ALTER TABLE "seller_return_items" DROP COLUMN "variant_id";--> statement-breakpoint
ALTER TABLE "seller_sale_items" DROP COLUMN "variant_id";