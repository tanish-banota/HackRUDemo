CREATE TABLE IF NOT EXISTS countdowns (
  id VARCHAR(8) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  target_date TIMESTAMPTZ NOT NULL,
  theme_accent VARCHAR(7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS countdowns_target_date_idx ON countdowns (target_date);
