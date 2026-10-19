CREATE TYPE "public"."marketing_campaign_status" AS ENUM('draft', 'planned', 'active', 'paused', 'completed');
--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('idea', 'draft', 'review', 'approved', 'scheduled', 'published', 'archived');
--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'qualified', 'contacted', 'quoted', 'won', 'lost', 'unsubscribed');

--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(180) NOT NULL,
  "objective" text,
  "channel" varchar(60) NOT NULL,
  "status" "marketing_campaign_status" DEFAULT 'draft' NOT NULL,
  "utm_source" varchar(120),
  "utm_medium" varchar(120),
  "utm_campaign" varchar(180),
  "owner_id" uuid REFERENCES "users"("id"),
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "content_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(220) NOT NULL,
  "channel" varchar(60) NOT NULL,
  "content_type" varchar(60) NOT NULL,
  "topic" text NOT NULL,
  "body" text,
  "call_to_action" text,
  "source_notes" text,
  "status" "content_status" DEFAULT 'idea' NOT NULL,
  "campaign_id" uuid REFERENCES "marketing_campaigns"("id"),
  "created_by" uuid REFERENCES "users"("id"),
  "approved_by" uuid REFERENCES "users"("id"),
  "scheduled_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(180) NOT NULL,
  "company" varchar(200),
  "email" varchar(254),
  "phone" varchar(40),
  "province" varchar(100),
  "product_interest" varchar(180),
  "requirement" text,
  "status" "lead_status" DEFAULT 'new' NOT NULL,
  "source" varchar(120),
  "medium" varchar(120),
  "campaign" varchar(180),
  "content" varchar(180),
  "term" varchar(180),
  "landing_page" text,
  "consent_to_contact" boolean DEFAULT false NOT NULL,
  "consent_purpose" varchar(160),
  "consent_policy_version" varchar(80),
  "consent_captured_at" timestamp with time zone,
  "consent_revoked_at" timestamp with time zone,
  "assigned_to" uuid REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX "leads_status_created_at_idx" ON "leads" ("status", "created_at");
--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" ("email");
--> statement-breakpoint
CREATE INDEX "leads_phone_idx" ON "leads" ("phone");
--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "marketing_campaigns" ("status");
--> statement-breakpoint
CREATE INDEX "content_status_schedule_idx" ON "content_items" ("status", "scheduled_at");

--> statement-breakpoint
CREATE TABLE "api_usage_daily" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" varchar(100) NOT NULL,
  "endpoint" varchar(220) NOT NULL,
  "usage_date" date NOT NULL,
  "request_count" integer DEFAULT 0 NOT NULL,
  "error_count" integer DEFAULT 0 NOT NULL,
  "quota_limit" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "api_usage_provider_endpoint_date_idx" ON "api_usage_daily" ("provider", "endpoint", "usage_date");
