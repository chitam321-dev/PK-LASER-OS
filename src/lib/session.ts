import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export type Role = "admin" | "technical" | "sales";

export type Session = {
  userId: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
};

const COOKIE_NAME = "pk_session";
const maxAge = 60 * 60 * 8;

function key() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET phải có ít nhất 32 ký tự");
  }
  return new TextEncoder().encode(value);
}

export async function createSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function readSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key());
    if (typeof payload.userId !== "string") return null;

    const [user] = await getDb().select({
      id: users.id,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      mustChangePassword: users.mustChangePassword,
    }).from(users).where(eq(users.id, payload.userId)).limit(1);

    if (!user || !user.isActive) {
      await deleteSession();
      return null;
    }

    // Read role and account status from the database so changes take effect
    // immediately, even while an older session cookie is still valid.
    return {
      userId: user.id,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}
