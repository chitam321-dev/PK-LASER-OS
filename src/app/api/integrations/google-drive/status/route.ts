import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { getDb } from "@/db";
import { googleDriveConnections } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Không đủ quyền." }, { status: 403 });

  try {
    const [connection] = await getDb().select({
      googleEmail: googleDriveConnections.googleEmail,
      grantedScopes: googleDriveConnections.grantedScopes,
      connectedAt: googleDriveConnections.connectedAt,
      updatedAt: googleDriveConnections.updatedAt,
    }).from(googleDriveConnections)
      .where(eq(googleDriveConnections.connectedBy, session.userId))
      .limit(1);

    return NextResponse.json({
      connected: Boolean(connection),
      connection: connection ?? null,
      access: "read_only",
      approvalRequiredBeforeAiUse: true,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Chưa thể đọc trạng thái kết nối. Kiểm tra migration và cấu hình server." }, { status: 503 });
  }
}
