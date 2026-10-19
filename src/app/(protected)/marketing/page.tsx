import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { contentItems, leads, marketingCampaigns } from "@/db/schema";
import { readSession } from "@/lib/session";
import { logout } from "../dashboard/actions";
import { createCampaign, createContentDraft, createLead } from "./actions";

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

const formStyle = { display: "grid", gap: 12, marginTop: 16 } as const;
const fieldStyle = {
  width: "100%",
  border: "1px solid var(--line)",
  borderRadius: 10,
  background: "rgba(255,255,255,.055)",
  color: "white",
  padding: "12px 13px",
  font: "inherit",
} as const;
const labelStyle = { display: "grid", gap: 7, color: "#c7ccd3", fontSize: 13 } as const;

export default async function MarketingPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role === "technical") redirect("/dashboard");

  let metrics = { leads: 0, newLeads: 0, campaigns: 0, contentDrafts: 0, connected: false };
  let recentLeads: Array<{ name: string; company: string | null; productInterest: string | null; status: string }> = [];
  let recentCampaigns: Array<{ name: string; channel: string; status: string }> = [];
  let recentContent: Array<{ title: string; channel: string; status: string }> = [];

  try {
    const db = getDb();
    const [leadTotal, newLeadTotal, campaignTotal, draftTotal, leadRows, campaignRows, contentRows] = await Promise.all([
      db.select({ value: count() }).from(leads),
      db.select({ value: count() }).from(leads).where(eq(leads.status, "new")),
      db.select({ value: count() }).from(marketingCampaigns),
      db.select({ value: count() }).from(contentItems).where(eq(contentItems.status, "draft")),
      db.select({ name: leads.name, company: leads.company, productInterest: leads.productInterest, status: leads.status })
        .from(leads).orderBy(desc(leads.createdAt)).limit(5),
      db.select({ name: marketingCampaigns.name, channel: marketingCampaigns.channel, status: marketingCampaigns.status })
        .from(marketingCampaigns).orderBy(desc(marketingCampaigns.createdAt)).limit(5),
      db.select({ title: contentItems.title, channel: contentItems.channel, status: contentItems.status })
        .from(contentItems).orderBy(desc(contentItems.createdAt)).limit(5),
    ]);
    metrics = {
      leads: leadTotal[0]?.value ?? 0,
      newLeads: newLeadTotal[0]?.value ?? 0,
      campaigns: campaignTotal[0]?.value ?? 0,
      contentDrafts: draftTotal[0]?.value ?? 0,
      connected: true,
    };
    recentLeads = leadRows;
    recentCampaigns = campaignRows;
    recentContent = contentRows;
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

      <section className="grid" style={{ marginTop: 28, alignItems: "start" }}>
        <article className="card">
          <p className="eyebrow">LEAD INTAKE</p>
          <h2>Ghi nhận khách hàng tiềm năng</h2>
          <p className="subtitle">Dành cho lead đã có nguồn hợp lệ. Chỉ xác nhận đồng ý liên hệ khi khách thực sự cho phép.</p>
          <form action={createLead} style={formStyle}>
            <label style={labelStyle}>Tên người liên hệ<input name="name" minLength={2} maxLength={180} required style={fieldStyle} /></label>
            <label style={labelStyle}>Doanh nghiệp<input name="company" maxLength={200} style={fieldStyle} /></label>
            <div className="grid">
              <label style={labelStyle}>Email<input name="email" type="email" maxLength={254} style={fieldStyle} /></label>
              <label style={labelStyle}>Điện thoại<input name="phone" type="tel" maxLength={40} style={fieldStyle} /></label>
            </div>
            <label style={labelStyle}>Tỉnh/thành<input name="province" maxLength={100} style={fieldStyle} /></label>
            <label style={labelStyle}>Sản phẩm quan tâm<input name="productInterest" maxLength={180} style={fieldStyle} placeholder="Máy cắt laser, thấu kính, nozzle..." /></label>
            <label style={labelStyle}>Nhu cầu<textarea name="requirement" maxLength={3000} style={fieldStyle} rows={2} /></label>
            <div className="grid">
              <label style={labelStyle}>Nguồn<input name="source" maxLength={120} style={fieldStyle} placeholder="website, referral..." /></label>
              <label style={labelStyle}>Medium<input name="medium" maxLength={120} style={fieldStyle} placeholder="organic, social..." /></label>
            </div>
            <label style={labelStyle}>Chiến dịch<input name="campaign" maxLength={180} style={fieldStyle} /></label>
            <label style={{ display: "flex", alignItems: "start", gap: 10, color: "#c7ccd3", fontSize: 13 }}>
              <input name="consentToContact" type="checkbox" required style={{ marginTop: 3 }} />
              Đã có căn cứ hợp lệ để PK LASER liên hệ khách về yêu cầu sản phẩm/dịch vụ này.
            </label>
            <button className="primary-button" type="submit">Lưu lead</button>
          </form>
        </article>
        <article className="card">
          <p className="eyebrow">LEAD GẦN ĐÂY</p>
          <h2>Pipeline khách hàng</h2>
          {recentLeads.length === 0 ? <p className="subtitle">Chưa có lead nào được ghi nhận.</p> : recentLeads.map((item) => (
            <div key={item.name + item.status} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <strong>{item.name}</strong><p className="subtitle">{item.company || "Chưa nhập doanh nghiệp"} · {item.productInterest || "Chưa phân loại"} · {item.status}</p>
            </div>
          ))}
        </article>
      </section>

      <section className="grid" style={{ marginTop: 28, alignItems: "start" }}>
        <article className="card">
          <p className="eyebrow">CAMPAIGN BUILDER</p>
          <h2>Tạo chiến dịch</h2>
          <form action={createCampaign} style={formStyle}>
            <label style={labelStyle}>Tên chiến dịch<input name="name" minLength={3} maxLength={180} required style={fieldStyle} placeholder="Ví dụ: Phụ tùng laser tháng 11" /></label>
            <label style={labelStyle}>Kênh
              <select name="channel" required defaultValue="seo" style={fieldStyle}>
                <option value="seo">SEO</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="zalo">Zalo OA</option><option value="email">Email</option><option value="website">Website</option><option value="other">Khác</option>
              </select>
            </label>
            <label style={labelStyle}>Mục tiêu<textarea name="objective" maxLength={2000} style={fieldStyle} rows={2} placeholder="Sản phẩm, khách hàng mục tiêu, mục tiêu lead..." /></label>
            <div className="grid">
              <label style={labelStyle}>UTM source<input name="utmSource" maxLength={120} style={fieldStyle} placeholder="google" /></label>
              <label style={labelStyle}>UTM medium<input name="utmMedium" maxLength={120} style={fieldStyle} placeholder="organic" /></label>
            </div>
            <label style={labelStyle}>UTM campaign<input name="utmCampaign" maxLength={180} style={fieldStyle} placeholder="phu-tung-laser-q4" /></label>
            <button className="primary-button" type="submit">Lưu chiến dịch nháp</button>
          </form>
        </article>

        <article className="card">
          <p className="eyebrow">CONTENT STUDIO</p>
          <h2>Tạo nội dung cần sản xuất</h2>
          <form action={createContentDraft} style={formStyle}>
            <label style={labelStyle}>Tiêu đề<input name="title" minLength={3} maxLength={220} required style={fieldStyle} placeholder="Ví dụ: 5 dấu hiệu thấu kính bảo vệ bị bẩn" /></label>
            <div className="grid">
              <label style={labelStyle}>Kênh
                <select name="channel" defaultValue="seo" style={fieldStyle}>
                  <option value="seo">SEO</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="zalo">Zalo OA</option><option value="email">Email</option><option value="website">Website</option><option value="other">Khác</option>
                </select>
              </label>
              <label style={labelStyle}>Định dạng
                <select name="contentType" defaultValue="seo_article" style={fieldStyle}>
                  <option value="seo_article">Bài SEO</option><option value="social_post">Bài mạng xã hội</option><option value="video_script">Kịch bản video</option><option value="email">Email</option><option value="technical_guide">Hướng dẫn kỹ thuật</option>
                </select>
              </label>
            </div>
            <label style={labelStyle}>Chủ đề / dàn ý<textarea name="topic" minLength={5} maxLength={3000} required style={fieldStyle} rows={3} placeholder="Nêu vấn đề khách hàng, ý kỹ thuật cần xác minh và góc triển khai..." /></label>
            <label style={labelStyle}>Lời kêu gọi hành động<textarea name="callToAction" maxLength={1000} style={fieldStyle} rows={2} placeholder="Ví dụ: Gửi model máy để PK LASER kiểm tra phụ tùng phù hợp." /></label>
            <label style={labelStyle}>Nguồn kỹ thuật cần đối chiếu<textarea name="sourceNotes" maxLength={2000} style={fieldStyle} rows={2} placeholder="Manual, model linh kiện, dữ liệu đã xác minh..." /></label>
            <button className="primary-button" type="submit">Lưu bản nháp</button>
          </form>
        </article>
      </section>

      <section className="grid" style={{ marginTop: 28, alignItems: "start" }}>
        <article className="card">
          <p className="eyebrow">CHIẾN DỊCH GẦN ĐÂY</p>
          <h2>Campaigns</h2>
          {recentCampaigns.length === 0 ? <p className="subtitle">Chưa có chiến dịch nào được tạo.</p> : recentCampaigns.map((item) => (
            <div key={item.name} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <strong>{item.name}</strong><p className="subtitle">{item.channel} · {item.status}</p>
            </div>
          ))}
        </article>
        <article className="card">
          <p className="eyebrow">NỘI DUNG GẦN ĐÂY</p>
          <h2>Content pipeline</h2>
          {recentContent.length === 0 ? <p className="subtitle">Chưa có nội dung nào được tạo.</p> : recentContent.map((item) => (
            <div key={item.title} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <strong>{item.title}</strong><p className="subtitle">{item.channel} · {item.status}</p>
            </div>
          ))}
        </article>
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
        <p className="subtitle">Hiện chưa có API key, chưa gửi chiến dịch và chưa tự động đăng bài. Nội dung cần được con người duyệt trước khi xuất bản.</p>
      </section>
    </main>
  );
}
