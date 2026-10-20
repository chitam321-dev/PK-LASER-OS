# Database baseline and migration safety gate

## Current verified facts

- The application database adapter in `src/db/index.ts` uses `@neondatabase/serverless` and Drizzle's Neon HTTP driver.
- The connection string is read from `DATABASE_URL`. The actual configured Preview/Production values and the live database contents have **not** been inspected.
- `drizzle.config.ts` loads `.env.local` and the environment, and points Drizzle Kit at `src/db/schema.ts`.
- `drizzle/meta/_journal.json` now orders `0001_core_schema` before `0002_marketing_growth`.
- `drizzle/0001_core_schema.sql` defines the core `users`, `machines`, and `service_tickets` tables for a new, empty PostgreSQL database. Its `IF NOT EXISTS` clauses are not a substitute for reviewing existing schema drift.
- `drizzle/0002_marketing_growth.sql` creates marketing enums and tables and depends on the core `users(id)` table.
- The application schema defines `users`, `machines`, `service_tickets`, marketing tables, and `api_usage_daily`. A schema declaration is not proof that these objects exist in the target database.

## Decision

**Migration is blocked for Preview and Production until the target database and baseline are confirmed.** Do not run `npm run db:migrate`, generate/apply a baseline migration against a live database, or create tables manually in a shared environment as part of this audit.

The source code suggests Neon/PostgreSQL is the adapter for this Next.js branch. It does not prove that this is the canonical database for the wider PK LASER OS system; earlier architecture notes also mention a separate Cloudflare Worker/D1 CRM. Resolve this explicitly before any dual-write, data transfer, or schema changes.

## Required safe verification sequence

1. In Vercel, an authorized project owner should confirm which environment owns `DATABASE_URL` (Preview vs Production) and identify the database/project without exposing the secret value in logs or chat.
2. Confirm the canonical source of truth with the team: Neon/PostgreSQL for this Next.js application, D1 for a Worker, or a documented split with clear ownership. Do not assume two databases are synchronized.
3. Create an isolated disposable/staging database. Never use production credentials for the initial inspection.
4. Capture a read-only inventory of schemas, tables, columns, enums, indexes, foreign keys, extensions, and migration history. Compare it to `src/db/schema.ts` and every SQL migration.
5. Take a provider-native backup/snapshot and export a separate backup. Record timestamp, target identifier, retention, and restore owner. Do not put credentials or connection strings in the evidence.
6. Restore the backup into an isolated database and verify row counts, constraints, and representative application queries. A backup is not accepted until restore is tested.
7. Reconcile the baseline. For a new, empty disposable database, the ordered `0001_core_schema` then `0002_marketing_growth` chain is available. If the target already contains core tables, do not run `0001_core_schema` as-is: inventory and compare the schema, then record a reviewed baseline without recreating or dropping existing objects.
8. Run migrations only against the disposable database, then run typecheck, lint, build, integration tests, and a second restore/rollback rehearsal.
9. Obtain review and explicit approval before any Preview database mutation. Production requires a separately approved change window, verified backup/restore, and rollback plan.

## Evidence required to unblock

- Canonical database decision and owner.
- Environment-to-database mapping (identifiers only; no secret values).
- Read-only schema inventory and diff report.
- Ordered migration journal, including the missing core baseline decision.
- Successful staging migration and restore evidence.
- CI green after dependency remediation and integration tests.
- Written approval before any shared database mutation.

## Status

Migration files and journal are prepared for review. No database was queried or mutated; no migration, backup, restore, or production deployment was run. The configured database target remains unverified.
