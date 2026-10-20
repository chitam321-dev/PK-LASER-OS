"use client";

import { useCallback, useEffect, useState } from "react";

type ConnectionStatus = {
  connected: boolean;
  connection?: {
    googleEmail: string;
    grantedScopes: string;
    connectedAt: string;
    updatedAt: string;
  } | null;
  error?: string;
};

type SyncResult = {
  success?: boolean;
  scanned?: number;
  upserted?: number;
  truncated?: boolean;
  nextPageToken?: string | null;
  nextStep?: string;
  error?: string;
};

export default function GoogleDrivePanel() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pageToken, setPageToken] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations/google-drive/status", {
        cache: "no-store",
      });
      const data = await response.json() as ConnectionStatus;
      setStatus(response.ok ? data : { connected: false, error: data.error ?? "Không đọc được trạng thái." });
    } catch {
      setStatus({ connected: false, error: "Không thể kết nối tới API trạng thái." });
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function syncMetadata() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/integrations/google-drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageToken ? { pageToken } : {}),
        cache: "no-store",
      });
      const result = await response.json() as SyncResult;
      if (!response.ok) {
        setMessage(result.error ?? "Đồng bộ thất bại.");
        return;
      }
      setPageToken(result.nextPageToken ?? null);
      setMessage(
        `Đã quét ${result.scanned ?? 0} file metadata; cập nhật ${result.upserted ?? 0} bản ghi. ` +
        (result.truncated ? "Còn dữ liệu — nhấn tiếp tục đồng bộ." : "Đã quét hết các trang hiện có.") +
        " Nội dung file chưa được tải hoặc đưa vào AI.",
      );
      await refreshStatus();
    } catch {
      setMessage("Không thể hoàn tất đồng bộ. Vui lòng kiểm tra cấu hình server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" style={{ minHeight: 0 }}>
      <h2>Trạng thái kết nối</h2>
      {!status ? (
        <p className="subtitle">Đang kiểm tra kết nối…</p>
      ) : status.connected && status.connection ? (
        <>
          <p><strong>Đã kết nối:</strong> {status.connection.googleEmail}</p>
          <p className="subtitle">Phạm vi OAuth: {status.connection.grantedScopes || "Google không trả về chuỗi scope."}</p>
          <p className="subtitle">Kết nối lúc: {new Date(status.connection.connectedAt).toLocaleString("vi-VN")}</p>
        </>
      ) : (
        <p className="subtitle">{status.error ?? "Chưa kết nối Google Drive."}</p>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        <a className="primary-button" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 18px", textDecoration: "none" }} href="/api/integrations/google-drive/connect">
          {status?.connected ? "Kết nối lại Google Drive" : "Kết nối Google Drive"}
        </a>
        <button className="ghost-button" disabled={busy || !status?.connected} onClick={syncMetadata}>
          {busy ? "Đang đồng bộ…" : pageToken ? "Tiếp tục đồng bộ" : "Đồng bộ metadata"}
        </button>
        <button className="ghost-button" disabled={busy} onClick={() => void refreshStatus()}>
          Làm mới trạng thái
        </button>
      </div>

      {message ? <p className="status" role="status">{message}</p> : null}
      <p className="subtitle" style={{ marginTop: 24, fontSize: 14 }}>
        Bảo vệ dữ liệu: quyền chỉ đọc; token được mã hóa phía máy chủ; đồng bộ hiện chỉ lưu tên file, loại, phiên bản, thời gian sửa đổi và metadata cần thiết. Chưa tải nội dung file, chưa trích xuất, chưa lập chỉ mục và không có tài liệu nào được cấp cho AI ở bước này.
      </p>
    </section>
  );
}
