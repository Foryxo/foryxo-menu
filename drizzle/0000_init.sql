CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"type" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"active_context" text DEFAULT 'business' NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone" text,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"locale" text DEFAULT 'fa' NOT NULL,
	"role" text DEFAULT 'business' NOT NULL,
	"totp_secret" text,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"purpose" text DEFAULT 'otp' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"address" text,
	"city" text,
	"province" text,
	"country" text DEFAULT 'IR',
	"phone" text,
	"latitude" text,
	"longitude" text,
	"map_url" text,
	"timezone" text DEFAULT 'Asia/Tehran' NOT NULL,
	"opening_hours" jsonb,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_members" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_settings" (
	"business_id" text PRIMARY KEY NOT NULL,
	"locale" text DEFAULT 'fa' NOT NULL,
	"social" jsonb,
	"reservation_url" text,
	"description" text,
	"description_en" text,
	"serves_cuisine" text,
	"price_range" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"slug" text NOT NULL,
	"business_type" text NOT NULL,
	"status" text DEFAULT 'prospect' NOT NULL,
	"timezone" text DEFAULT 'Asia/Tehran' NOT NULL,
	"currency" text DEFAULT 'IRT' NOT NULL,
	"logo_media_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_checklist" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"step" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "project_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_files" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"media_id" text NOT NULL,
	"kind" text NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"note" text,
	"actor_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"demo_id" text,
	"configuration" jsonb NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"revision_rounds_included" integer DEFAULT 2 NOT NULL,
	"revision_rounds_used" integer DEFAULT 0 NOT NULL,
	"menu_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"timezone" text DEFAULT 'Asia/Tehran' NOT NULL,
	"days_of_week" jsonb,
	"start_time" text,
	"end_time" text,
	"start_date" text,
	"end_date" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"version_id" text NOT NULL,
	"slug" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"is_featured_section" boolean DEFAULT false NOT NULL,
	"daypart_start" text,
	"daypart_end" text,
	"icon" text
);
--> statement-breakpoint
CREATE TABLE "category_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"code" text,
	"kind" text NOT NULL,
	"value" integer NOT NULL,
	"product_id" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_domains" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"domain" text NOT NULL,
	"verification_token" text NOT NULL,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"ssl_status" text DEFAULT 'pending' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_locales" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"locale" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_themes" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"tokens" jsonb NOT NULL,
	"font_family" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"version" integer NOT NULL,
	"label" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"read_model" jsonb,
	"content_hash" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"branch_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"title_en" text,
	"description" text,
	"description_en" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_version_id" text,
	"draft_version_id" text,
	"locales" jsonb NOT NULL,
	"theme_id" text,
	"indexable" boolean DEFAULT false NOT NULL,
	"color_mode" text DEFAULT 'system' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modifier_group_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "modifier_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"version_id" text NOT NULL,
	"slug" text NOT NULL,
	"min_select" integer DEFAULT 0 NOT NULL,
	"max_select" integer DEFAULT 1 NOT NULL,
	"allow_repeat" boolean DEFAULT false NOT NULL,
	"display_style" text DEFAULT 'radio' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modifier_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"modifier_id" text NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modifiers" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"price_delta" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"nested_group_slug" text
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"media_id" text NOT NULL,
	"alt" text,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_modifier_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"group_id" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"version_id" text NOT NULL,
	"category_id" text NOT NULL,
	"slug" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"price" integer NOT NULL,
	"price_old" integer,
	"currency" text DEFAULT 'IRT' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_sold_out" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"allows_custom_request" boolean DEFAULT false NOT NULL,
	"badges" jsonb,
	"nutrition" jsonb,
	"allergens" jsonb,
	"dietary" jsonb,
	"prep_minutes" integer,
	"image_media_id" text,
	"image_prompt" text,
	"search_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"table_id" text,
	"target_url" text NOT NULL,
	"source_id" text NOT NULL,
	"scan_count" integer DEFAULT 0 NOT NULL,
	"design" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"label" text NOT NULL,
	"public_token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text NOT NULL,
	"anon_id" text,
	"user_id" text,
	"table_token" text,
	"items" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text,
	"menu_id" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text,
	"name_snapshot" text NOT NULL,
	"unit_price_snapshot" integer NOT NULL,
	"modifiers_snapshot" jsonb,
	"quantity" integer NOT NULL,
	"line_total" integer NOT NULL,
	"note" text,
	"custom_request_note" text
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_user_id" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"menu_id" text NOT NULL,
	"branch_id" text,
	"table_token" text,
	"consumer_user_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"order_type" text DEFAULT 'dine_in' NOT NULL,
	"customer_name" text,
	"customer_phone" text,
	"subtotal" integer NOT NULL,
	"discount_total" integer DEFAULT 0 NOT NULL,
	"service_fee" integer DEFAULT 0 NOT NULL,
	"tax_total" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"currency" text DEFAULT 'IRT' NOT NULL,
	"note" text,
	"payment_method" text,
	"payment_status" text,
	"source_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waiter_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"table_token" text NOT NULL,
	"request_type" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "credit_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"currency" text DEFAULT 'IRT' NOT NULL,
	"balance_cached" integer DEFAULT 0 NOT NULL,
	"holds_cached" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"business_id" text NOT NULL,
	"quote_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"currency" text DEFAULT 'IRT' NOT NULL,
	"subtotal" integer NOT NULL,
	"discount_total" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"paid_total" integer DEFAULT 0 NOT NULL,
	"due_date" timestamp with time zone,
	"issued_at" timestamp with time zone,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'IRT' NOT NULL,
	"direction" text NOT NULL,
	"category" text NOT NULL,
	"reference_type" text,
	"reference_id" text,
	"description" text,
	"created_by" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"invoice_id" text,
	"provider" text NOT NULL,
	"provider_ref" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'IRT' NOT NULL,
	"status" text DEFAULT 'initiated' NOT NULL,
	"purpose" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"callback_url" text,
	"verified_at" timestamp with time zone,
	"failure_reason" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"category" text NOT NULL,
	"internal_label" text NOT NULL,
	"customer_label_fa" text NOT NULL,
	"customer_label_en" text NOT NULL,
	"unit" text DEFAULT 'fixed' NOT NULL,
	"min_price" integer,
	"default_price" integer NOT NULL,
	"max_price" integer,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_period" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"kind" text NOT NULL,
	"value" integer NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"catalog_key" text,
	"label_fa" text NOT NULL,
	"label_en" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"line_total" integer NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"taxable" boolean DEFAULT false NOT NULL,
	"is_complimentary" boolean DEFAULT false NOT NULL,
	"notes" text,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"business_id" text NOT NULL,
	"project_id" text,
	"service_request_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"currency" text DEFAULT 'IRT' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"discount_total" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"valid_until" timestamp with time zone,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"payment_id" text,
	"ledger_entry_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'IRT' NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"rejection_reason" text,
	"requested_by" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'IRT' NOT NULL,
	"destination" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"rejection_reason" text,
	"requested_by" text,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_id" text,
	"business_id" text,
	"type" text NOT NULL,
	"locale" text,
	"device" text,
	"source_id" text,
	"value" text,
	"session_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"actor_role" text,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"business_id" text,
	"previous" jsonb,
	"next" jsonb,
	"correlation_id" text,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_fa" text NOT NULL,
	"name_en" text NOT NULL,
	CONSTRAINT "blog_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"author" text NOT NULL,
	"reviewed_by" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"category" text,
	"tags" jsonb,
	"hero_media_id" text,
	"seo_title" text,
	"seo_description" text,
	"canonical_url" text,
	"sources" jsonb,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "blog_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_fa" text NOT NULL,
	"name_en" text NOT NULL,
	CONSTRAINT "blog_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "builder_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"anon_id" text,
	"user_id" text,
	"step" integer DEFAULT 1 NOT NULL,
	"config" jsonb NOT NULL,
	"estimate" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_failures" (
	"id" text PRIMARY KEY NOT NULL,
	"queue" text NOT NULL,
	"job_id" text,
	"payload" jsonb,
	"error" text,
	"attempts" integer DEFAULT 1 NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text,
	"uploaded_by" text,
	"kind" text NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"hash" text NOT NULL,
	"storage_key" text NOT NULL,
	"variants" jsonb,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"scenario" text NOT NULL,
	"locale" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"variables" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"in_app" boolean DEFAULT true NOT NULL,
	"email" boolean DEFAULT true NOT NULL,
	"sms" boolean DEFAULT false NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"title_fa" text NOT NULL,
	"title_en" text NOT NULL,
	"body_fa" text,
	"body_en" text,
	"link" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'IRT' NOT NULL,
	"scope" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"quote_id" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_request_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"project_id" text,
	"menu_id" text,
	"number" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"urgency" text DEFAULT 'normal' NOT NULL,
	"preferred_date" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_events" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklist" ADD CONSTRAINT "onboarding_checklist_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_version_id_menu_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."menu_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_domains" ADD CONSTRAINT "menu_domains_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_locales" ADD CONSTRAINT "menu_locales_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_versions" ADD CONSTRAINT "menu_versions_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_group_translations" ADD CONSTRAINT "modifier_group_translations_group_id_modifier_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."modifier_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_version_id_menu_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."menu_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_translations" ADD CONSTRAINT "modifier_translations_modifier_id_modifiers_id_fk" FOREIGN KEY ("modifier_id") REFERENCES "public"."modifiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_group_id_modifier_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."modifier_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_group_id_modifier_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."modifier_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_version_id_menu_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."menu_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_consumer_user_id_user_id_fk" FOREIGN KEY ("consumer_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiter_calls" ADD CONSTRAINT "waiter_calls_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_credit_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."credit_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_quotes" ADD CONSTRAINT "service_quotes_request_id_service_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_request_messages" ADD CONSTRAINT "service_request_messages_request_id_service_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_uq" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sec_events_user_idx" ON "security_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sec_events_created_idx" ON "security_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sec_events_type_idx" ON "security_events" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_uq" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_uq" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_phone_idx" ON "user" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_expires_idx" ON "verification" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "branch_biz_slug_uq" ON "branches" USING btree ("business_id","slug");--> statement-breakpoint
CREATE INDEX "branch_biz_idx" ON "branches" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "biz_member_uq" ON "business_members" USING btree ("business_id","user_id");--> statement-breakpoint
CREATE INDEX "biz_member_user_idx" ON "business_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "business_slug_uq" ON "businesses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "business_owner_idx" ON "businesses" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "business_status_idx" ON "businesses" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "checklist_uq" ON "onboarding_checklist" USING btree ("business_id","step");--> statement-breakpoint
CREATE INDEX "proj_comment_project_idx" ON "project_comments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "proj_file_project_idx" ON "project_files" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "proj_hist_project_idx" ON "project_status_history" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_biz_idx" ON "projects" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "project_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "avail_target_idx" ON "availability_rules" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "category_version_slug_uq" ON "categories" USING btree ("version_id","slug");--> statement-breakpoint
CREATE INDEX "category_version_sort_idx" ON "categories" USING btree ("version_id","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "cat_tr_uq" ON "category_translations" USING btree ("category_id","locale");--> statement-breakpoint
CREATE INDEX "discount_menu_idx" ON "discounts" USING btree ("menu_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_domain_uq" ON "menu_domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "menu_domain_menu_idx" ON "menu_domains" USING btree ("menu_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_locale_uq" ON "menu_locales" USING btree ("menu_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_version_uq" ON "menu_versions" USING btree ("menu_id","version");--> statement-breakpoint
CREATE INDEX "menu_version_status_idx" ON "menu_versions" USING btree ("menu_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_slug_uq" ON "menus" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "menu_biz_idx" ON "menus" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "menu_status_idx" ON "menus" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "mod_group_tr_uq" ON "modifier_group_translations" USING btree ("group_id","locale");--> statement-breakpoint
CREATE INDEX "mod_group_version_idx" ON "modifier_groups" USING btree ("version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "modifier_tr_uq" ON "modifier_translations" USING btree ("modifier_id","locale");--> statement-breakpoint
CREATE INDEX "modifier_group_idx" ON "modifiers" USING btree ("group_id","sort");--> statement-breakpoint
CREATE INDEX "product_img_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pmg_uq" ON "product_modifier_groups" USING btree ("product_id","group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_tr_uq" ON "product_translations" USING btree ("product_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "product_version_slug_uq" ON "products" USING btree ("version_id","slug");--> statement-breakpoint
CREATE INDEX "product_version_cat_idx" ON "products" USING btree ("version_id","category_id","sort");--> statement-breakpoint
CREATE INDEX "product_menu_idx" ON "products" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "product_search_idx" ON "products" USING btree ("search_text");--> statement-breakpoint
CREATE UNIQUE INDEX "qr_source_uq" ON "qr_codes" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "qr_menu_idx" ON "qr_codes" USING btree ("menu_id");--> statement-breakpoint
CREATE UNIQUE INDEX "table_token_uq" ON "tables" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "table_branch_idx" ON "tables" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "cart_menu_idx" ON "carts" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "cart_anon_idx" ON "carts" USING btree ("anon_id");--> statement-breakpoint
CREATE INDEX "fav_user_idx" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fav_menu_idx" ON "favorites" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "order_item_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_hist_order_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_biz_created_idx" ON "orders" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_menu_idx" ON "orders" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "waiter_biz_idx" ON "waiter_calls" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "waiter_table_idx" ON "waiter_calls" USING btree ("table_token");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_account_biz_uq" ON "credit_accounts" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_number_uq" ON "invoices" USING btree ("number");--> statement-breakpoint
CREATE INDEX "invoice_biz_idx" ON "invoices" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_idem_uq" ON "ledger_entries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "ledger_account_created_idx" ON "ledger_entries" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "ledger_reference_idx" ON "ledger_entries" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "pay_event_payment_idx" ON "payment_events" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_idem_uq" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payment_biz_idx" ON "payments" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_provider_ref_idx" ON "payments" USING btree ("provider_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "price_key_uq" ON "price_catalog" USING btree ("key");--> statement-breakpoint
CREATE INDEX "price_cat_idx" ON "price_catalog" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_code_uq" ON "promo_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "quote_item_quote_idx" ON "quote_items" USING btree ("quote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quote_number_uq" ON "quotes" USING btree ("number");--> statement-breakpoint
CREATE INDEX "quote_biz_idx" ON "quotes" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "quote_status_idx" ON "quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "refund_biz_idx" ON "refunds" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "refund_status_idx" ON "refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "withdrawal_biz_idx" ON "withdrawal_requests" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "withdrawal_status_idx" ON "withdrawal_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "analytics_menu_type_idx" ON "analytics_events" USING btree ("menu_id","type");--> statement-breakpoint
CREATE INDEX "analytics_biz_created_idx" ON "analytics_events" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_business_idx" ON "audit_logs" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_locale_slug_uq" ON "blog_posts" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "blog_status_idx" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_published_idx" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "builder_anon_idx" ON "builder_drafts" USING btree ("anon_id");--> statement-breakpoint
CREATE INDEX "builder_user_idx" ON "builder_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "job_fail_queue_idx" ON "job_failures" USING btree ("queue");--> statement-breakpoint
CREATE INDEX "job_fail_created_idx" ON "job_failures" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "media_biz_idx" ON "media" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "media_hash_idx" ON "media" USING btree ("hash");--> statement-breakpoint
CREATE UNIQUE INDEX "tpl_key_locale_uq" ON "message_templates" USING btree ("key","locale");--> statement-breakpoint
CREATE INDEX "notif_user_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "sr_msg_request_idx" ON "service_request_messages" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sr_number_uq" ON "service_requests" USING btree ("number");--> statement-breakpoint
CREATE INDEX "sr_biz_idx" ON "service_requests" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "sr_status_idx" ON "service_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sys_event_kind_idx" ON "system_events" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "sys_event_created_idx" ON "system_events" USING btree ("created_at");