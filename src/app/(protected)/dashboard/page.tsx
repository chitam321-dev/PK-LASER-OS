import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { logout } from "./actions";

const roleName = {
  admin: "Quản trị hệ thống",
  technical: "Kỹ thuật",
  sales: "Kinh doanh",
};

export default async function DashboardPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span>PK</span> LASER OS</div>
        <form action={logout}><button className="ghost-button">Đăng xuất</button></form>
      </header>
      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">TRUNG TÂM ĐIỀU HÀNH</p>
          <h1>Xin chào, {session.name}</h1>
          <p className="subtitle">Vai trò: {roleName[session.role]}</p>
        </div>
        <div className="access-badge">Phiên bảo mật · 8 giờ</div>
      </section>
      <section className="grid">
        <article className="card"><p>Phiếu kỹ thuật</p><strong>0</strong><small>Đang xử lý</small></article>
        <article className="card"><p>Máy móc</p><strong>0</strong><small>Được quản lý</small></article>
        <article className="card"><p>Kho phụ tùng</p><strong>0</strong><small>Cần bổ sung</small></article>
        <article className="card"><p>Kinh doanh</p><strong>0 ₫</strong><small>Doanh thu tháng</small></article>
      </section>
    </main>
  );
}
