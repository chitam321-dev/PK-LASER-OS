import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "technical", "sales"]);
export const ticketStatus = pgEnum("ticket_status", [
  "new",
  "assigned",
  "in_progress",
  "waiting_parts",
  "resolved",
  "closed",
]);
export const marketingCampaignStatus = pgEnum("marketing_campaign_status", [
  "draft",
  "planned",
  "active",
  "paused",
  "completed",
]);
export const contentStatus = pgEnum("content_status", [
  "idea",
  "draft",
  "review",
  "approved",
  "scheduled",
  "published",
  "archived",
]);
export const leadStatus = pgEnum("lead_status", [
  "new",
  "qualified",
  "contacted",
  "quoted",
  "won",
  "lost",
  "unsubscribed",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("sales"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const machines = pgTable("machines", {
  id: uuid("id").defaultRandom().primaryKey(),
  serialNo: varchar("serial_no", { length: 100 }).notNull().unique(),
  internalCode: varchar("internal_code", { length: 100 }).notNull().unique(),
  model: varchar("model", { length: 160 }).notNull(),
  customerName: varchar("customer_name", { length: 200 }).notNull(),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const serviceTickets = pgTable("service_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  machineId: uuid("machine_id").references(() => machines.id).notNull(),
  issueDetail: text("issue_detail").notNull(),
  status: ticketStatus("status").notNull().default("new"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  objective: text("objective"),
  channel: varchar("channel", { length: 60 }).notNull(),
  status: marketingCampaignStatus("status").notNull().default("draft"),
  utmSource: varchar("utm_source", { length: 120 }),
  utmMedium: varchar("utm_medium", { length: 120 }),
  utmCampaign: varchar("utm_campaign", { length: 180 }),
  ownerId: uuid("owner_id").references(() => users.id),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const contentItems = pgTable("content_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  channel: varchar("channel", { length: 60 }).notNull(),
  contentType: varchar("content_type", { length: 60 }).notNull(),
  topic: text("topic").notNull(),
  body: text("body"),
  callToAction: text("call_to_action"),
  sourceNotes: text("source_notes"),
  status: contentStatus("status").notNull().default("idea"),
  campaignId: uuid("campaign_id").references(() => marketingCampaigns.id),
  createdBy: uuid("created_by").references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  company: varchar("company", { length: 200 }),
  email: varchar("email", { length: 254 }),
  phone: varchar("phone", { length: 40 }),
  province: varchar("province", { length: 100 }),
  productInterest: varchar("product_interest", { length: 180 }),
  requirement: text("requirement"),
  status: leadStatus("status").notNull().default("new"),
  source: varchar("source", { length: 120 }),
  medium: varchar("medium", { length: 120 }),
  campaign: varchar("campaign", { length: 180 }),
  content: varchar("content", { length: 180 }),
  term: varchar("term", { length: 180 }),
  landingPage: text("landing_page"),
  consentToContact: boolean("consent_to_contact").notNull().default(false),
  consentPurpose: varchar("consent_purpose", { length: 160 }),
  consentPolicyVersion: varchar("consent_policy_version", { length: 80 }),
  consentCapturedAt: timestamp("consent_captured_at", { withTimezone: true }),
  consentRevokedAt: timestamp("consent_revoked_at", { withTimezone: true }),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const apiUsageDaily = pgTable("api_usage_daily", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: varchar("provider", { length: 100 }).notNull(),
  endpoint: varchar("endpoint", { length: 220 }).notNull(),
  usageDate: date("usage_date").notNull(),
  requestCount: integer("request_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  quotaLimit: integer("quota_limit"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
