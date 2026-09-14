ALTER TABLE "orders" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "public_token" text;--> statement-breakpoint
UPDATE "orders" SET "public_token" = md5("id" || random()::text || clock_timestamp()::text) WHERE "public_token" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "public_token" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "order_idempotency_uq" ON "orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "order_public_token_uq" ON "orders" USING btree ("public_token");
