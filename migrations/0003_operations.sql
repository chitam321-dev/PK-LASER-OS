PRAGMA foreign_keys = ON;

ALTER TABLE machines ADD COLUMN installed_at TEXT;
ALTER TABLE machines ADD COLUMN warranty_until TEXT;
ALTER TABLE machines ADD COLUMN notes TEXT;

ALTER TABLE service_tickets ADD COLUMN title TEXT;
ALTER TABLE service_tickets ADD COLUMN confirmed_cause_code TEXT REFERENCES ai_causes(code) ON DELETE SET NULL;
ALTER TABLE service_tickets ADD COLUMN labor_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE service_tickets ADD COLUMN downtime_minutes INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS repair_actions (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('inspection','measurement','repair','replacement','calibration','test_run','note')),
  description TEXT NOT NULL,
  result TEXT,
  parts_json TEXT,
  minutes_spent INTEGER NOT NULL DEFAULT 0 CHECK (minutes_spent >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_repair_actions_ticket ON repair_actions(ticket_id, created_at);

CREATE TABLE IF NOT EXISTS machine_qr_tokens (
  machine_id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_ticket_opened_at ON service_tickets(opened_at);
CREATE INDEX IF NOT EXISTS idx_ticket_resolved_at ON service_tickets(resolved_at);
