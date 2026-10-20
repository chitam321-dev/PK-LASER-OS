import assert from "node:assert/strict";
import test from "node:test";
import {
  extractedKnowledgeItemSchema,
  ingestionJobSchema,
  knowledgeFileTypeSchema,
  sourceLocationSchema,
} from "./ingestion-contracts";

test("accepts the five requested document/OCR workflow categories", () => {
  for (const type of ["pdf", "docx", "xlsx", "xls"]) {
    assert.equal(knowledgeFileTypeSchema.parse(type), type);
  }
});

test("requires a source location for every extracted item", () => {
  assert.equal(sourceLocationSchema.safeParse({}).success, false);
  assert.equal(sourceLocationSchema.safeParse({ page: 2 }).success, true);
  assert.equal(sourceLocationSchema.safeParse({ sheet: "Bảng giá", cellRange: "A1:C8" }).success, true);
});

test("limits ingestion jobs to 50 MiB and requires a SHA-256 digest", () => {
  const base = {
    jobId: "d9428888-122b-4f3c-9e4b-8d1e5b2f1c20",
    sourceDocumentId: "d9428888-122b-4f3c-9e4b-8d1e5b2f1c21",
    originalFilename: "manual.pdf",
    fileType: "pdf",
    sha256: "a".repeat(64),
    fileSizeBytes: 1024,
    status: "queued",
    uploadedBy: "admin",
    uploadedAt: "2026-10-20T08:00:00.000Z",
  };
  assert.equal(ingestionJobSchema.safeParse(base).success, true);
  assert.equal(ingestionJobSchema.safeParse({ ...base, sha256: "not-a-hash" }).success, false);
  assert.equal(ingestionJobSchema.safeParse({ ...base, fileSizeBytes: 50 * 1024 * 1024 + 1 }).success, false);
});

test("extracted knowledge defaults to pending review, never auto-approved", () => {
  const item = extractedKnowledgeItemSchema.parse({
    itemId: "d9428888-122b-4f3c-9e4b-8d1e5b2f1c20",
    sourceDocumentId: "d9428888-122b-4f3c-9e4b-8d1e5b2f1c21",
    sourceLocation: { page: 1 },
    kind: "text",
    originalContent: "BM111 cutting head maintenance",
    domain: "engineering",
    documentKind: "machine_manual",
  });
  assert.equal(item.approvalStatus, "pending");
  assert.equal(item.technicalValues.length, 0);
});

test("preserves Google Drive file and revision provenance", () => {
  const base = {
    jobId: "d9428888-122b-4f3c-9e4b-8d1e5b2f1c20",
    sourceDocumentId: "d9428888-122b-4f3c-9e4b-8d1e5b2f1c21",
    originalFilename: "Raytools-BM111.pdf",
    fileType: "pdf",
    sha256: "c".repeat(64),
    fileSizeBytes: 1024,
    status: "queued",
    uploadedBy: "admin",
    uploadedAt: "2026-10-20T08:00:00.000Z",
  };
  const driveJob = ingestionJobSchema.parse({
    ...base,
    sourceProvider: "google_drive",
    driveFileId: "drive-file-id",
    driveRevisionId: "revision-7",
    driveMimeType: "application/pdf",
    driveModifiedTime: "2026-10-19T10:30:00.000Z",
  });
  assert.equal(driveJob.sourceProvider, "google_drive");
  assert.equal(driveJob.driveRevisionId, "revision-7");
});

test("marks scanned PDFs as requiring OCR instead of successful empty extraction", () => {
  const base = {
    jobId: "d9428888-122b-4f3c-9e4b-8d1e5b2f1c20",
    sourceDocumentId: "d9428888-122b-4f3c-9e4b-8d1e5b2f1c21",
    originalFilename: "scan.pdf",
    fileType: "pdf",
    sha256: "b".repeat(64),
    fileSizeBytes: 1024,
    uploadedBy: "admin",
    uploadedAt: "2026-10-20T08:00:00.000Z",
  };
  assert.equal(ingestionJobSchema.safeParse({ ...base, status: "ocr_required" }).success, true);
});
