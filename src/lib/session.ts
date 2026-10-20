import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Role = "admin" | "technical" | "sales";

export type Session = {
  userId: string;
  name: string;
  role: Role;
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
    if (
      typeof payload.userId !== "string" ||
      typeof payload.name !== "string" ||
      !["admin", "technical", "sales"].includes(String(payload.role))
    ) return null;
    return payload as Session;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}
