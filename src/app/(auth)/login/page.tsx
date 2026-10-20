import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await readSession()) redirect("/dashboard");

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand"><span>PK</span> LASER OS</div>
        <p className="eyebrow">CỔNG NHÂN SỰ NỘI BỘ</p>
        <h1>Đăng nhập hệ thống</h1>
        <p className="subtitle">Sử dụng tài khoản được PK LASER cấp để tiếp tục.</p>
        <LoginForm />
      </section>
    </main>
  );
}
