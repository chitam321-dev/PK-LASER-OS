import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { changePassword } from "./actions";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  const { status } = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand"><span>PK</span> LASER OS</div>
        <p className="eyebrow">BẢO MẬT TÀI KHOẢN</p>
        <h1>Đổi mật khẩu</h1>
        <p className="subtitle">Tài khoản cần đặt mật khẩu riêng trước khi tiếp tục sử dụng hệ thống.</p>
        {status === "invalid" && <p className="form-error" role="alert">Mật khẩu phải có ít nhất 12 ký tự và hai ô phải trùng nhau.</p>}
        <form action={changePassword} className="login-form">
          <label>Mật khẩu mới<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          <label>Nhập lại mật khẩu<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          <button className="primary-button" type="submit">Lưu mật khẩu</button>
        </form>
      </section>
    </main>
  );
}
