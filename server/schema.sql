CREATE TABLE IF NOT EXISTS staff_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL DEFAULT 'RF',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'staff_members'
      AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE staff_members ALTER COLUMN employee_id DROP NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS work_areas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  required_people INTEGER NOT NULL DEFAULT 1 CHECK (required_people > 0),
  is_remaining BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  color VARCHAR(20) NOT NULL DEFAULT 'purple',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedules (
  id BIGSERIAL PRIMARY KEY,
  legacy_id BIGINT UNIQUE,
  department VARCHAR(100) NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  dates VARCHAR(150) NOT NULL,
  rotation JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(rotation) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS schedules_created_at_idx
  ON schedules (created_at DESC);
