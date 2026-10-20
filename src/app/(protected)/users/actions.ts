"use server";

import { hash } from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { readSession, type Role } from "@/lib/session";

const roleSchema = z.enum(["admin", "technical", "sales"]);
const createSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  role: roleSchema,
});
const idSchema = z.string().uuid();

async function requireAdmin() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");
  return session;
}

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field : "";
}

export async function createManagedUser(formData: FormData) {
  await requireAdmin();
  const parsed = createSchema.safeParse({
    name: value(formData, "name"),
    email: value(formData, "email").toLowerCase(),
    password: value(formData, "password"),
    role: value(formData, "role"),
  });
  if (!parsed.success) redirect("/users?status=invalid");

  const [created] = await getDb().insert(users).values({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hash(parsed.data.password, 12),
    role: parsed.data.role as Role,
    isActive: true,
    mustChangePassword: true,
  }).onConflictDoNothing({ target: users.email }).returning({ id: users.id });

  if (!created) redirect("/users?status=email-exists");
  redirect("/users?status=created");
}

export async function changeManagedUserRole(formData: FormData) {
  const session = await requireAdmin();
  const id = idSchema.safeParse(value(formData, "userId"));
  const role = roleSchema.safeParse(value(formData, "role"));
  if (!id.success || !role.success) redirect("/users?status=invalid");
  if (id.data === session.userId) redirect("/users?status=self-change");

  // Keep at least one active administrator even if two requests race.
  const [updated] = await getDb().update(users).set({ role: role.data })
    .where(and(
      eq(users.id, id.data),
      sql`(${users.role} <> 'admin' OR ${users.isActive} = false OR ${role.data} = 'admin' OR
        (SELECT count(*) FROM public.users WHERE role = 'admin' AND is_active = true) > 1)`,
    )).returning({ id: users.id });

  if (!updated) redirect("/users?status=last-admin");
  redirect("/users?status=role-updated");
}

export async function setManagedUserActive(formData: FormData) {
  const session = await requireAdmin();
  const id = idSchema.safeParse(value(formData, "userId"));
  const activeRaw = value(formData, "active");
  const active = activeRaw === "true";
  if (!id.success || !["true", "false"].includes(activeRaw)) redirect("/users?status=invalid");
  if (id.data === session.userId) redirect("/users?status=self-change");

  // Deactivation is immediate because sessions are checked against this row.
  const [updated] = await getDb().update(users).set({ isActive: active })
    .where(and(
      eq(users.id, id.data),
      sql`(${active} = true OR ${users.role} <> 'admin' OR ${users.isActive} = false OR
        (SELECT count(*) FROM public.users WHERE role = 'admin' AND is_active = true) > 1)`,
    )).returning({ id: users.id });

  if (!updated) redirect("/users?status=last-admin");
  redirect(active ? "/users?status=activated" : "/users?status=deactivated");
}

export async function resetManagedUserPassword(formData: FormData) {
  const session = await requireAdmin();
  const id = idSchema.safeParse(value(formData, "userId"));
  const password = z.string().min(12).max(128).safeParse(value(formData, "password"));
  if (!id.success || !password.success) redirect("/users?status=invalid");
  if (id.data === session.userId) redirect("/users?status=self-change");

  const [updated] = await getDb().update(users).set({
    passwordHash: await hash(password.data, 12),
    mustChangePassword: true,
  }).where(eq(users.id, id.data)).returning({ id: users.id });

  if (!updated) redirect("/users?status=not-found");
  redirect("/users?status=password-reset");
}
