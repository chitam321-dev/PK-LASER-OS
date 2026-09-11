import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/machines", "/tickets", "/inventory", "/sales"];

function sessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("pk_session")?.value;
  const key = sessionKey();
  if (!token || !key) return NextResponse.redirect(new URL("/login", request.url));

  try {
    await jwtVerify(token, key);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("pk_session");
    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/machines/:path*", "/tickets/:path*", "/inventory/:path*", "/sales/:path*"],
};
