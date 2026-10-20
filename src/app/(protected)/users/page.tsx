import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { readSession } from "@/lib/session";
import {
  changeManagedUserRole,
  createManagedUser,
  resetManagedUserPassword,
  setManagedUserActive,
} from "./actions";

const roleLabels = {
  admin: "Quản trị hệ thống",
  technical: "Kỹ thuật",
  sales: "Kinh doanh",
};

const statusMessages: Record<string, string> = {
  created: "Đã tạo tài khoản. Người dùng cần đổi mật khẩu khi đăng nhập lần đầu.",
  "email-exists": "Email này đã được sử dụng.",
  "role-updated": "Đã cập nhật quyền.",
  deactivated: "Đã khóa tài khoản. Quyền truy cập đã bị thu hồi.",
  activated: "Đã mở lại tài khoản.",
  "password-reset": "Đã đặt mật khẩu tạm. Người dùng sẽ phải đổi mật khẩu khi đăng nhập.",
  "last-admin": "Không thể xóa quyền hoặc khóa quản trị viên cuối cùng.",
  "self-change": "Không thể tự đổi quyền, khóa hoặc đặt lại mật khẩu tại trang này.",
  invalid: "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.",
  "not-found": "Không tìm thấy tài khoản.",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const [{ status }, accounts] = await Promise.all([
    searchParams,
    getDb().select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
    }).from(users).orderBy(asc(users.name)),
  ]);

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span>PK</span> LASER OS</div>
        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/dashboard">Trung tâm điều hành</a>
          <a href="/settings/integrations">Tích hợp</a>
        </nav>
      </header>

      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">QUẢN TRỊ HỆ THỐNG</p>
          <h1>Tài khoản và phân quyền</h1>
          <p className="subtitle">Tạo tài khoản nhân viên và cấp đúng quyền truy cập cho từng vai trò.</p>
        </div>
        <div className="access-badge">Chỉ quản trị viên</div>
      </section>

      {status && statusMessages[status] && (
        <p className="status" role="status">{statusMessages[status]}</p>
      )}

      <section className="card user-management">
        <h2>Tạo tài khoản</h2>
        <p className="subtitle">Mật khẩu tạm tối thiểu 12 ký tự. Người dùng sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu.</p>
        <form action={createManagedUser} className="user-create-form">
          <label>Họ tên<input name="name" maxLength={160} required /></label>
          <label>Email công việc<input name="email" type="email" maxLength={254} autoComplete="off" required /></label>
          <label>Mật khẩu tạm<input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
          <label>Vai trò
            <select name="role" defaultValue="technical">
              <option value="admin">Quản trị hệ thống</option>
              <option value="technical">Kỹ thuật</option>
              <option value="sales">Kinh doanh</option>
            </select>
          </label>
          <button className="primary-button" type="submit">Tạo tài khoản</button>
        </form>
      </section>

      <section className="card user-management">
        <h2>Danh sách tài khoản ({accounts.length})</h2>
        <div className="user-list">
          {accounts.map((account) => (
            <article className="user-row" key={account.id}>
              <div className="user-summary">
                <strong>{account.name}</strong>
                <span>{account.email}</span>
                <small>
                  {roleLabels[account.role]} · {account.isActive ? "Đang hoạt động" : "Đã khóa"}
                  {account.mustChangePassword ? " · Chờ đổi mật khẩu" : ""}
                  {" · Tạo ngày "}{account.createdAt.toLocaleDateString("vi-VN")}
                </small>
              </div>
              <div className="user-controls">
                {account.id !== session.userId ? (
                  <>
                    <form action={changeManagedUserRole} className="user-inline-form">
                      <input type="hidden" name="userId" value={account.id} />
                      <label className="visually-hidden" htmlFor={`role-${account.id}`}>Vai trò của {account.name}</label>
                      <select id={`role-${account.id}`} name="role" defaultValue={account.role}>
                        <option value="admin">Quản trị hệ thống</option>
                        <option value="technical">Kỹ thuật</option>
                        <option value="sales">Kinh doanh</option>
                      </select>
                      <button className="ghost-button" type="submit">Lưu quyền</button>
                    </form>
                    <form action={setManagedUserActive} className="user-inline-form">
                      <input type="hidden" name="userId" value={account.id} />
                      <input type="hidden" name="active" value={account.isActive ? "false" : "true"} />
                      <button className="ghost-button" type="submit">{account.isActive ? "Khóa tài khoản" : "Mở khóa"}</button>
                    </form>
                    <details>
                      <summary>Đặt lại mật khẩu</summary>
                      <form action={resetManagedUserPassword} className="user-reset-form">
                        <input type="hidden" name="userId" value={account.id} />
                        <label>Mật khẩu tạm mới
                          <input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required />
                        </label>
                        <button className="ghost-button" type="submit">Đặt lại</button>
                      </form>
                    </details>
                  </>
                ) : (
                  <span className="access-badge">Tài khoản hiện tại</span>
                )}
              </div>
            </article>
          ))}
          {accounts.length === 0 && <p>Chưa có tài khoản nào.</p>}
        </div>
      </section>
    </main>
  );
}
