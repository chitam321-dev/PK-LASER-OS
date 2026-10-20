import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { readSession } from "@/lib/session";
import { setupFirstAdmin } from "./actions";

export default async function SetupAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await readSession();
  if (session) redirect("/dashboard");

  const [{ value: userCount }] = await getDb().select({ value: count() }).from(users);
  if (userCount > 0) redirect("/login");

  const { status } = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand"><span>PK</span> LASER OS</div>
        <p className="eyebrow">THIẾT LẬP BAN ĐẦU</p>
        <h1>Tạo quản trị viên đầu tiên</h1>
        <p className="subtitle">Chỉ mở khi hệ thống chưa có tài khoản. Hãy dùng mật khẩu riêng, tối thiểu 12 ký tự.</p>
        {status === "unavailable" && <p className="form-error" role="alert">Mã thiết lập không hợp lệ hoặc chưa được cấu hình.</p>}
        {status === "closed" && <p className="form-error" role="alert">Thiết lập đã đóng. Hãy đăng nhập bằng tài khoản hiện có.</p>}
        <form action={setupFirstAdmin} className="login-form">
          <label>Họ tên<input name="name" autoComplete="name" minLength={2} maxLength={160} required /></label>
          <label>Email công việc<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          <label>Mật khẩu<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          <label>Nhập lại mật khẩu<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          <label>Mã thiết lập một lần<input name="token" type="password" autoComplete="off" required /></label>
          <button className="primary-button" type="submit">Tạo tài khoản quản trị</button>
        </form>
        <p className="subtitle"><Link href="/login">Quay lại đăng nhập</Link></p>
      </section>
    </main>
  );
}
