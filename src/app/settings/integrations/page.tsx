import { readSession } from "@/lib/session";
import GoogleDrivePanel from "./google-drive-panel";

export const dynamic = "force-dynamic";

export default async function IntegrationsSettingsPage() {
  const session = await readSession();

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span>PK</span> LASER OS</div>
        <div className="environment">INTEGRATIONS</div>
      </header>
      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">KẾT NỐI DỮ LIỆU</p>
          <h1>Google Drive</h1>
          <p className="subtitle">
            Kết nối Drive ở chế độ chỉ đọc. Đồng bộ metadata trước; tài liệu chưa được tự động đưa vào kho tri thức AI.
          </p>
        </div>
        <a className="ghost-button" href="/">Về trang chính</a>
      </section>
      {!session ? (
        <section className="card">
          <h2>Cần đăng nhập</h2>
          <p className="subtitle">Hãy đăng nhập PK LASER OS bằng tài khoản được cấp quyền quản trị, sau đó mở lại trang này.</p>
        </section>
      ) : session.role !== "admin" ? (
        <section className="card">
          <h2>Không đủ quyền</h2>
          <p className="subtitle">Chỉ quản trị viên mới được kết nối hoặc đồng bộ Google Drive.</p>
        </section>
      ) : (
        <GoogleDrivePanel />
      )}
    </main>
  );
}
