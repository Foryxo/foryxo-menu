CREATE TABLE "managed_demos" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title_fa" text NOT NULL,
	"title_en" text NOT NULL,
	"description_fa" text NOT NULL,
	"description_en" text NOT NULL,
	"preview_image_url" text NOT NULL,
	"live_menu_url" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"sort" integer DEFAULT 100 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title_fa" text NOT NULL,
	"title_en" text NOT NULL,
	"summary_fa" text NOT NULL,
	"summary_en" text NOT NULL,
	"client_name" text,
	"service_fa" text,
	"service_en" text,
	"live_url" text NOT NULL,
	"cover_image_url" text,
	"menu_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 100 NOT NULL,
	"launched_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_quotes" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "service_request_messages" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "managed_demo_slug_uq" ON "managed_demos" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "managed_demo_status_idx" ON "managed_demos" USING btree ("status","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_project_slug_uq" ON "portfolio_projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "portfolio_project_status_idx" ON "portfolio_projects" USING btree ("status","sort");