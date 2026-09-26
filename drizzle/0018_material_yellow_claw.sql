ALTER TABLE "seller_losses" ADD COLUMN "type" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_loss_items" DROP COLUMN "type";