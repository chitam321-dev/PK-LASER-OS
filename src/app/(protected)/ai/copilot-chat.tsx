"use client";

import { FormEvent, useState } from "react";

type CopilotResponse = {
  answer?: string;
  error?: string;
  limitations?: string[];
};

export default function CopilotChat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [limitations, setLimitations] = useState<string[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAnswer("");
    setLimitations([]);
    setBusy(true);

    try {
      const response = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        cache: "no-store",
      });
      const data = (await response.json()) as CopilotResponse;
      if (!response.ok) throw new Error(data.error || "Không thể nhận câu trả lời.");
      setAnswer(data.answer || "");
      setLimitations(data.limitations || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div>
        <h2 style={{ marginTop: 0 }}>Bạn muốn giải quyết việc gì?</h2>
        <p className="subtitle">
          Hỏi về vận hành, bán hàng, marketing hoặc cách chẩn đoán kỹ thuật. Không nhập mật khẩu,
          mã API hay dữ liệu khách hàng nhạy cảm.
        </p>
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label htmlFor="copilot-question">Câu hỏi</label>
        <textarea
          id="copilot-question"
          name="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          minLength={3}
          maxLength={4000}
          required
          rows={6}
          placeholder="Ví dụ: Hãy lập checklist chẩn đoán máy laser cắt không đứt, nêu dữ liệu cần hỏi thêm và các bước an toàn..."
          style={{ width: "100%", resize: "vertical", padding: 12, borderRadius: 10, border: "1px solid var(--border, #d1d5db)", font: "inherit" }}
        />
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button type="submit" disabled={busy || question.trim().length < 3}>
            {busy ? "Đang phân tích..." : "Hỏi AI Copilot"}
          </button>
          <span className="subtitle" style={{ fontSize: 13 }}>{question.length}/4000 ký tự</span>
        </div>
      </form>
      {error && (
        <div role="alert" style={{ border: "1px solid #dc2626", borderRadius: 10, padding: 12 }}>
          <strong>Chưa thể trả lời</strong>
          <p style={{ marginBottom: 0 }}>{error}</p>
        </div>
      )}
      {answer && (
        <section aria-live="polite" style={{ border: "1px solid var(--border, #d1d5db)", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Phân tích của AI</h2>
          <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7 }}>{answer}</div>
          {limitations.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid var(--border, #d1d5db)" }}>
              <strong>Giới hạn hiện tại</strong>
              <ul>{limitations.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}
        </section>
      )}
      <p className="subtitle" style={{ fontSize: 13, marginBottom: 0 }}>
        Giai đoạn thử nghiệm: câu hỏi được gửi đến nhà cung cấp AI đã cấu hình. Copilot chưa truy cập dữ liệu nội bộ,
        không tự gửi tin nhắn, không cập nhật CRM và không thực hiện thay đổi hệ thống.
      </p>
    </div>
  );
}
