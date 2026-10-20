-- Google Drive integration tables.
-- Requires the application users table from 0001_core_schema.
-- OAuth tokens remain encrypted at the application layer; never store raw tokens here.
CREATE TABLE IF NOT EXISTS google_drive_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_by uuid NOT NULL UNIQUE REFERENCES users(id),
  google_email varchar(254) NOT NULL,
  encrypted_token_bundle text NOT NULL,
  granted_scopes text NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS google_drive_source_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_file_id varchar(256) NOT NULL UNIQUE,
  connected_by uuid NOT NULL REFERENCES users(id),
  name varchar(255) NOT NULL,
  mime_type varchar(160) NOT NULL,
  modified_time timestamptz,
  revision_id varchar(256),
  size_bytes varchar(32),
  owner_email varchar(254),
  review_status varchar(20) NOT NULL DEFAULT 'pending',
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS google_drive_files_review_status_idx
  ON google_drive_source_files (review_status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS google_drive_files_connected_by_idx
  ON google_drive_source_files (connected_by);
