"use server";

import { hash } from "bcryptjs";
import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/session";

const setupSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  confirmation: z.string().min(12).max(128),
  token: z.string().min(1).max(256),
}).refine((input) => input.password === input.confirmation, {
  path: ["confirmation"],
});

export async function setupFirstAdmin(formData: FormData) {
  const input = setupSchema.safeParse({
    name: formData.get("name"),
    email: typeof formData.get("email") === "string" ? String(formData.get("email")).toLowerCase() : "",
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
    token: formData.get("token"),
  });
  const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
  if (!input.success || !expectedToken || input.data.token !== expectedToken) {
    redirect("/setup-admin?status=unavailable");
  }

  const db = getDb();
  const [{ value: userCount }] = await db.select({ value: count() }).from(users);
  if (userCount !== 0) redirect("/setup-admin?status=closed");

  const [admin] = await db.insert(users).values({
    name: input.data.name,
    email: input.data.email,
    passwordHash: await hash(input.data.password, 12),
    role: "admin",
    isActive: true,
    mustChangePassword: false,
  }).onConflictDoNothing({ target: users.email }).returning({
    id: users.id,
    name: users.name,
    role: users.role,
  });

  if (!admin) redirect("/setup-admin?status=closed");
  await createSession({
    userId: admin.id,
    name: admin.name,
    role: admin.role,
    mustChangePassword: false,
  });
  redirect("/dashboard");
}
