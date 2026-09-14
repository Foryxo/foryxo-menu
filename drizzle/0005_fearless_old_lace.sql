ALTER TABLE "media" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "customer_notes" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "workflow_status" text DEFAULT 'received' NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "creator_notes" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "media_workflow_idx" ON "media" USING btree ("kind","workflow_status");