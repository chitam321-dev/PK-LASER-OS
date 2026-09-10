"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/session";

export type LoginState = { error?: string };

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const input = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!input.success) return { error: "Email hoặc mật khẩu không hợp lệ." };

  let user: typeof users.$inferSelect | undefined;
  try {
    [user] = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, input.data.email.toLowerCase()))
      .limit(1);
  } catch {
    return { error: "Không thể kết nối hệ thống. Vui lòng thử lại." };
  }

  if (!user || !(await compare(input.data.password, user.passwordHash))) {
    return { error: "Email hoặc mật khẩu không chính xác." };
  }

  await createSession({
    userId: user.id,
    name: user.name,
    role: user.role,
  });

  redirect("/dashboard");
}
