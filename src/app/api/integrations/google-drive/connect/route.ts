import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Chỉ quản trị viên mới được kết nối Google Drive." }, { status: 403 });
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json({
      error: "Google Drive OAuth chưa được cấu hình ở môi trường server.",
      requiredEnvironment: ["GOOGLE_DRIVE_CLIENT_ID", "GOOGLE_DRIVE_REDIRECT_URI"],
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const state = randomBytes(32).toString("base64url");
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", [
    "https://www.googleapis.com/auth/drive.readonly",
    "openid",
    "email",
  ].join(" "));
  authorizationUrl.searchParams.set("access_type", "offline");
  authorizationUrl.searchParams.set("prompt", "consent");
  authorizationUrl.searchParams.set("include_granted_scopes", "true");
  authorizationUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("pk_google_drive_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/integrations/google-drive",
    maxAge: 10 * 60,
  });
  return response;
}
