# Database baseline and migration safety gate

## Current verified facts

- The application uses Neon PostgreSQL through `@neondatabase/serverless` and Drizzle. The connection string is read from `DATABASE_URL`.
- The Neon project and main branch inspected in the console contain 58 public tables and 21 rows in the legacy `_migrations` history table.
- The legacy account table `public.tai_khoan` exists, with columns `id bigint`, `ten_dang_nhap`, `ten_hien_thi`, `vai_tro`, `pin_bam`, `dang_hoat_dong`, lockout counters/timestamps, and login timestamps. A read-only aggregate query returned **0 account rows**.
- The legacy tables `public.nhan_su` and `public.phien_dang_nhap` exist. No legacy account records are available to map from the inspected branch.
- The deployed application's login implementation uses the new `users` table (UUID id, email, bcrypt password hash, role). It does not authenticate against `tai_khoan`. The existing `scripts/seed-admin.ts` provisions the first application admin in `users`.
- The schema and migration files for `users`, `machines`, `service_tickets`, marketing tables, and Google Drive tables are absent from the inspected database. Existing legacy tables are separate from these application tables.
- `drizzle/0001_core_schema.sql` is the core baseline for the new application schema. `drizzle/0002_marketing_growth.sql` depends on `users`. Google Drive schema is tracked as `drizzle/0003_google_drive_integration.sql`.
- The legacy `_migrations` table and Drizzle's `__drizzle_migrations` journal are distinct. The Drizzle journal records only migrations applied by Drizzle; do not copy legacy history into it.

## Authentication decision

No `tai_khoan` accounts were present to map when this branch was inspected. Do not copy or reinterpret `pin_bam` as an email/password hash. Keep application login on the existing `users` model and provision its first admin with the reviewed seed process after staging migration. If another canonical database contains the accounts, stop and reconcile the environment mapping before migration.

## Decision

**Do not apply migrations to Production yet.** Although the application migrations are additive relative to the inspected table inventory, Production must first pass the staging, backup, restore, and login checks below. This repository's migration files are not proof that the target database is safe to modify.

The source code suggests Neon/PostgreSQL is the adapter for this Next.js application. It does not prove this is the canonical database for the wider PK LASER OS system; earlier architecture notes also mention a separate Cloudflare Worker/D1 CRM. Resolve ownership and synchronization explicitly before dual-write, data transfer, or schema changes.

## Required safe verification sequence

1. In Vercel, confirm the Production `DATABASE_URL` points to the intended Neon project and branch. Do not expose the connection string in logs or chat.
2. Confirm the canonical database and owner: Neon/PostgreSQL for this Next.js app, D1 for a Worker, or a documented split with clear ownership. Do not assume they are synchronized.
3. Create an isolated staging branch/database from the intended Production database.
4. Capture a read-only inventory of schemas, tables, columns, enums, indexes, foreign keys, extensions, row counts, and migration history. Compare it with `src/db/schema.ts` and all three ordered migrations.
5. Take a provider-native backup/snapshot and a separate export. Record target identifier and timestamp without credentials.
6. Restore the backup into an isolated database and verify row counts, constraints, and representative legacy application queries.
7. Apply `0001_core_schema`, `0002_marketing_growth`, and `0003_google_drive_integration` to staging through Drizzle. Do not run the superseded standalone SQL in `docs/migrations/`.
8. In staging, provision an application admin using the reviewed seed process. Verify email/password login, admin authorization, Google OAuth callback, encrypted token persistence, and metadata-only Drive sync. Keep real Production secrets and user data out of staging.
9. Test restore/rollback behavior and run the repository's typecheck, lint, build, and relevant integration tests.
10. Only after all staging evidence is green, schedule Production migration, confirm a fresh provider backup and rollback owner, then obtain explicit approval for the Production change window.

## Evidence required before Production migration

- Confirmed environment-to-database mapping and canonical database owner.
- Staging schema inventory and comparison report.
- Successful migration run on staging.
- Verified backup restore and rollback procedure.
- Successful application login and relevant integration checks on staging.
- Green CI for the migration branch.
- Approved Production change window.

## Status

A read-only inspection of the connected Neon project found the legacy tables and zero rows in `tai_khoan`. No database was modified. No Production migration, backup, restore, or admin seed was run.
