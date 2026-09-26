CREATE SEQUENCE "public"."sync_version_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "sync_tombstones" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" varchar(50) NOT NULL,
	"uuid" uuid NOT NULL,
	"sync_version" bigint NOT NULL,
	"deleted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_accounts" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cash_movements" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "direct_sale_items" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "direct_sales" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "distributors" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_deliveries" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_delivery_items" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_loss_items" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_losses" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_return_items" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_returns" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_sale_items" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_sales" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "sync_tombstones_version_idx" ON "sync_tombstones" USING btree ("sync_version");--> statement-breakpoint
-- Hand-added (mobile sync, sub-paso 2). Every insert/update of a synced table
-- gets the next sync_version; the advisory lock (a fixed key, only used here)
-- is taken BEFORE nextval and held until commit, so writers are serialized and
-- versions become visible in increasing order — a pull cursor can never skip a
-- row that commits late with a smaller version. Deletes leave a tombstone.
-- A new synced table must be added to the array below (and TRUNCATE bypasses
-- the tombstone trigger — don't use it on synced tables).
CREATE FUNCTION sync_bump_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(7390001);
  NEW.sync_version := nextval('sync_version_seq');
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE FUNCTION sync_record_tombstone() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(7390001);
  INSERT INTO sync_tombstones (table_name, uuid, sync_version)
    VALUES (TG_TABLE_NAME, OLD.uuid, nextval('sync_version_seq'));
  RETURN OLD;
END
$$;
--> statement-breakpoint
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cash_accounts','cash_movements','categories','direct_sale_items','direct_sales','distributors','inventory_movements','product_images','products','purchase_order_items','purchase_orders','purchase_payments','seller_deliveries','seller_delivery_items','seller_loss_items','seller_losses','seller_return_items','seller_returns','seller_sale_items','seller_sales','sellers','settlements'] LOOP
    EXECUTE format('CREATE TRIGGER sync_bump_version BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION sync_bump_version()', t);
    EXECUTE format('CREATE TRIGGER sync_record_tombstone AFTER DELETE ON %I FOR EACH ROW EXECUTE FUNCTION sync_record_tombstone()', t);
    -- Backfill: the no-op update fires the trigger, stamping existing rows.
    EXECUTE format('UPDATE %I SET sync_version = 0', t);
  END LOOP;
END
$$;
