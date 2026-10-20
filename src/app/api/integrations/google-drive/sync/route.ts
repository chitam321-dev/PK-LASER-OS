import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { getDb } from "@/db";
import { googleDriveConnections, googleDriveSourceFiles } from "@/db/schema";
import { decryptGoogleDriveTokenBundle, encryptGoogleDriveTokenBundle } from "@/lib/google-drive/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  scope: string;
  expiresAt: number;
};

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  headRevisionId?: string;
  size?: string;
  owners?: Array<{ emailAddress?: string }>;
};

async function getAccessToken(bundle: TokenBundle) {
  if (bundle.expiresAt > Date.now() + 60_000) return bundle;
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("OAuth chưa được cấu hình");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: bundle.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const refreshed = await response.json() as {
    access_token?: string; expires_in?: number; scope?: string; token_type?: string;
  };
  if (!response.ok || !refreshed.access_token) throw new Error("Không thể làm mới quyền Google Drive");
  return {
    ...bundle,
    accessToken: refreshed.access_token,
    tokenType: refreshed.token_type ?? bundle.tokenType,
    scope: refreshed.scope ?? bundle.scope,
    expiresAt: Date.now() + Math.max(60, refreshed.expires_in ?? 3600) * 1000,
  };
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Chỉ quản trị viên mới được đồng bộ Drive." }, { status: 403 });

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 1_000) {
    return NextResponse.json({ error: "Yêu cầu quá lớn." }, { status: 413 });
  }

  try {
    const db = getDb();
    const [connection] = await db.select().from(googleDriveConnections)
      .where(eq(googleDriveConnections.connectedBy, session.userId)).limit(1);
    if (!connection) return NextResponse.json({ error: "Chưa kết nối Google Drive." }, { status: 409 });

    let bundle = decryptGoogleDriveTokenBundle<TokenBundle>(connection.encryptedTokenBundle);
    bundle = await getAccessToken(bundle);
    await db.update(googleDriveConnections).set({
      encryptedTokenBundle: encryptGoogleDriveTokenBundle(bundle),
      grantedScopes: bundle.scope,
      updatedAt: new Date(),
    }).where(eq(googleDriveConnections.id, connection.id));

    const syncedAt = new Date();
    let pageToken: string | undefined;
    let scanned = 0;
    let upserted = 0;
    const maxFilesPerRun = 5_000;

    do {
      const url = new URL("https://www.googleapis.com/drive/v3/files");
      url.searchParams.set("q", "trashed = false");
      url.searchParams.set("pageSize", "100");
      url.searchParams.set("orderBy", "name");
      url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType,modifiedTime,headRevisionId,size,owners(emailAddress))");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${bundle.accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) {
        return NextResponse.json({ error: "Google Drive từ chối yêu cầu đồng bộ. Kiểm tra quyền OAuth hoặc thử kết nối lại." }, { status: 502 });
      }
      const page = await response.json() as { files?: DriveFile[]; nextPageToken?: string };
      const files = page.files ?? [];
      for (const file of files) {
        if (!file.id || !file.name || !file.mimeType) continue;
        const revisionId = file.headRevisionId ?? null;
        await db.insert(googleDriveSourceFiles).values({
          driveFileId: file.id,
          connectedBy: session.userId,
          name: file.name.slice(0, 255),
          mimeType: file.mimeType.slice(0, 160),
          modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : null,
          revisionId,
          sizeBytes: file.size ?? null,
          ownerEmail: file.owners?.[0]?.emailAddress?.slice(0, 254) ?? null,
          reviewStatus: "pending",
          lastSyncedAt: syncedAt,
        }).onConflictDoUpdate({
          target: googleDriveSourceFiles.driveFileId,
          set: {
            name: file.name.slice(0, 255),
            mimeType: file.mimeType.slice(0, 160),
            modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : null,
            revisionId,
            sizeBytes: file.size ?? null,
            ownerEmail: file.owners?.[0]?.emailAddress?.slice(0, 254) ?? null,
            reviewStatus: sql`CASE WHEN ${googleDriveSourceFiles.revisionId} IS DISTINCT FROM ${revisionId} THEN 'pending' ELSE ${googleDriveSourceFiles.reviewStatus} END`,
            lastSyncedAt: syncedAt,
          },
        });
        upserted++;
      }
      scanned += files.length;
      pageToken = page.nextPageToken;
    } while (pageToken && scanned < maxFilesPerRun);

    return NextResponse.json({
      success: true,
      scanned,
      upserted,
      truncated: Boolean(pageToken),
      nextStep: "Đây mới là đồng bộ metadata; chưa tải nội dung, chưa trích xuất và chưa đưa bất kỳ tài liệu nào vào AI.",
      approvalRequiredBeforeAiUse: true,
      syncedAt: syncedAt.toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Đồng bộ thất bại. Kiểm tra cấu hình OAuth, khóa mã hóa và migration." }, { status: 503 });
  }
}
