import {
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
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const serviceTickets = pgTable("service_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  machineId: uuid("machine_id").references(() => machines.id).notNull(),
  issueDetail: text("issue_detail").notNull(),
  status: ticketStatus("status").notNull().default("new"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
