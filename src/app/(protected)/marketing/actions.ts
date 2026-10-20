"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { contentItems, leads, marketingCampaigns } from "@/db/schema";
import { readSession } from "@/lib/session";

const campaignSchema = z.object({
  name: z.string().trim().min(3).max(180),
  objective: z.string().trim().max(2000).optional(),
  channel: z.enum(["seo", "facebook", "instagram", "youtube", "zalo", "email", "website", "other"]),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(180).optional(),
});

const leadSchema = z.object({
  name: z.string().trim().min(2).max(180),
  company: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(254).or(z.literal("")).optional(),
  phone: z.string().trim().max(40).optional(),
  province: z.string().trim().max(100).optional(),
  productInterest: z.string().trim().max(180).optional(),
  requirement: z.string().trim().max(3000).optional(),
  source: z.string().trim().max(120).optional(),
  medium: z.string().trim().max(120).optional(),
  campaign: z.string().trim().max(180).optional(),
  consentToContact: z.literal("on"),
}).refine((data) => Boolean(data.email || data.phone), { message: "Cần có email hoặc số điện thoại." });

const contentSchema = z.object({
  title: z.string().trim().min(3).max(220),
  channel: z.enum(["seo", "facebook", "instagram", "youtube", "zalo", "email", "website", "other"]),
  contentType: z.enum(["seo_article", "social_post", "video_script", "email", "technical_guide"]),
  topic: z.string().trim().min(5).max(3000),
  callToAction: z.string().trim().max(1000).optional(),
  sourceNotes: z.string().trim().max(2000).optional(),
});

async function requireMarketingAccess() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && session.role !== "sales") redirect("/dashboard");
  return session;
}

export async function createCampaign(formData: FormData) {
  const session = await requireMarketingAccess();
  const parsed = campaignSchema.safeParse({
    name: formData.get("name"),
    objective: formData.get("objective") || undefined,
    channel: formData.get("channel"),
    utmSource: formData.get("utmSource") || undefined,
    utmMedium: formData.get("utmMedium") || undefined,
    utmCampaign: formData.get("utmCampaign") || undefined,
  });
  if (!parsed.success) throw new Error("Dữ liệu chiến dịch không hợp lệ.");

  await getDb().insert(marketingCampaigns).values({
    name: parsed.data.name,
    objective: parsed.data.objective,
    channel: parsed.data.channel,
    utmSource: parsed.data.utmSource,
    utmMedium: parsed.data.utmMedium,
    utmCampaign: parsed.data.utmCampaign,
    ownerId: session.userId,
    status: "draft",
  });
  revalidatePath("/marketing");
}

export async function createContentDraft(formData: FormData) {
  const session = await requireMarketingAccess();
  const parsed = contentSchema.safeParse({
    title: formData.get("title"),
    channel: formData.get("channel"),
    contentType: formData.get("contentType"),
    topic: formData.get("topic"),
    callToAction: formData.get("callToAction") || undefined,
    sourceNotes: formData.get("sourceNotes") || undefined,
  });
  if (!parsed.success) throw new Error("Dữ liệu nội dung không hợp lệ.");

  await getDb().insert(contentItems).values({
    title: parsed.data.title,
    channel: parsed.data.channel,
    contentType: parsed.data.contentType,
    topic: parsed.data.topic,
    callToAction: parsed.data.callToAction,
    sourceNotes: parsed.data.sourceNotes,
    status: "draft",
    createdBy: session.userId,
  });
  revalidatePath("/marketing");
}


export async function createLead(formData: FormData) {
  await requireMarketingAccess();
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    province: formData.get("province") || undefined,
    productInterest: formData.get("productInterest") || undefined,
    requirement: formData.get("requirement") || undefined,
    source: formData.get("source") || undefined,
    medium: formData.get("medium") || undefined,
    campaign: formData.get("campaign") || undefined,
    consentToContact: formData.get("consentToContact"),
  });
  if (!parsed.success) throw new Error("Thông tin lead chưa hợp lệ; cần tên, email hoặc điện thoại và xác nhận quyền liên hệ.");

  const now = new Date();
  await getDb().insert(leads).values({
    name: parsed.data.name,
    company: parsed.data.company,
    email: parsed.data.email || null,
    phone: parsed.data.phone,
    province: parsed.data.province,
    productInterest: parsed.data.productInterest,
    requirement: parsed.data.requirement,
    source: parsed.data.source || "internal",
    medium: parsed.data.medium || "manual",
    campaign: parsed.data.campaign,
    consentToContact: true,
    consentPurpose: "Respond to product or service inquiry",
    consentPolicyVersion: "2026-10-v1",
    consentCapturedAt: now,
  });
  revalidatePath("/marketing");
}
