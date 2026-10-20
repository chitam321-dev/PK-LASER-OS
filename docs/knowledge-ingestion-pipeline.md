# PK LASER OS — Document Ingestion & Knowledge Pipeline

## Goal
Provide a controlled Google Drive-to-knowledge workflow for PDF, Word (.docx), and Excel (.xlsx/.xls) files, with direct upload as a secondary source. This pipeline is the source-ingestion layer for PK LASER Technical Brain. It must preserve Drive file/revision provenance and trace every normalized fact back to a source location.

## User workflow
1. An authorized employee selects files from an explicitly approved Google Drive folder, or uploads a file directly as a fallback.
2. Use a least-privilege, read-only Drive integration. Record Drive file ID, revision ID, MIME type and modified time; do not treat a shared web link as authorization.
3. Validate file extension, MIME type, size, page/sheet count and actual file signature. Reject unsupported, encrypted or malformed files with a clear reason.
4. Store a private processing copy only if required by the approved architecture, under a generated ID. Never expose a public file URL.
5. Create an ingestion job with status `queued`; processing runs asynchronously and reports progress.
5. Extract text/tables with format-specific parsers. For scanned PDFs, mark `ocr_required` until an approved OCR service is configured; do not silently treat empty text as a successful parse.
6. Normalize text, tables and units while preserving original value, source location and parser warnings.
7. Classify the document (manual, alarm/error code, parts catalogue, SOP, price list, service report, contract, other). Classification is a suggestion, not a source of truth.
8. Generate a preview of extracted content, metadata, duplicate candidates and low-confidence fields.
9. A reviewer approves, edits, rejects or requests reprocessing. Only approved records enter the searchable knowledge index.
10. Query-time retrieval returns citations containing file name, revision, page/sheet/cell range, and approval status.

## Supported formats
- PDF: text-based PDFs first; page-level extraction. Scanned PDFs require OCR and page-image review.
- Word: .docx first; preserve headings, paragraphs, tables and document order. Legacy .doc requires conversion in a controlled worker, not a browser parser.
- Excel: .xlsx first; capture workbook, sheet, cell range, headers, formulas and displayed values. Preserve units and never merge rows solely because labels look similar. Legacy .xls needs an explicitly selected parser.
- Reject macro-enabled and executable formats by default. Treat all file content as untrusted data, never as system instructions.

## Normalized record shape
Every extracted item should carry:
- source: document ID, provider (`google_drive` or `direct_upload`), Drive file ID and revision ID when applicable, original filename, file hash, revision, page/sheet/cell range, parser and parser version;
- content: original text/value and normalized representation;
- classification: domain, entity type and suggested tags;
- quality: extraction status, confidence, warnings, duplicate candidates;
- governance: uploader, timestamps, reviewer, approval state and retention policy.

For technical values, store the raw value and normalized value separately. Keep unit, material, thickness, machine model, laser power, controller/head, gas, pressure, speed, focus offset and operating conditions as separate fields when available. Never infer a missing unit or silently convert an ambiguous value.

## Suggested architecture
- UI: authenticated Knowledge workspace with Drive folder/file picker, sync status, upload queue, preview, review and search.
- Source adapter: read-only Google Drive API integration scoped to an approved folder; support manual sync first, then incremental changes after permission and reliability tests.
- API: authenticated source selection/sync-init, job-status, preview, approve/reject and search endpoints.
- Private object storage: original files and derived artifacts; generated object keys only.
- Processing worker: parser sandbox, malware scanning, OCR adapter, normalization, duplicate detection and extraction limits.
- Metadata store: ingestion jobs, source metadata, review state and approved normalized records.
- Retrieval: chunk approved text/tables with stable source references; hybrid keyword/vector retrieval can be added after the canonical database and storage are confirmed.

## Security and operational requirements
- Authorization checks on every endpoint; define allowed roles and document-level scopes.
- Allowlist extensions and validate MIME/signature; enforce upload, decompression, page, row, cell and processing-time limits.
- Protect against ZIP bombs, malformed files, formula injection, prompt injection, malicious links and data exfiltration.
- Do not execute macros, formulas, embedded scripts or document links.
- Never send an entire file to an external model by default. Minimize extracted data and disclose provider processing where applicable.
- Secrets stay server-side. Use private storage, short-lived upload authorization, malware scanning and redacted audit logs.
- Rate-limit uploads and processing; use idempotency keys and file hashes for duplicate detection.
- Keep originals immutable; version re-uploads instead of overwriting prior evidence.
- Deletion and retention policies must cover originals, extracted text, embeddings, logs and backups.

## Data and deployment gate
The application branch currently uses Drizzle with Neon/PostgreSQL, while previous project notes also mention a Cloudflare Worker/D1 CRM. The canonical production database and private object store are not yet verified. Google Drive is the desired source of documents, but the Google Drive connector is disabled by the workspace administrator and is not available to connect in this environment. Therefore live Drive browsing/sync cannot yet be tested here. Do not create OAuth credentials or service-account keys without explicit authorization. This design does not create tables, migrations, buckets, external provider connections, or production resources. Confirm an approved Drive integration path, ownership, environment mapping, schema inventory, backup/restore and approved storage first.

## Rollout plan
1. **Contract and design:** typed ingestion/job/source schemas, limits, statuses and review rules.
2. **Local/preview parser proof:** de-identified sample files; verify PDF/DOCX/XLSX extraction and source coordinates.
3. **Private upload + async jobs:** approved object store, queue and parser worker, with quotas and scanning.
4. **Review and approval UI:** human verifies extracted values before indexing.
5. **Read-only search/RAG:** only approved records; source citations required in answers.
6. **Evaluation:** test extraction fidelity, table accuracy, duplicate handling, citations, access control and prompt-injection resistance.
7. **Pilot:** a small curated corpus of manuals, Raytools catalogues, source manuals, controller alarms and approved service SOPs.

## Acceptance criteria
- Every approved fact links to an immutable original and exact source location.
- Unsupported/scanned/failed files are reported accurately; no silent empty success.
- Unreviewed extraction is excluded from the authoritative knowledge index.
- Duplicate uploads are detected by hash and surfaced for review.
- Sensitive files cannot be accessed across role or document scopes.
- No production DB/storage mutation occurs until the architecture gate is approved.
