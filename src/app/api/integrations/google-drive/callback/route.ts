import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { getDb } from "@/db";
import { googleDriveConnections } from "@/db/schema";
import { encryptGoogleDriveTokenBundle } from "@/lib/google-drive/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
};

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function settingsRedirect(request: NextRequest, result: string) {
  const url = new URL("/settings/integrations", request.url);
  url.searchParams.set("googleDrive", result);
  const response = NextResponse.redirect(url);
  response.cookies.set("pk_google_drive_oauth_state", "", { path: "/api/integrations/google-drive", maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
  return response;
}

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập lại." }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Không đủ quyền." }, { status: 403 });

  const query = request.nextUrl.searchParams;
  if (query.get("error")) return settingsRedirect(request, "cancelled");

  const state = query.get("state") ?? "";
  const expectedState = request.cookies.get("pk_google_drive_oauth_state")?.value ?? "";
  const code = query.get("code") ?? "";
  if (!state || !expectedState || !safeEqual(state, expectedState) || !code) {
    return settingsRedirect(request, "invalid_state");
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri ||
      !process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY || !process.env.DATABASE_URL) {
    return settingsRedirect(request, "not_configured");
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const tokens = await tokenResponse.json() as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokens.access_token || !tokens.refresh_token) {
      return settingsRedirect(request, "token_exchange_failed");
    }

    const aboutResponse = await fetch(
      "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress,displayName)",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!aboutResponse.ok) return settingsRedirect(request, "account_lookup_failed");
    const about = await aboutResponse.json() as {
      user?: { emailAddress?: string; displayName?: string };
    };
    const googleEmail = about.user?.emailAddress;
    if (!googleEmail) return settingsRedirect(request, "account_email_missing");

    const now = new Date();
    const tokenBundle = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenType: tokens.token_type ?? "Bearer",
      scope: tokens.scope ?? "",
      expiresAt: now.getTime() + Math.max(60, tokens.expires_in ?? 3600) * 1000,
    };
    const db = getDb();
    await db.insert(googleDriveConnections).values({
      connectedBy: session.userId,
      googleEmail,
      encryptedTokenBundle: encryptGoogleDriveTokenBundle(tokenBundle),
      grantedScopes: tokens.scope ?? "",
      connectedAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: googleDriveConnections.connectedBy,
      set: {
        googleEmail,
        encryptedTokenBundle: encryptGoogleDriveTokenBundle(tokenBundle),
        grantedScopes: tokens.scope ?? "",
        connectedAt: now,
        updatedAt: now,
      },
    });

    return settingsRedirect(request, "connected");
  } catch {
    // Never return provider response bodies or token material to the browser.
    return settingsRedirect(request, "connection_failed");
  }
}
