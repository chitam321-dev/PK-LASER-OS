import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { contentItems, leads, marketingCampaigns } from "@/db/schema";
import { readSession } from "@/lib/session";
import { logout } from "../dashboard/actions";

export const dynamic = "force-dynamic";

const channelIdeas = [
  {
    title: "SEO phụ tùng laser",
    detail: "Xây cụm bài về nozzle, ceramic ring, protective lens và lỗi thường gặp.",
    channel: "SEO",
  },
  {
    title: "Video chẩn đoán kỹ thuật",
    detail: "Mỗi video giải thích một lỗi máy và kết thúc bằng CTA yêu cầu hỗ trợ.",
    channel: "YouTube / Reels",
  },
  {
    title: "Chăm sóc khách hàng cũ",
    detail: "Phân nhóm theo máy, lịch bảo trì và vật tư tiêu hao; chỉ liên hệ khi có căn cứ phù hợp.",
    channel: "CRM",
  },
];

export default async function MarketingPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role === "technical") redirect("/dashboard");

  let metrics = { leads: 0, newLeads: 0, campaigns: 0, contentDrafts: 0, connected: false };
  try {
    const db = getDb();
    const [leadTotal, newLeadTotal, campaignTotal, draftTotal] = await Promise.all([
      db.select({ value: count() }).from(leads),
      db.select({ value: count() }).from(leads).where(eq(leads.status, "new")),
      db.select({ value: count() }).from(marketingCampaigns),
      db.select({ value: count() }).from(contentItems).where(eq(contentItems.status, "draft")),
    ]);
    metrics = {
      leads: leadTotal[0]?.value ?? 0,
      newLeads: newLeadTotal[0]?.value ?? 0,
      campaigns: campaignTotal[0]?.value ?? 0,
      contentDrafts: draftTotal[0]?.value ?? 0,
      connected: true,
    };
  } catch {
    // Schema/migration may not be applied yet. Keep the page useful without hiding that state.
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span>PK</span> LASER OS</div>
        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/dashboard">Tổng quan</Link>
          <form action={logout}><button className="ghost-button">Đăng xuất</button></form>
        </nav>
      </header>

      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">GROWTH ENGINE · MARKETING & SALES</p>
          <h1>Trung tâm tăng trưởng</h1>
          <p className="subtitle">Chào {session.name}. Tập trung vào lead đủ chất lượng, tốc độ phản hồi và doanh thu tạo ra.</p>
        </div>
        <div className="access-badge">Giai đoạn 1 · nền tảng</div>
      </section>

      {!metrics.connected && (
        <section className="card" style={{ marginBottom: 20, borderColor: "rgba(255,180,0,.4)" }}>
          <strong>Chưa kết nối dữ liệu marketing</strong>
          <p className="subtitle">Cần triển khai migration trên môi trường thử nghiệm trước khi dashboard đọc được số liệu. Chưa có dữ liệu mẫu nào được tạo.</p>
        </section>
      )}

      <section className="grid">
        <article className="card"><p>Lead trong CRM</p><strong>{metrics.leads}</strong><small>Tổng số lead đã ghi nhận</small></article>
        <article className="card"><p>Lead mới</p><strong>{metrics.newLeads}</strong><small>Cần được phân loại và phản hồi</small></article>
        <article className="card"><p>Chiến dịch</p><strong>{metrics.campaigns}</strong><small>Quản lý UTM và mục tiêu</small></article>
        <article className="card"><p>Bản nháp nội dung</p><strong>{metrics.contentDrafts}</strong><small>Chờ hoàn thiện và duyệt</small></article>
      </section>

      <section style={{ marginTop: 28 }}>
        <p className="eyebrow">LỘ TRÌNH TĂNG TRƯỞNG</p>
        <h2>Ưu tiên triển khai</h2>
        <div className="grid">
          {channelIdeas.map((idea) => (
            <article className="card" key={idea.title}>
              <small>{idea.channel}</small>
              <h3>{idea.title}</h3>
              <p className="subtitle">{idea.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 28 }} className="card">
        <p className="eyebrow">TÍCH HỢP API</p>
        <h2>Ưu tiên kết nối</h2>
        <p className="subtitle">1. Google Search Console · 2. PageSpeed Insights · 3. Telegram Bot API · 4. Google Analytics · 5. YouTube / Meta / Zalo OA theo quyền được cấp.</p>
        <p className="subtitle">Hiện đây là bảng điều hành nền tảng; chưa có API key, chưa gửi chiến dịch và chưa tự động đăng bài.</p>
      </section>
    </main>
  );
}
