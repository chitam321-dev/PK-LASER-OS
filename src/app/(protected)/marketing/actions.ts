"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { contentItems, marketingCampaigns } from "@/db/schema";
import { readSession } from "@/lib/session";

const campaignSchema = z.object({
  name: z.string().trim().min(3).max(180),
  objective: z.string().trim().max(2000).optional(),
  channel: z.enum(["seo", "facebook", "instagram", "youtube", "zalo", "email", "website", "other"]),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(180).optional(),
});

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
