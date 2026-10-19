import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import CopilotChat from "./copilot-chat";

export const dynamic = "force-dynamic";

export default async function AICopilotPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span>PK</span> LASER OS</div>
        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/dashboard">Trung tâm điều hành</Link>
          {session.role !== "technical" && <Link href="/marketing">Marketing</Link>}
        </nav>
      </header>
      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">AI WORKSPACE · GIAI ĐOẠN 1</p>
          <h1>PK LASER AI Copilot</h1>
          <p className="subtitle">Trợ lý phân tích và đề xuất, chưa có quyền thao tác hệ thống.</p>
        </div>
        <div className="access-badge">Chế độ chỉ đọc</div>
      </section>
      <section className="card" style={{ maxWidth: 920, margin: "0 auto" }}>
        <CopilotChat />
      </section>
    </main>
  );
}
