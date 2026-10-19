import { z } from "zod";

export const knowledgeFileTypeSchema = z.enum(["pdf", "docx", "xlsx", "xls"]);
export const ingestionStatusSchema = z.enum([
  "queued",
  "validating",
  "extracting",
  "normalizing",
  "needs_review",
  "approved",
  "rejected",
  "ocr_required",
  "failed",
]);

export const knowledgeDomainSchema = z.enum([
  "engineering",
  "service",
  "inventory",
  "sales",
  "marketing",
  "finance",
  "operations",
  "other",
]);

export const knowledgeDocumentKindSchema = z.enum([
  "machine_manual",
  "alarm_code",
  "parts_catalogue",
  "sop",
  "service_report",
  "price_list",
  "contract",
  "spreadsheet_data",
  "other",
]);

export const sourceLocationSchema = z.object({
  page: z.number().int().positive().optional(),
  sheet: z.string().trim().min(1).max(160).optional(),
  cellRange: z.string().trim().min(1).max(120).optional(),
  headingPath: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  paragraphIndex: z.number().int().nonnegative().optional(),
}).refine(
  (location) =>
    location.page !== undefined ||
    location.sheet !== undefined ||
    location.cellRange !== undefined ||
    location.headingPath !== undefined ||
    location.paragraphIndex !== undefined,
  { message: "Mỗi trích đoạn phải có ít nhất một vị trí nguồn." },
);

export const extractedKnowledgeItemSchema = z.object({
  itemId: z.string().uuid(),
  sourceDocumentId: z.string().uuid(),
  sourceLocation: sourceLocationSchema,
  kind: z.enum(["text", "table", "technical_parameter", "part", "alarm", "procedure", "record"]),
  originalContent: z.string().max(100_000),
  normalizedContent: z.string().max(100_000).optional(),
  domain: knowledgeDomainSchema,
  documentKind: knowledgeDocumentKindSchema,
  tags: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  technicalValues: z.array(z.object({
    name: z.string().trim().min(1).max(160),
    rawValue: z.string().trim().min(1).max(500),
    normalizedValue: z.string().trim().min(1).max(500).optional(),
    unit: z.string().trim().max(40).optional(),
    context: z.string().trim().max(500).optional(),
    verified: z.boolean().default(false),
  })).max(100).default([]),
  confidence: z.number().min(0).max(1).optional(),
  warnings: z.array(z.string().trim().min(1).max(500)).max(100).default([]),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

export const ingestionJobSchema = z.object({
  jobId: z.string().uuid(),
  sourceDocumentId: z.string().uuid(),
  originalFilename: z.string().trim().min(1).max(255),
  fileType: knowledgeFileTypeSchema,
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  fileSizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
  status: ingestionStatusSchema,
  uploadedBy: z.string().trim().min(1).max(160),
  uploadedAt: z.string().datetime(),
  parserName: z.string().trim().min(1).max(120).optional(),
  parserVersion: z.string().trim().max(80).optional(),
  extractedItemCount: z.number().int().nonnegative().default(0),
  warnings: z.array(z.string().trim().min(1).max(500)).max(100).default([]),
  reviewedBy: z.string().trim().min(1).max(160).optional(),
  reviewedAt: z.string().datetime().optional(),
});

export type KnowledgeFileType = z.infer<typeof knowledgeFileTypeSchema>;
export type IngestionStatus = z.infer<typeof ingestionStatusSchema>;
export type KnowledgeDomain = z.infer<typeof knowledgeDomainSchema>;
export type KnowledgeDocumentKind = z.infer<typeof knowledgeDocumentKindSchema>;
export type SourceLocation = z.infer<typeof sourceLocationSchema>;
export type ExtractedKnowledgeItem = z.infer<typeof extractedKnowledgeItemSchema>;
export type IngestionJob = z.infer<typeof ingestionJobSchema>;
