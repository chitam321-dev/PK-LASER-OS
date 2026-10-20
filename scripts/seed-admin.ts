import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { users } from "../src/db/schema";

const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password || password.length < 12) {
  throw new Error("Cần ADMIN_NAME, ADMIN_EMAIL và ADMIN_PASSWORD ít nhất 12 ký tự");
}

const db = getDb();
const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
if (existing) throw new Error("Tài khoản quản trị đã tồn tại");

await db.insert(users).values({
  name,
  email,
  passwordHash: await hash(password, 12),
  role: "admin",
});

console.log("Đã tạo tài khoản quản trị PK LASER");
