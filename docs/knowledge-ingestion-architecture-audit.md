# PK LASER OS — Knowledge Ingestion Architecture Audit

**Audit date:** 2026-10-20  
**Branch:** `feature/marketing-growth-engine`  
**Scope:** read-only inspection of repository configuration and the latest Vercel preview deployment. No production database or storage was modified.

## Verified in repository

- The app is Next.js 16 with React 19.
- Database access is implemented through Drizzle ORM, `@neondatabase/serverless`, and PostgreSQL in `src/db/index.ts` and `drizzle.config.ts`.
- The current schema is in `src/db/schema.ts`; it contains users, machines, service tickets, marketing entities, and API usage records. No knowledge-ingestion tables were found in the inspected schema.
- Session authentication uses the `pk_session` cookie and roles `admin`, `technical`, and `sales` in `src/lib/session.ts`.
- The repo has no `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` at the inspected root paths.
- `.env.example` documents application and AI placeholders; no new secrets were created.
- Existing ingestion design and Zod contracts describe PDF, DOCX, XLSX, XLS, source locations, review states, and an `ocr_required` state.
- Google Drive is now specified as the primary source, with Drive file/revision provenance fields in ingestion jobs and direct upload retained as a fallback.
- The Google Drive connector was discovered but is disabled by the workspace administrator (`DISABLED_BY_ADMIN`, `NOT_AVAILABLE`), so live Drive listing or sync cannot be connected or tested from this environment.

## Latest preview build checked

The Vercel deployment for commit `119f223f0d16faab3abc417433f4d70492a830a2` is `READY`. Its build log contains “Build Completed” and lists the existing app routes. This verifies build completion for that commit only; it does not verify file extraction, upload persistence, OCR quality, or end-to-end review.

## Decisions intentionally not made

- The codebase points to Neon/PostgreSQL, but the canonical production database and environment mapping have not been verified.
- No object-storage bucket or private-upload mechanism was confirmed. Vercel function filesystem is not a durable document store.
- No queue/worker, malware scanning service, or OCR provider was confirmed.
- The current ingestion contracts are not a functioning upload pipeline. No production schema, migration, bucket, queue, parser dependency, or secret was created as part of this audit.

## Implementation gates

1. Confirm the canonical metadata database/environment and backup/restore expectations.
2. Obtain an administrator-approved, least-privilege read-only Google Drive integration scoped to the intended folder. Do not create OAuth credentials or service-account keys without explicit authorization.
3. Choose private object storage and a processing location that can enforce file-size, decompression, page/row/cell, CPU, and memory limits.
4. Select parsers for PDF, DOCX, XLSX and legacy XLS; verify package security, extraction fidelity, and source coordinates using de-identified sample documents.
5. Select an OCR adapter for scanned PDFs. Until configured and tested, scanned PDFs must remain `ocr_required`, not silently pass with empty text.
6. Implement source sync, immutable object keys, job idempotency, duplicate hashes, extraction preview, and audit records.
7. Implement mandatory human review. Only approved records may be retrieved by the AI knowledge layer.
8. Add schema/migrations and apply them only after explicit environment approval. Do not apply production migrations as part of preview work.

## Review policy

Newly extracted items must default to `pending`. Uploading or parsing a file must never make its content automatically authoritative. Extracted text is untrusted data and must not override system instructions.
