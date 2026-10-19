import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedHosts = new Set(["pklaser.vn", "www.pklaser.vn"]);

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "sales")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawUrl = request.nextUrl.searchParams.get("url") || "https://pklaser.vn/";
  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "URL không hợp lệ." }, { status: 400 });
  }

  if (
    target.protocol !== "https:" ||
    !allowedHosts.has(target.hostname.toLowerCase()) ||
    target.username ||
    target.password ||
    target.port
  ) {
    return NextResponse.json(
      { error: "Chỉ cho phép kiểm tra URL HTTPS thuộc pklaser.vn." },
      { status: 400 },
    );
  }

  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", target.toString());
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.append("category", "performance");
  endpoint.searchParams.append("category", "seo");
  endpoint.searchParams.append("category", "accessibility");
  if (process.env.PAGESPEED_API_KEY) {
    endpoint.searchParams.set("key", process.env.PAGESPEED_API_KEY);
  }

  try {
    const response = await fetch(endpoint, { next: { revalidate: 3600 } });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Google PageSpeed chưa trả kết quả. Kiểm tra quota hoặc API key rồi thử lại." },
        { status: 502 },
      );
    }

    const data = await response.json();
    const categories = data.lighthouseResult?.categories ?? {};
    const audits = data.lighthouseResult?.audits ?? {};
    const score = (name: string) => {
      const value = categories[name]?.score;
      return typeof value === "number" ? Math.round(value * 100) : null;
    };

    return NextResponse.json({
      url: target.toString(),
      strategy: "mobile",
      checkedAt: new Date().toISOString(),
      scores: {
        performance: score("performance"),
        seo: score("seo"),
        accessibility: score("accessibility"),
      },
      metrics: {
        largestContentfulPaint: audits["largest-contentful-paint"]?.displayValue ?? null,
        firstContentfulPaint: audits["first-contentful-paint"]?.displayValue ?? null,
        cumulativeLayoutShift: audits["cumulative-layout-shift"]?.displayValue ?? null,
        speedIndex: audits["speed-index"]?.displayValue ?? null,
      },
      source: "Google PageSpeed Insights API",
      cacheTtlSeconds: 3600,
    });
  } catch {
    return NextResponse.json(
      { error: "Không thể kết nối Google PageSpeed. Vui lòng thử lại sau." },
      { status: 502 },
    );
  }
}
