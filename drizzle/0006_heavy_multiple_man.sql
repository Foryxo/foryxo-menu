ALTER TABLE "branches" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "accepts_orders" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "fulfillment_types" jsonb;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "minimum_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "order_contact_phone" text;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "notification_email" text;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "ordering_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "number" text;--> statement-breakpoint
UPDATE "orders" SET "number" = 'LEGACY-' || substring("id" from 1 for 12) WHERE "number" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_address" text;--> statement-breakpoint
CREATE UNIQUE INDEX "order_number_uq" ON "orders" USING btree ("number");
