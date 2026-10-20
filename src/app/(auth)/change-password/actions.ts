"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession, readSession } from "@/lib/session";

const passwordSchema = z.object({
  password: z.string().min(12).max(128),
  confirmation: z.string().min(12).max(128),
}).refine((input) => input.password === input.confirmation, {
  path: ["confirmation"],
});

export async function changePassword(formData: FormData) {
  const session = await readSession();
  if (!session) redirect("/login");

  const input = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });
  if (!input.success) redirect("/change-password?status=invalid");

  const [updated] = await getDb().update(users).set({
    passwordHash: await hash(input.data.password, 12),
    mustChangePassword: false,
  }).where(eq(users.id, session.userId)).returning({
    id: users.id,
    name: users.name,
    role: users.role,
  });
  if (!updated) redirect("/login");

  await createSession({
    userId: updated.id,
    name: updated.name,
    role: updated.role,
    mustChangePassword: false,
  });
  redirect("/dashboard");
}
