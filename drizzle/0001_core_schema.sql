-- Core PostgreSQL schema baseline for a NEW, empty database.
-- Existing shared databases must be inventoried and explicitly baselined before
-- this migration is recorded or applied. Do not use IF NOT EXISTS as a substitute
-- for comparing the existing schema with src/db/schema.ts.
DO $$ BEGIN
  CREATE TYPE "public"."user_role" AS ENUM('admin', 'technical', 'sales');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."ticket_status" AS ENUM('new', 'assigned', 'in_progress', 'waiting_parts', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(160) NOT NULL,
  "email" varchar(254) NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "role" "user_role" DEFAULT 'sales' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "machines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "serial_no" varchar(100) NOT NULL UNIQUE,
  "internal_code" varchar(100) NOT NULL UNIQUE,
  "model" varchar(160) NOT NULL,
  "customer_name" varchar(200) NOT NULL,
  "location" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "machine_id" uuid NOT NULL REFERENCES "machines"("id"),
  "issue_detail" text NOT NULL,
  "status" "ticket_status" DEFAULT 'new' NOT NULL,
  "assigned_to" uuid REFERENCES "users"("id"),
  "created_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
